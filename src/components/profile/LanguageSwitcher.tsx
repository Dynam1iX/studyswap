'use client';

import { useLayoutEffect, useRef, useState } from 'react';
import type { Language } from '@/i18n';
import { useT } from '@/i18n';

const LANGUAGES: { value: Language; label: string }[] = [
  { value: 'en', label: 'EN' },
  { value: 'ru', label: 'RU' },
  { value: 'kz', label: 'KZ' },
];

/** Geometry of the switch: 48px cells, 4px apart, 3px inset. */
const CELL = 48;
const STEP = CELL + 4;
const INSET = 3;
const DURATION_MS = 450;
/** The labels swap colour when the pill passes, at 180 ms of 450 (keyframe 3 in Figma). */
const LABEL_SWAP_AT = 0.4;
const EASE = 'cubic-bezier(0.3, 0, 0.3, 1)';

const cellLeft = (index: number) => INSET + index * STEP;
const px = (value: number) => `${value}px`;

/**
 * Jelly keyframes from the Figma storyboard (0 / 90 / 180 / 270 / 450 ms):
 * the front edge leaves first and stretches the pill, the back catches up,
 * it overshoots past the target with a tall squash and settles.
 */
function jellyKeyframes(fromLeft: number, fromWidth: number, toLeft: number): Keyframe[] {
  const distance = Math.abs(toLeft - fromLeft);
  const stretched = CELL + distance * 0.75;
  const catchingUp = CELL + distance * 0.35;
  const toRight = toLeft > fromLeft;

  const frame = (offset: number, left: number, width: number, scaleY: number): Keyframe => ({
    offset,
    left: px(left),
    width: px(width),
    transform: `scaleY(${scaleY})`,
    easing: EASE,
  });

  return toRight
    ? [
        frame(0, fromLeft, fromWidth, 1),
        frame(0.2, fromLeft, stretched, 0.86),
        frame(0.4, toLeft + CELL - catchingUp, catchingUp, 0.9),
        frame(0.6, toLeft + 6, CELL - 4, 1.1),
        frame(0.78, toLeft - 2, CELL + 2, 0.96),
        frame(1, toLeft, CELL, 1),
      ]
    : [
        frame(0, fromLeft, fromWidth, 1),
        frame(0.2, fromLeft + fromWidth - stretched, stretched, 0.86),
        frame(0.4, toLeft, catchingUp, 0.9),
        frame(0.6, toLeft - 2, CELL - 4, 1.1),
        frame(0.78, toLeft, CELL + 2, 0.96),
        frame(1, toLeft, CELL, 1),
      ];
}

interface LanguageSwitcherProps {
  value: Language;
  onChange: (language: Language) => void;
}

/** EN / RU / KZ segmented switch with a gradient pill that flows like jelly. */
export function LanguageSwitcher({ value, onChange }: LanguageSwitcherProps) {
  const t = useT();
  // The pill moves at once; the page changes language once the jelly has mostly settled.
  const [picked, setPicked] = useState(value);
  const [lastValue, setLastValue] = useState(value);
  if (value !== lastValue) {
    setLastValue(value);
    setPicked(value);
  }
  const pick = (next: Language) => {
    if (next === picked) return;
    setPicked(next);
    window.setTimeout(() => onChange(next), DURATION_MS * 0.55);
  };
  const index = Math.max(0, LANGUAGES.findIndex((lang) => lang.value === picked));
  const pillRef = useRef<HTMLSpanElement>(null);
  const previousIndex = useRef(index);
  /** Which label is drawn white; follows the pill instead of jumping instantly. */
  const [litIndex, setLitIndex] = useState(index);

  useLayoutEffect(() => {
    const pill = pillRef.current;
    const from = previousIndex.current;
    previousIndex.current = index;
    if (!pill || from === index) return;

    // If a previous animation is still running, start from where the pill is right now.
    const running = pill.getAnimations();
    const style = getComputedStyle(pill);
    const fromLeft = running.length ? parseFloat(style.left) : cellLeft(from);
    const fromWidth = running.length ? parseFloat(style.width) : CELL;
    running.forEach((animation) => animation.cancel());

    const toLeft = cellLeft(index);
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (reduceMotion) {
      pill.animate([{ left: px(fromLeft), width: px(fromWidth) }, { left: px(toLeft), width: px(CELL) }], {
        duration: 200,
        easing: 'ease-out',
      });
    } else {
      pill.animate(jellyKeyframes(fromLeft, fromWidth, toLeft), { duration: DURATION_MS });
    }

    const timer = window.setTimeout(() => setLitIndex(index), reduceMotion ? 0 : DURATION_MS * LABEL_SWAP_AT);
    return () => window.clearTimeout(timer);
  }, [index]);

  return (
    <div role="radiogroup" aria-label={t.settings.language} className="relative flex gap-1 rounded-2xl bg-soft p-[3px]">
      <span
        ref={pillRef}
        aria-hidden
        style={{ left: cellLeft(index) }}
        className="pointer-events-none absolute top-[3px] h-11 w-12 rounded-xl bg-linear-to-r from-brand-from to-brand-to shadow-[0_4px_10px_rgba(173,70,255,0.3)]"
      />
      {LANGUAGES.map((lang, i) => {
        const selected = lang.value === picked;
        const lit = i === litIndex;
        return (
          <button
            key={lang.value}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => pick(lang.value)}
            className={`relative h-11 w-12 cursor-pointer rounded-xl text-xs transition-colors duration-150 ${
              lit ? 'font-extrabold text-white' : 'font-bold text-ink'
            } ${selected ? '' : 'hover:bg-line/60'}`}
          >
            {lang.label}
          </button>
        );
      })}
    </div>
  );
}
