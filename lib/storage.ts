import { supabase } from './supabase';

/**
 * Uploads a media file (image or audio) to a specific Supabase Storage bucket.
 * Uses the native fetch API to load the local URI into a Blob before uploading.
 * 
 * @param uri - The local file URI to upload
 * @param bucket - The destination Supabase Storage bucket name
 * @param path - The path/filename inside the bucket
 * @param contentType - The MIME type of the file (e.g., 'image/jpeg')
 * @returns An object containing the success status and the public URL if successful
 */
export async function uploadMedia(
  uri: string,
  bucket: string,
  path: string,
  contentType: string
): Promise<{ success: boolean; publicUrl?: string; error?: string }> {
  try {
    const response = await fetch(uri);
    const blob = await response.blob();

    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(path, blob, {
        contentType,
        upsert: true,
      });

    if (error) throw error;

    const { data: publicUrlData } = supabase.storage.from(bucket).getPublicUrl(path);
    
    return { success: true, publicUrl: publicUrlData.publicUrl };
  } catch (error) {
    console.error(`[lib/storage] Upload failed for ${bucket}/${path}:`, error);
    return { success: false, error: String(error) };
  }
}
