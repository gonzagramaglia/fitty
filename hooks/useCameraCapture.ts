import { useState, useRef } from 'react';
import { CameraView } from 'expo-camera';
import * as ImageManipulator from 'expo-image-manipulator';
import { Platform } from 'react-native';

/**
 * Custom hook to manage camera capturing logic.
 * Handles taking photos, compressing them, and storing their URIs in local state.
 * 
 * @returns Object containing the camera ref, captured photo URIs, state, and capture functions.
 */
export function useCameraCapture() {
  const cameraRef = useRef<CameraView>(null);
  const [topPhoto, setTopPhoto] = useState<string | null>(null);
  const [sidePhoto, setSidePhoto] = useState<string | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);

  /**
   * Captures a photo using the active camera, compresses it, and assigns it to the appropriate step.
   * 
   * @param step - The current capture step ('top' or 'side')
   * @returns A boolean indicating whether the capture was successful
   */
  const capturePhoto = async (step: 'top' | 'side') => {
    if (!cameraRef.current || isCapturing) return false;
    
    try {
      setIsCapturing(true);
      const photo = await cameraRef.current.takePictureAsync({
        quality: 1, // Capture at high quality initially
        base64: false,
      });

      if (!photo?.uri) throw new Error("Failed to capture photo");

      // Compress and resize for faster upload and processing
      const manipResult = await ImageManipulator.manipulateAsync(
        photo.uri,
        [{ resize: { width: 1080 } }],
        { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG }
      );

      // Clean up original uncompressed photo
      FileSystem.deleteAsync(photo.uri, { idempotent: true }).catch(err => 
        console.warn("[useCameraCapture] Failed to delete original photo", err)
      );

      if (step === 'top') {
        setTopPhoto(manipResult.uri);
      } else {
        setSidePhoto(manipResult.uri);
      }
      
      return true;
    } catch (error) {
      console.error("[useCameraCapture] error capturing:", error);
      return false;
    } finally {
      setIsCapturing(false);
    }
  };

  /**
   * Manually sets a photo URI for a specific step, used for fallbacks like image pickers.
   * 
   * @param step - The current capture step ('top' or 'side')
   * @param uri - The local URI of the selected image
   */
  const setManualPhoto = (step: 'top' | 'side', uri: string) => {
    if (step === 'top') {
      setTopPhoto(uri);
    } else {
      setSidePhoto(uri);
    }
  };

  /**
   * Clears the photo for a specific step.
   * 
   * @param step - The current capture step ('top' | 'side')
   */
  const clearPhoto = (step: 'top' | 'side') => {
    if (step === 'top') setTopPhoto(null);
    if (step === 'side') setSidePhoto(null);
  };

  return {
    cameraRef,
    topPhoto,
    sidePhoto,
    isCapturing,
    capturePhoto,
    setManualPhoto,
    clearPhoto,
  };
}
