import { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, Platform, ActivityIndicator, TextInput, StyleSheet, Image, Animated } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Audio } from 'expo-av';
import { useRouter } from 'expo-router';
import { X, Camera as CameraIcon, Upload, Mic, Square, Check, ArrowLeft, Play, Pause, Trash2, Sparkles } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { SilhouetteOverlay } from '../../components/camera/SilhouetteOverlay';
import { useCameraCapture } from '../../hooks/useCameraCapture';
import { useAudioRecorder } from '../../hooks/useAudioRecorder';
import { uploadMedia } from '../../lib/storage';
import { useActiveCat } from '../../lib/ActiveCatContext';
import ProcessingScreen from '../../components/camera/ProcessingScreen';
import { supabase } from '../../lib/supabase';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useCameraContext } from './_layout';

/**
 * Main Camera Screen for Fitty.
 * Handles the 3-step capture process: Top photo, Side photo, and Context (Voice/Text).
 * Manages permissions, camera state, audio recording state, and initiates the upload flow.
 * 
 * @returns React component rendering the camera UI and capture flow.
 */
export default function CameraScreen() {
  const router = useRouter();
  const { setProcessingState } = useCameraContext();
  const insets = useSafeAreaInsets();
  const [permission, requestPermission] = useCameraPermissions();
  const [audioPermissionResponse, requestAudioPermission] = Audio.usePermissions();
  const { activeCatId, setSelectedCheckId } = useActiveCat();
  const [userId, setUserId] = useState<string | null>(null);

  const { cameraRef, topPhoto, sidePhoto, isCapturing, capturePhoto, setManualPhoto, clearPhoto } = useCameraCapture();
  const { isRecording, recordingDuration, metering, startRecording, stopRecording, voiceNoteUri, clearVoiceNote } = useAudioRecorder();

  // Calculate a normalized level (0.1 to 1) from the raw decibel metering
  const rawLevel = metering === undefined ? -160 : metering;
  const normalizedLevel = Math.max(0.1, 1 - (rawLevel / -60));

  // States: 'top' -> 'side' -> 'voice' -> 'uploading'
  const [step, setStep] = useState<'top' | 'side' | 'voice' | 'uploading'>('top');
  const [fallbackText, setFallbackText] = useState('');

  // Audio Playback state
  const [playbackSound, setPlaybackSound] = useState<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackPosition, setPlaybackPosition] = useState(0);

  useEffect(() => {
    return () => {
      if (playbackSound) {
        playbackSound.unloadAsync();
      }
    };
  }, [playbackSound]);

  useEffect(() => {
    if (voiceNoteUri) {
      Audio.Sound.createAsync(
        { uri: voiceNoteUri },
        { shouldPlay: false }
      ).then(({ sound }) => {
        setPlaybackSound(sound);
        sound.setOnPlaybackStatusUpdate((status) => {
          if (status.isLoaded) {
            setIsPlaying(status.isPlaying);
            setPlaybackPosition(status.positionMillis);
            if (status.didJustFinish) {
              sound.setPositionAsync(0);
              setIsPlaying(false);
            }
          }
        });
      });
    } else {
      if (playbackSound) {
        playbackSound.unloadAsync();
        setPlaybackSound(null);
        setIsPlaying(false);
        setPlaybackPosition(0);
      }
    }
  }, [voiceNoteUri]);

  const togglePlayback = async () => {
    if (!playbackSound) return;
    if (isPlaying) {
      await playbackSound.pauseAsync();
    } else {
      await playbackSound.playAsync();
    }
  };
  const [catName, setCatName] = useState<string>('your cat');

  const currentPhoto = step === 'top' ? topPhoto : step === 'side' ? sidePhoto : null;

  useEffect(() => {
    if (!permission?.granted) requestPermission();
    if (!audioPermissionResponse?.granted) requestAudioPermission();

    // get user ID for storage paths
    supabase.auth.getSession().then(({ data }) => {
      if (data.session?.user) {
        setUserId(data.session.user.id);
      }
    });

    if (activeCatId) {
      supabase.from('cats').select('name').eq('id', activeCatId).single().then(({ data }) => {
        if (data) setCatName(data.name);
      });
    }
  }, [activeCatId]);

  const handleClose = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/');
    }
  };

  const handleCapturePhoto = async () => {
    if (step !== 'top' && step !== 'side') return;

    if (!permission?.granted) {
      const response = await requestPermission();
      if (!response?.granted) {
        if (Platform.OS === 'web') {
          window.alert('Camera access is blocked. Please enable it by clicking the lock icon in your browser URL bar.');
        }
        return;
      }
    }

    await capturePhoto(step);
    // We stay on the current step to show the preview
  };

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 0.8,
    });
    if (!result.canceled && result.assets && result.assets.length > 0) {
      setManualPhoto(step as 'top' | 'side', result.assets[0].uri);
      // We stay on the current step to show the preview
    }
  };

  const handleNext = () => {
    if (step === 'top') {
      setStep('side');
    } else if (step === 'side') {
      setStep('voice');
    }
  };

  const confirmPhoto = () => {
    handleNext();
  };

  const handleBack = () => {
    if (step === 'side') {
      setStep('top');
    } else if (step === 'voice') {
      setStep('side');
    } else {
      if (router.canGoBack()) {
        router.back();
      } else {
        router.replace('/');
      }
    }
  };

  const toggleRecording = async () => {
    if (!isRecording) {
      if (!audioPermissionResponse?.granted) {
        const response = await requestAudioPermission();
        if (!response?.granted) {
          if (Platform.OS === 'web') {
            window.alert('Microphone access is blocked. Please enable it by clicking the lock icon in your browser URL bar.');
          }
          return;
        }
      }
      await startRecording();
    } else {
      // Just stop, don't submit yet
      await stopRecording();
    }
  };

  const submitFallbackText = () => {
    handleFinalize(voiceNoteUri, fallbackText);
  };

  const handleFinalize = async (audioUri: string | null, text: string) => {
    if (!activeCatId || !userId) {
      console.error("Missing activeCatId or userId");
      return;
    }
    setStep('uploading');

    try {
      console.log("Mocking upload and results...");

      // Save context info to the CameraContext to hide it from URL params
      setProcessingState({
        hasVoiceNote: !!audioUri,
        hasTextNote: text.trim().length > 0
      });

      // Simulate backend processing time
      await new Promise((resolve) => setTimeout(resolve, 3000));
      const { data, error } = await supabase.from('health_checks').insert({
        cat_id: activeCatId,
        user_id: userId,
        top_photo_url: topPhoto || null,
        side_photo_url: sidePhoto || null,
        bcs_score: 7,
        classification: "Overweight",
        ai_reasoning: "The top-down photo shows a significantly widened abdominal profile without a discernible waistline. The side profile reveals a noticeable abdominal pad. Ribs are not easily palpable.",
        text_note: text.trim() || null,
        voice_note_url: audioUri || null,
        recommendations: [
          { title: "Nutrition", description: "Reduce daily caloric intake by 10%." },
          { title: "Exercise", description: "Encourage 15 minutes of active play twice a day." },
          { title: "Diet", description: "Switch to a high-protein, low-carb wet food diet." }
        ],
        status: "completed"
      }).select('id').single();
      
      if (error) throw error;
      
      // Fallback navigation in case realtime subscription in ProcessingScreen doesn't fire
      setTimeout(() => {
        setSelectedCheckId(data.id);
        router.push('/(tabs)/history');
      }, 500);
    } catch (error) {
      console.error("Failed to finalize capture:", error);
      setProcessingState({ hasVoiceNote: false, hasTextNote: false });
      setStep('voice'); // revert on error
    }
  };

  if (step === 'uploading') {
    return <ProcessingScreen />;
  }

  return (
    <View className="flex-1 bg-[#1A2530]">
      {/* Header Area Wrapper */}
      <View className="absolute top-0 left-0 right-0 z-20 bg-[#1A2530]" style={{ paddingBottom: 20, paddingTop: Math.max(insets.top + 32, 32) }}>
        <View className="flex-row justify-between items-center px-6 mb-4">
          <TouchableOpacity onPress={handleClose} className="w-10 h-10 rounded-full items-center justify-center">
            <X color="white" size={24} />
          </TouchableOpacity>
          <Text className="text-white font-bold text-lg">
            {step === 'top' ? 'Capture Top View' : step === 'side' ? 'Capture Side View' : 'Add Context'}
          </Text>
          <View className="w-10 h-10" />
        </View>

        {/* Progress Bar */}
        <View className="px-10">
          <View className="flex-row justify-between items-center">
            <View className={`h-1 flex-1 rounded-full ${step === 'top' || step === 'side' || step === 'voice' ? 'bg-primary-cool' : 'bg-white/20'}`} />
            <View className="w-2" />
            <View className={`h-1 flex-1 rounded-full ${step === 'side' || step === 'voice' ? 'bg-primary-cool' : 'bg-white/20'}`} />
            <View className="w-2" />
            <View className={`h-1 flex-1 rounded-full ${step === 'voice' ? 'bg-primary-cool' : 'bg-white/20'}`} />
          </View>
        </View>
      </View>

      {/* Main Content Area */}
      <View style={{ flex: 1 }}>
        {step !== 'voice' ? (
          <View className="flex-1 rounded-[40px] overflow-hidden bg-black/5" style={{ marginBottom: 120, marginTop: 120 }}>
            {currentPhoto ? (
              <>
                <Image source={{ uri: currentPhoto }} style={{ flex: 1 }} resizeMode="cover" />
                <SilhouetteOverlay type={step === 'top' ? 'top' : 'side'} />
              </>
            ) : (
              <CameraView style={{ flex: 1 }} facing="back" ref={cameraRef}>
                <SilhouetteOverlay type={step === 'top' ? 'top' : 'side'} />
              </CameraView>
            )}

            {/* Instructional Text Overlay */}
            <View className="absolute bottom-8 left-0 right-0 px-6 z-10 items-center pointer-events-none">
              <View className="bg-black/70 rounded-3xl px-6 py-4 backdrop-blur-xl border border-white/10 items-center">
                <Text className="text-[#74B7B5] text-xs font-bold tracking-[0.2em] uppercase mb-1">
                  {currentPhoto ? (step === 'top' ? 'Ready for Step 2' : 'Ready for Step 3') : (step === 'top' ? 'Step 1 of 3' : 'Step 2 of 3')}
                </Text>
                <Text className="text-white text-center text-base font-medium">
                  {currentPhoto
                    ? "Tap ✕ to retake or ✓ to continue"
                    : (step === 'top'
                      ? `Capture a photo of ${catName || 'your cat'} from above. Align with the silhouette.`
                      : `Capture a photo of ${catName || 'your cat'} from the side. Align with the silhouette.`)}
                </Text>
              </View>
            </View>
          </View>
        ) : (
          <View style={{ flex: 1, paddingHorizontal: 24, backgroundColor: '#F8FAFC', paddingTop: 140, paddingBottom: 260 }}>
            <Text className="text-[#EAB308] text-3xl font-black tracking-tight mb-2">
              How is {catName} feeling today?
            </Text>

            <Text className="text-[#64748B] text-lg mb-8">
              Optional — type your observations or record a voice note.
            </Text>

            <View className="w-full flex-1">
              {voiceNoteUri ? (
                <View className="flex-1 bg-white rounded-3xl shadow-sm border border-[#E2E8F0] items-center justify-center p-6">
                  <View className="flex-row items-center justify-between w-full mb-8">
                    <View className="w-12 h-12" />

                    <View className="items-center">
                      <Text className="text-[#1A2530] text-sm font-bold tracking-widest uppercase mb-1">
                        Voice Note
                      </Text>
                      <Text className="text-[#64748B] text-xs">Ready to submit</Text>
                    </View>

                    <View className="w-12 h-12" />
                  </View>

                  <TouchableOpacity onPress={togglePlayback} className="w-20 h-20 bg-[#EAB308] rounded-full items-center justify-center shadow-md mb-8">
                    {isPlaying ? <Pause color="white" size={32} fill="white" /> : <Play color="white" size={32} fill="white" style={{ marginLeft: 4 }} />}
                  </TouchableOpacity>

                  <View className="w-full h-1.5 bg-[#E2E8F0] rounded-full overflow-hidden mb-3">
                    <View className="h-full bg-[#EAB308]" style={{ width: `${(playbackSound ? (playbackPosition / Math.max(recordingDuration, 1)) * 100 : 0)}%` }} />
                  </View>
                  <View className="flex-row justify-between w-full">
                    <Text className="text-[#94A3B8] text-xs font-medium tabular-nums">
                      {Math.floor(playbackPosition / 60000).toString().padStart(2, '0')}:
                      {Math.floor((playbackPosition % 60000) / 1000).toString().padStart(2, '0')}
                    </Text>
                    <Text className="text-[#94A3B8] text-xs font-medium tabular-nums">
                      {Math.floor(recordingDuration / 60000).toString().padStart(2, '0')}:
                      {Math.floor((recordingDuration % 60000) / 1000).toString().padStart(2, '0')}
                    </Text>
                  </View>
                </View>
              ) : isRecording ? (
                <View className="flex-1 bg-[#FEFCE8] rounded-3xl shadow-sm border border-[#FDE047] items-center justify-center">
                  <View className="flex-row items-center justify-center space-x-1.5 h-16 mb-8">
                    <View className="w-2 bg-[#EAB308] rounded-full" style={{ height: Math.max(8, normalizedLevel * 24) }} />
                    <View className="w-2 bg-[#EAB308] rounded-full" style={{ height: Math.max(12, normalizedLevel * 48) }} />
                    <View className="w-2 bg-[#EAB308] rounded-full" style={{ height: Math.max(16, normalizedLevel * 64) }} />
                    <View className="w-2 bg-[#EAB308] rounded-full" style={{ height: Math.max(12, normalizedLevel * 48) }} />
                    <View className="w-2 bg-[#EAB308] rounded-full" style={{ height: Math.max(8, normalizedLevel * 24) }} />
                  </View>
                  <Text className="text-[#EAB308] text-sm font-bold tracking-[0.2em] uppercase mb-4">
                    Recording Note
                  </Text>
                  <Text className="text-[#1A2530] text-7xl font-black tabular-nums tracking-tighter">
                    {Math.floor(recordingDuration / 60000).toString().padStart(2, '0')}:
                    {Math.floor((recordingDuration % 60000) / 1000).toString().padStart(2, '0')}
                  </Text>
                  <Text className="text-[#94A3B8] font-medium mt-6">Maximum duration 2:00</Text>
                </View>
              ) : (
                <TextInput
                  className="text-[#1A2530] text-lg py-6 bg-white px-6 rounded-3xl shadow-sm flex-1 border border-[#E2E8F0] focus:border-primary-cool transition-colors"
                  placeholder="Type here or tap the mic below..."
                  placeholderTextColor="#94A3B8"
                  multiline
                  value={fallbackText}
                  onChangeText={setFallbackText}
                  style={{ outlineStyle: 'none', textAlignVertical: 'top' } as any}
                />
              )}
            </View>
          </View>
        )}

        {step === 'voice' && !isRecording && (
          <View className="absolute left-0 right-0 z-20 px-6 items-center pointer-events-none" style={{ bottom: 152 }}>
            <View className="bg-[#1A2530]/80 rounded-3xl px-6 py-4 backdrop-blur-xl border border-white/10 items-center shadow-lg pointer-events-auto">
              <Text className={`text-xs font-bold tracking-[0.2em] uppercase mb-1 ${(voiceNoteUri || fallbackText.trim().length > 0) ? 'text-[#EAB308]' : 'text-[#74B7B5]'}`}>
                {(voiceNoteUri || fallbackText.trim().length > 0) ? 'Ready to analyze' : 'Step 3 of 3'}
              </Text>
              <Text className="text-white text-center text-base font-medium">
                {(voiceNoteUri || fallbackText.trim().length > 0)
                  ? "Tap ✕ to clear or ✓ to continue"
                  : "Add context or tap ✓ to skip"}
              </Text>
            </View>
          </View>
        )}
      </View>

      {/* Bottom Controls Area Wrapper */}
      <View className="absolute bottom-0 left-0 right-0 z-20 bg-[#1A2530]" style={{ paddingBottom: Math.max(insets.bottom + 32, 32), paddingTop: 32 }}>
        <View className="flex-row justify-center items-center relative h-20">
          {/* Left Button (Back / Discard) */}
          <TouchableOpacity
            onPress={() => {
              if (currentPhoto) clearPhoto(step as 'top' | 'side');
              else if (step === 'voice' && voiceNoteUri) clearVoiceNote();
              else handleBack();
            }}
            disabled={step === 'voice' && isRecording}
            style={{ position: 'absolute', left: 56, width: 48, height: 48, backgroundColor: 'transparent', borderRadius: 24, alignItems: 'center', justifyContent: 'center', zIndex: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)', opacity: (step === 'voice' && isRecording) ? 0.3 : 1 }}
          >
            {(currentPhoto || (step === 'voice' && voiceNoteUri)) ? <X color="white" size={24} /> : <ArrowLeft color="white" size={24} />}
          </TouchableOpacity>

          {/* Center Button (Camera / Record) */}
          <TouchableOpacity
            onPress={step === 'voice' ? toggleRecording : handleCapturePhoto}
            disabled={
              step === 'voice'
                ? (fallbackText.trim().length > 0 || !!voiceNoteUri)
                : (isCapturing || !!currentPhoto)
            }
            style={
              step === 'voice'
                ? { width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center', backgroundColor: isRecording ? '#EAB308' : 'white', opacity: (fallbackText.trim().length > 0 || !!voiceNoteUri) ? 0.3 : 1 }
                : { width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center', borderWidth: 4, borderColor: (isCapturing || !!currentPhoto) ? '#94a3b8' : '#cbd5e1', backgroundColor: (isCapturing || !!currentPhoto) ? 'rgba(255,255,255,0.5)' : 'white' }
            }
          >
            {step === 'voice' ? (
              isRecording ? <Square color="white" size={32} /> : <Mic color="black" size={36} />
            ) : (
              <CameraIcon color="black" size={32} />
            )}
          </TouchableOpacity>

          {/* Right Button (Upload / Confirm / Submit Voice) */}
          <TouchableOpacity
            onPress={step === 'voice' ? submitFallbackText : (currentPhoto ? confirmPhoto : pickImage)}
            disabled={step === 'voice' && isRecording}
            style={{
              position: 'absolute',
              right: 56,
              width: 48,
              height: 48,
              backgroundColor: step === 'voice' ? ((fallbackText.trim().length > 0 || !!voiceNoteUri) ? '#EAB308' : (isRecording ? 'transparent' : '#74B7B5')) : (currentPhoto ? '#74B7B5' : 'transparent'),
              borderRadius: 24,
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 20,
              borderWidth: (currentPhoto || (step === 'voice' && !isRecording)) ? 0 : 1,
              borderColor: 'rgba(255,255,255,0.3)',
              opacity: (step === 'voice' && isRecording) ? 0.3 : 1
            }}
          >
            {(currentPhoto || step === 'voice') ? <Check color="white" size={24} /> : <Upload color="white" size={24} />}
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}


