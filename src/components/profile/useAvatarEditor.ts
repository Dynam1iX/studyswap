'use client';

import { useEffect, useState } from 'react';
import { removeAvatar, useAvatarUrl, uploadAvatar, type PreparedAvatar } from '@/lib/avatar';
import { messages } from '@/i18n';

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

  const save = async (avatar: PreparedAvatar) => {
    if (!user) return;
    setOpen(false);
    setBusy(true);
    setPendingUrl(URL.createObjectURL(avatar.blob));
    try {
      const path = await uploadAvatar(user.id, avatar, user.avatarPath);
      onChange(path);
      notify(messages().avatar.updated);
    } catch (err: unknown) {
      console.error('Error uploading the photo:', err);
      notify(messages().avatar.uploadError);
    } finally {
      setPendingUrl(null);
      setBusy(false);
    }
  };

  const remove = async () => {
    if (!user) return;
    await removeAvatar(user.avatarPath);
    onChange(null);
    setOpen(false);
    notify(messages().avatar.removed);
  };

  /** What the avatar shows right now: the uploading preview, else the saved photo. */
  const savedUrl = useAvatarUrl(user?.avatarPath);
  const displayUrl = pendingUrl ?? savedUrl;

  return { open, setOpen, busy, save, remove, displayUrl, savedUrl };
}
