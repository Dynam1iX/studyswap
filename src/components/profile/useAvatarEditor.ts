'use client';

import { useEffect, useRef, useState } from 'react';
import { preloadAvatar, removeAvatar, useAvatarUrl, uploadAvatar, type PreparedAvatar } from '@/lib/avatar';
import { messages } from '@/i18n';

/** Fired on window when a photo is saved or removed, so Profile and Edit profile agree. */
const AVATAR_CHANGED_EVENT = 'studyswap:avatar-changed';

interface AvatarOwner {
  id: string;
  avatarPath: string | null;
}

interface UseAvatarEditorOptions {
  /** Called with the new path (or null) once the database has it. */
  onChange: (avatarPath: string | null) => void;
  /** Short message for the page's toast. */
  notify: (message: string) => void;
}

/**
 * Photo editing shared by Profile and Edit profile. Saving closes the sheet at once
 * and shows the new photo straight away with a spinning ring while it uploads; if the
 * upload fails the old photo comes back and a toast says so.
 */
export function useAvatarEditor(user: AvatarOwner | null, { onChange, notify }: UseAvatarEditorOptions) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  /** Local preview of the photo being uploaded. */
  const [pendingUrl, setPendingUrl] = useState<string | null>(null);

  useEffect(
    () => () => {
      if (pendingUrl) URL.revokeObjectURL(pendingUrl);
    },
    [pendingUrl],
  );

  /** The stored path right now (the user prop lags behind during an upload). */
  const pathRef = useRef<string | null>(user?.avatarPath ?? null);
  useEffect(() => {
    pathRef.current = user?.avatarPath ?? null;
  }, [user?.avatarPath]);
  /** One change at a time: a second upload or Remove waits for the first to finish. */
  const working = useRef(false);

  // The other page's editor saved or removed a photo: show it here too.
  const onChangeRef = useRef(onChange);
  useEffect(() => {
    onChangeRef.current = onChange;
  });
  useEffect(() => {
    const onChanged = (event: Event) => {
      const path = (event as CustomEvent<string | null>).detail;
      if (path === pathRef.current) return;
      pathRef.current = path;
      onChangeRef.current(path);
    };
    window.addEventListener(AVATAR_CHANGED_EVENT, onChanged);
    return () => window.removeEventListener(AVATAR_CHANGED_EVENT, onChanged);
  }, []);

  const changed = (path: string | null) => {
    pathRef.current = path;
    onChange(path);
    window.dispatchEvent(new CustomEvent(AVATAR_CHANGED_EVENT, { detail: path }));
  };

  const save = async (avatar: PreparedAvatar) => {
    if (!user || working.current) return;
    working.current = true;
    setOpen(false);
    setBusy(true);
    setPendingUrl(URL.createObjectURL(avatar.blob));
    try {
      const path = await uploadAvatar(user.id, avatar, pathRef.current);
      // Keep the local preview until the stored photo is ready to show.
      await preloadAvatar(path);
      changed(path);
      notify(messages().avatar.updated);
    } catch (err: unknown) {
      console.error('Error uploading the photo:', err);
      notify(messages().avatar.uploadError);
    } finally {
      setPendingUrl(null);
      setBusy(false);
      working.current = false;
    }
  };

  const remove = async () => {
    if (!user || working.current) return;
    working.current = true;
    try {
      await removeAvatar(pathRef.current);
      changed(null);
      setOpen(false);
      notify(messages().avatar.removed);
    } finally {
      working.current = false;
    }
  };

  /** What the avatar shows right now: the uploading preview, else the saved photo. */
  const savedUrl = useAvatarUrl(user?.avatarPath);
  const displayUrl = pendingUrl ?? savedUrl;

  return { open, setOpen, busy, save, remove, displayUrl, savedUrl };
}
