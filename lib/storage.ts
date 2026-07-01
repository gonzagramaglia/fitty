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
): Promise<string> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000);

  try {
    const response = await fetch(uri, { signal: controller.signal as any });
    const blob = await response.blob();

    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(path, blob, {
        contentType,
        upsert: true,
      });

    if (error) throw error;

    const { data: publicUrlData } = supabase.storage.from(bucket).getPublicUrl(path);
    if (!publicUrlData.publicUrl) {
      throw new Error("Failed to get public URL");
    }
    
    return publicUrlData.publicUrl;
  } catch (error: any) {
    if (error.name === 'AbortError') {
      throw new Error(`Upload timed out for ${bucket}/${path}`);
    }
    console.error(`[lib/storage] Upload failed for ${bucket}/${path}:`, error);
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}
