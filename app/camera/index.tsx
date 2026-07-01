import React, { useState, useEffect, useRef } from 'react';
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
  const { activeCatId } = useActiveCat();
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
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
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
      const timestamp = Date.now();
      let topUrl = '';
      let sideUrl = '';
      let voiceUrl = '';
      
      if (topPhoto) {
        const { publicUrl } = await uploadMedia(topPhoto, 'cat_photos', `${userId}/${activeCatId}/${timestamp}_top.jpg`, 'image/jpeg');
        if (publicUrl) topUrl = publicUrl;
        FileSystem.deleteAsync(topPhoto, { idempotent: true }).catch(console.warn);
      }
      
      if (sidePhoto) {
        const { publicUrl } = await uploadMedia(sidePhoto, 'cat_photos', `${userId}/${activeCatId}/${timestamp}_side.jpg`, 'image/jpeg');
        if (publicUrl) sideUrl = publicUrl;
        FileSystem.deleteAsync(sidePhoto, { idempotent: true }).catch(console.warn);
      }

      if (audioUri) {
        // usually expo-av saves as .m4a or .caf
        const ext = Platform.OS === 'ios' ? 'caf' : 'm4a';
        const { publicUrl } = await uploadMedia(audioUri, 'voice_notes', `${userId}/${activeCatId}/${timestamp}_voice.${ext}`, `audio/${ext}`);
        if (publicUrl) voiceUrl = publicUrl;
        FileSystem.deleteAsync(audioUri, { idempotent: true }).catch(console.warn);
      }

      // Trigger Temporal Workflow via API route
      const analyzeResponse = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          catId: activeCatId,
          userId,
          topPhotoUrl: topUrl,
          sidePhotoUrl: sideUrl,
          voiceNoteUrl: voiceUrl || undefined,
          textNote: fallbackText.trim() || undefined,
        }),
      });
      
      if (!analyzeResponse.ok) {
        throw new Error("Failed to start analysis workflow");
      }
      
      const analyzeResult = await analyzeResponse.json();
      if (!analyzeResult.success) {
        console.error('[camera] Failed to start analysis:', analyzeResult.error);
        setStep('voice');
        return;
      }

      console.log('[camera] Workflow started:', analyzeResult.data.workflowId);
      
      // Save context info to the CameraContext to hide it from URL params
      setProcessingState({
        hasVoiceNote: !!voiceUrl,
        hasTextNote: fallbackText.trim().length > 0
      });
      
      // Navigate to processing screen (clean URL)
      router.push('/camera/processing');
    } catch (error) {
      console.error("Failed to finalize capture:", error);
      setStep('voice'); // revert on error
    }
  };

   if (step === 'uploading') {
     const hasContext = !!voiceNoteUri || fallbackText.trim().length > 0;
     return <UploadingView catName={catName} hasContext={hasContext} />;
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
          <View style={{ flex: 1, paddingHorizontal: 24, backgroundColor: '#F8FAFC', paddingTop: 140, paddingBottom: 160 }}>
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
              {!isRecording && (
                <View className="mt-8 items-center">
                  <View className="bg-[#1A2530]/80 rounded-3xl px-6 py-4 backdrop-blur-xl border border-white/10 items-center shadow-lg">
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

/**
 * Component to display the uploading state.
 * Simulates a progress bar and rotates through contextual loading messages.
 * 
 * @param props - Component properties
 * @param props.catName - The name of the active cat being analyzed
 * @param props.hasContext - Whether the user provided voice or text context
 * @returns React component rendering the uploading view.
 */
function UploadingView({ catName, hasContext }: { catName: string, hasContext?: boolean }) {
  const [loadingTextIndex, setLoadingTextIndex] = useState(0);
  const [dots, setDots] = useState('');
  const progressAnim = useRef(new Animated.Value(0)).current;
  
  const loadingTexts = hasContext ? [
    "Uploading photos and context...",
    "Running shape analysis models...",
    "Processing context data...",
    "Correlating vet records...",
    "Generating health report..."
  ] : [
    "Uploading photos...",
    "Running shape analysis models...",
    "Scanning for physical cues...",
    "Correlating vet records...",
    "Generating health report..."
  ];

  // Animated dots
  useEffect(() => {
    const interval = setInterval(() => {
      setDots(prev => prev.length >= 3 ? '' : prev + '.');
    }, 500);
    return () => clearInterval(interval);
  }, []);

  // Text rotation
  useEffect(() => {
    const interval = setInterval(() => {
      setLoadingTextIndex((prev) => (prev + 1) % loadingTexts.length);
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  // Progress bar animation (simulating progress over 5 seconds)
  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: 100,
      duration: 5000,
      useNativeDriver: false,
    }).start();
  }, []);

  return (
    <View className="flex-1 bg-[#F8FAFC] justify-center items-center px-8">
      {/* Icon Container with subtle animation effect */}
      <View className="w-24 h-24 bg-white rounded-3xl shadow-sm border border-[#E2E8F0] items-center justify-center mb-8 relative">
        <Upload color="#EAB308" size={40} />
        <View className="absolute -bottom-3 -right-3 bg-white rounded-full p-2 shadow-sm border border-[#E2E8F0]">
          <ActivityIndicator size="small" color="#EAB308" />
        </View>
      </View>

      <Text className="text-[#EAB308] text-3xl font-black tracking-tight text-center mb-4">
        Analyzing {catName || 'Your Cat'}'s Health{dots}
      </Text>
      
      <Text className="text-[#64748B] text-center text-lg leading-relaxed px-4 mb-10">
        Securely transferring the captured data to the AI engine...
      </Text>

      {/* Progress Bar Container */}
      <View className="w-full max-w-sm mb-4">
        <View className="h-2 w-full bg-[#E2E8F0] rounded-full overflow-hidden">
          <Animated.View 
            className="h-full bg-[#EAB308] rounded-full" 
            style={{ 
              width: progressAnim.interpolate({
                inputRange: [0, 100],
                outputRange: ['0%', '100%']
              }) 
            }} 
          />
        </View>
      </View>

      {/* Rotating Status Text */}
      <View className="bg-white px-6 py-4 rounded-2xl w-full max-w-sm border border-[#E2E8F0] shadow-sm">
        <Text className="text-[#74B7B5] text-center font-bold text-sm tracking-widest uppercase">
          {loadingTexts[loadingTextIndex]}
        </Text>
      </View>
    </View>
  );
}
