'use client';

import { Volume2, VolumeX } from 'lucide-react';
import { playSound, setSoundEnabled, useSoundEnabled } from '@/lib/sound';
import { useT } from '@/i18n';

/**
 * Sounds on / off. `compact`: a round icon button (Login header); otherwise a switch
 * (Profile → Settings). Turning sounds on plays the like "pop" as a preview; the speaker
 * icon pops in its new state (waves when on, a cross when off).
 */
export function SoundToggle({ compact = false }: { compact?: boolean }) {
  const t = useT();
  const on = useSoundEnabled();

  const toggle = () => {
    setSoundEnabled(!on);
    if (!on) playSound('like');
  };

  const icon = on ? (
    <Volume2 key="on" aria-hidden className="size-[18px] animate-pop motion-reduce:animate-none" strokeWidth={2.2} />
  ) : (
    <VolumeX key="off" aria-hidden className="size-[18px] animate-pop motion-reduce:animate-none" strokeWidth={2.2} />
  );

  if (compact) {
    return (
      <button
        type="button"
        onClick={toggle}
        aria-pressed={on}
        aria-label={t.settings.sounds}
        title={t.settings.sounds}
        className={`flex size-10 shrink-0 cursor-pointer items-center justify-center rounded-full border border-line-strong bg-surface transition hover:bg-soft active:scale-90 max-[400px]:size-9 ${
          on ? 'text-brand-from' : 'text-muted'
        }`}
      >
        {icon}
      </button>
    );
  }

  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={t.settings.sounds}
      onClick={toggle}
      className={`relative h-9 w-[68px] shrink-0 cursor-pointer rounded-full transition-colors duration-300 active:scale-95 ${
        on ? 'bg-linear-to-r from-brand-from to-brand-to' : 'bg-field'
      }`}
    >
      <span
        className={`absolute top-1 left-1 flex size-7 items-center justify-center rounded-full bg-white shadow-[0_2px_6px_rgba(27,21,48,0.2)] transition-transform duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${
          on ? 'translate-x-8 text-brand-from' : 'translate-x-0 text-muted'
        }`}
      >
        {icon}
      </span>
    </button>
  );
}
