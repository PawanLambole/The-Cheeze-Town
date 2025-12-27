import { supabase } from './database';
// @ts-ignore: Legacy import for Expo 54+ compatibility
import { readAsStringAsync } from 'expo-file-system/legacy';
import { decode } from 'base64-arraybuffer';

/**
 * Uploads an image to Supabase Storage
 * @param uri Local file URI
 * @param bucketName Storage bucket name (e.g., 'menu_items', 'receipts')
 * @returns Public URL of the uploaded file or null if failed
 */
export const uploadImage = async (uri: string, bucketName: string): Promise<string | null> => {
    try {
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.jpg`;
        const contentType = 'image/jpeg';

        // Read file as base64
        const base64 = await readAsStringAsync(uri, {
            encoding: 'base64',
        });

        const { data, error } = await supabase.storage
            .from(bucketName)
            .upload(fileName, decode(base64), {
                contentType,
                upsert: false
            });

        if (error) {
            console.error(`Error uploading to ${bucketName}:`, error);
            // Fallback: If bucket doesn't exist, we might want to return the original URI 
            // but that won't persist. For now, log and return null.
            return null;
        }

        const { data: { publicUrl } } = supabase.storage
            .from(bucketName)
            .getPublicUrl(fileName);

        return publicUrl;
    } catch (error) {
        console.error("Upload exception:", error);
        return null;
    }
};
