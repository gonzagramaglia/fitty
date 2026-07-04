import { useState } from 'react';
import { supabase } from '../lib/supabase';

/**
 * Shared hook for uploading avatar images to Supabase Storage.
 * Used by both owner and cat avatar flows in the Profile screen.
 *
 * @returns An object with the upload function and loading state.
 */
export function useAvatarUpload() {
  const [isUploading, setIsUploading] = useState(false);

  /**
   * Uploads a local image URI to a Supabase storage bucket.
   * If the URI is already a remote URL, returns it as-is.
   *
   * @param uri - The local file URI or existing remote URL.
   * @param bucket - The Supabase storage bucket name.
   * @param prefix - A prefix for constructing the file name.
   * @returns The public URL of the uploaded image.
   * @throws Will throw if upload fails or user is not authenticated.
   */
  const uploadAvatar = async (uri: string, bucket: string, prefix: string): Promise<string> => {
    if (uri.startsWith('http')) return uri;

    setIsUploading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) throw new Error('Not authenticated');

      const ext = uri.substring(uri.lastIndexOf('.') + 1) || 'jpg';
      const fileName = `${session.user.id}_${prefix}_${Date.now()}.${ext}`;

      if (fileName.includes('..')) {
        throw new Error('Invalid file name');
      }

      const response = await fetch(uri);
      const blob = await response.blob();

      const { error } = await supabase.storage
        .from(bucket)
        .upload(fileName, blob, { upsert: true });

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(fileName);

      return publicUrl;
    } finally {
      setIsUploading(false);
    }
  };

  return { uploadAvatar, isUploading };
}
