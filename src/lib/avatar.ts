'use client';

import { supabase } from '@/lib/supabase';
import { messages } from '@/i18n';
import { useEffect, useState } from 'react';

/** Storage bucket for profile photos (see supabase/migrations/20261022180000_avatars.sql). */
const BUCKET = 'avatars';

/** Side of the stored square photo, in px. */
export const AVATAR_SIZE = 256;

/** Encoding quality for WebP / JPEG (0 to 1). */
const QUALITY = 0.85;

/** How long a photo link works. The bucket is private: links are signed for signed-in students. */
const LINK_SECONDS = 60 * 60;
/** Links are renewed this long before they expire. */
const RENEW_MS = 5 * 60 * 1000;

const signed = new Map<string, { url: string; expires: number }>();
const inFlight = new Map<string, Promise<string | null>>();
let queue: { path: string; resolve: (url: string | null) => void }[] = [];

function cachedUrl(path: string): string | null {
  const hit = signed.get(path);
  return hit && hit.expires - RENEW_MS > Date.now() ? hit.url : null;
}

/** Signs every path asked for in the same tick with one request. */
async function flushQueue() {
  const batch = queue;
  queue = [];
  const paths = [...new Set(batch.map((item) => item.path))];
  const urls = new Map<string, string>();
  try {
    const { data, error } = await supabase.storage.from(BUCKET).createSignedUrls(paths, LINK_SECONDS);
    if (error) throw error;
    const expires = Date.now() + LINK_SECONDS * 1000;
    for (const row of data ?? []) {
      if (row.path && row.signedUrl) {
        urls.set(row.path, row.signedUrl);
        signed.set(row.path, { url: row.signedUrl, expires });
      }
    }
  } catch (err: unknown) {
    console.error('Could not sign photo links:', err);
  }
  for (const item of batch) {
    inFlight.delete(item.path);
    item.resolve(urls.get(item.path) ?? null);
  }
}

function signedUrl(path: string): Promise<string | null> {
  const cached = cachedUrl(path);
  if (cached) return Promise.resolve(cached);
  const running = inFlight.get(path);
  if (running) return running;
  const promise = new Promise<string | null>((resolve) => {
    if (queue.length === 0) queueMicrotask(() => void flushQueue());
    queue.push({ path, resolve });
  });
  inFlight.set(path, promise);
  return promise;
}

/** A temporary link to the photo at `path`, or null (no photo yet, or initials). */
export function useAvatarUrl(path: string | null | undefined): string | null {
  const [loaded, setLoaded] = useState<{ path: string; url: string | null } | null>(null);

  useEffect(() => {
    if (!path || cachedUrl(path)) return;
    let cancelled = false;
    void signedUrl(path).then((url) => {
      if (!cancelled) setLoaded({ path, url });
    });
    return () => {
      cancelled = true;
    };
  }, [path]);

  if (!path) return null;
  return cachedUrl(path) ?? (loaded?.path === path ? loaded.url : null);
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
      reject(new Error(messages().avatar.notImage));
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
  if (!file.type.startsWith('image/')) throw new Error(messages().avatar.choosePhoto);
  const image = await loadImage(file);
  const side = Math.min(image.naturalWidth, image.naturalHeight);
  const sx = (image.naturalWidth - side) / 2;
  const sy = (image.naturalHeight - side) / 2;

  const canvas = document.createElement('canvas');
  canvas.width = AVATAR_SIZE;
  canvas.height = AVATAR_SIZE;
  const context = canvas.getContext('2d');
  if (!context) throw new Error(messages().avatar.processError);
  context.imageSmoothingQuality = 'high';
  context.drawImage(image, sx, sy, side, side, 0, 0, AVATAR_SIZE, AVATAR_SIZE);

  let blob = await toBlob(canvas, 'image/webp');
  let extension: PreparedAvatar['extension'] = 'webp';
  if (!blob || blob.type !== 'image/webp') {
    blob = await toBlob(canvas, 'image/jpeg');
    extension = 'jpg';
  }
  if (!blob) throw new Error(messages().avatar.processError);

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
