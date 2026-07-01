import { useState, useRef, useEffect } from 'react';
import { Audio } from 'expo-av';
import { Platform } from 'react-native';

/**
 * Custom hook to manage audio recording for voice notes.
 * Handles requesting permissions, starting/stopping the recording, and returning the audio URI.
 * 
 * @returns Object containing recording state, voice note URI, and control functions.
 */
/**
 * useAudioRecorder is a custom hook that manages Expo Audio recording state.
 * It handles permission requests, starting, stopping, and storing the URI of the recorded audio.
 *
 * @returns Object containing recording state, URI, and control functions.
 */
export function useAudioRecorder() {
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [voiceNoteUri, setVoiceNoteUri] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [metering, setMetering] = useState<number>(-160);
  const recordingRef = useRef<Audio.Recording | null>(null);

  useEffect(() => {
    return () => {
      const rec = recordingRef.current;
      if (rec) {
        recordingRef.current = null;
        rec.stopAndUnloadAsync().catch((error) => {
          console.warn('[useAudioRecorder] Failed to clean up recording', error);
        });
      }
    };
  }, []);

  /**
   * Starts a new audio recording session.
   * On native platforms, it also configures the audio session to allow recording.
   */
  const startRecording = async () => {
    try {
      // Audio works differently on Web vs Native
      if (Platform.OS !== 'web') {
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: true,
          playsInSilentModeIOS: true,
        });
      }

      const options = {
        ...Audio.RecordingOptionsPresets.HIGH_QUALITY,
        isMeteringEnabled: true,
      };

      const { recording: newRecording } = await Audio.Recording.createAsync(options);
      
      setRecording(newRecording);
      recordingRef.current = newRecording;
      setIsRecording(true);
      setRecordingDuration(0);
      setMetering(-160);

      newRecording.setOnRecordingStatusUpdate(async (status) => {
        if (status.isRecording) {
          setRecordingDuration(status.durationMillis);
          if (status.metering !== undefined) {
             setMetering(status.metering);
          }
          // Auto-stop at 2 minutes (120000 ms)
          if (status.durationMillis >= 120000) {
            await stopRecording();
          }
        }
      });
    } catch (error) {
      console.error('[useAudioRecorder] Failed to start recording', error);
    }
  };

  /**
   * Stops the current audio recording and retrieves the local URI of the saved file.
   * 
   * @returns The local URI of the recorded audio, or null if it failed.
   */
  const stopRecording = async () => {
    const rec = recordingRef.current;
    if (!rec) return null;

    try {
      setIsRecording(false);
      await rec.stopAndUnloadAsync();
      const uri = rec.getURI();
      setRecording(null);
      recordingRef.current = null;
      
      if (uri) {
        setVoiceNoteUri(uri);
        return uri;
      }
    } catch (error) {
      console.error('[useAudioRecorder] Failed to stop recording', error);
    }
    return null;
  };
  const clearVoiceNote = () => {
    setVoiceNoteUri(null);
  };

  return {
    isRecording,
    recordingDuration,
    metering,
    voiceNoteUri,
    startRecording,
    stopRecording,
    clearVoiceNote
  };
}
