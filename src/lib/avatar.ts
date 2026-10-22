import { supabase } from '@/lib/supabase';

/** Storage bucket for profile photos (see supabase/migrations/20261022180000_avatars.sql). */
const BUCKET = 'avatars';

/** Side of the stored square photo, in px. */
export const AVATAR_SIZE = 256;

/** Encoding quality for WebP / JPEG (0 to 1). */
const QUALITY = 0.85;

/** Public URL of a photo in the avatars bucket, or null for "show initials". */
export function avatarUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  return supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
}

export interface PreparedAvatar {
  blob: Blob;
  /** Object URL for the preview; revoke it when done. */
  previewUrl: string;
  extension: 'webp' | 'jpg';
}

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('This file is not an image the browser can open. Try a JPEG or PNG photo.'));
    };
    image.src = url;
  });
}

function toBlob(canvas: HTMLCanvasElement, type: string): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob(resolve, type, QUALITY));
}

/**
 * Cuts the largest centred square out of the photo, scales it to 256×256 and
 * encodes it as WebP. Browsers that cannot encode WebP (older Safari) return PNG
 * for that request, so those get JPEG instead.
 */
export async function prepareAvatar(file: File): Promise<PreparedAvatar> {
  if (!file.type.startsWith('image/')) throw new Error('Please choose a photo.');
  const image = await loadImage(file);
  const side = Math.min(image.naturalWidth, image.naturalHeight);
  const sx = (image.naturalWidth - side) / 2;
  const sy = (image.naturalHeight - side) / 2;

  const canvas = document.createElement('canvas');
  canvas.width = AVATAR_SIZE;
  canvas.height = AVATAR_SIZE;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Could not process the photo on this device.');
  context.imageSmoothingQuality = 'high';
  context.drawImage(image, sx, sy, side, side, 0, 0, AVATAR_SIZE, AVATAR_SIZE);

  let blob = await toBlob(canvas, 'image/webp');
  let extension: PreparedAvatar['extension'] = 'webp';
  if (!blob || blob.type !== 'image/webp') {
    blob = await toBlob(canvas, 'image/jpeg');
    extension = 'jpg';
  }
  if (!blob) throw new Error('Could not process the photo on this device.');

  return { blob, previewUrl: URL.createObjectURL(blob), extension };
}

/**
 * Uploads the prepared photo to <student id>/avatar-<time>.<ext>, points the profile
 * at it and removes the previous file. A new name every time means no stale caches.
 */
export async function uploadAvatar(
  userId: string,
  avatar: PreparedAvatar,
  previousPath: string | null,
): Promise<string> {
  const path = `${userId}/avatar-${Date.now()}.${avatar.extension}`;
  const { error: uploadError } = await supabase.storage.from(BUCKET).upload(path, avatar.blob, {
    contentType: avatar.extension === 'webp' ? 'image/webp' : 'image/jpeg',
    cacheControl: '31536000',
    upsert: false,
  });
  if (uploadError) throw uploadError;

  const { error: setError } = await supabase.rpc('set_my_avatar', { p_path: path });
  if (setError) {
    await supabase.storage.from(BUCKET).remove([path]);
    throw setError;
  }

  if (previousPath && previousPath !== path) {
    // Best effort: an orphaned old file does no harm.
    await supabase.storage.from(BUCKET).remove([previousPath]);
  }
  return path;
}

/** Back to initials and delete the file. */
export async function removeAvatar(currentPath: string | null): Promise<void> {
  const { error } = await supabase.rpc('remove_my_avatar');
  if (error) throw error;
  if (currentPath) await supabase.storage.from(BUCKET).remove([currentPath]);
}
