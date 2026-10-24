'use client';

import { useId, useState } from 'react';
import { CircleHelp, X } from 'lucide-react';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { useT } from '@/i18n';

const STEP_IMAGES = ['/help/step-1-find.png', '/help/step-2-create.png', '/help/step-3-write.png'];

/** "?" button for the logo row; opens "How StudySwap works". */
export function HelpButton() {
  const t = useT();
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        aria-label={t.help.button}
        title={t.help.button}
        className="group flex size-10 shrink-0 cursor-pointer items-center justify-center rounded-full border border-line-strong bg-surface text-muted transition hover:bg-soft hover:text-brand-from active:scale-90"
      >
        <CircleHelp aria-hidden className="size-5 transition-transform duration-300 group-hover:rotate-12" strokeWidth={2.2} />
      </button>
      <HelpSheet open={open} onClose={() => setOpen(false)} />
    </>
  );
}

/** "How StudySwap works": a silent how-to video (with its steps as text) and three illustrated steps. */
function HelpSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const t = useT();
  const titleId = useId();
  const transcriptId = useId();

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      labelledBy={titleId}
      size="lg"
      header={
        <div className="flex items-center justify-between px-6 py-2">
          <h2 id={titleId} className="font-bricolage text-[22px] font-extrabold text-ink">
            {t.help.title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label={t.common.close}
            className="flex size-11 cursor-pointer items-center justify-center rounded-full bg-soft text-ink transition hover:bg-line focus-visible:outline-2 focus-visible:outline-brand-from"
          >
            <X className="size-5" strokeWidth={2.4} />
          </button>
        </div>
      }
    >
      <div className="flex flex-col gap-5 px-6 pt-2 pb-8">
        <video
          controls
          playsInline
          preload="auto"
          poster="/help/how-to-create-poster.png"
          aria-label={t.help.videoLabel}
          aria-describedby={transcriptId}
          className="aspect-video w-full rounded-2xl border border-line bg-soft"
        >
          <source src="/help/how-to-create.mp4" type="video/mp4" />
        </video>

        <div id={transcriptId} className="flex flex-col gap-2 rounded-2xl bg-soft p-4">
          <p className="text-xs font-bold text-muted">{t.help.videoNote}</p>
          <ol className="flex list-decimal flex-col gap-1 pl-5 text-sm font-medium text-ink">
            {t.help.transcript.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ol>
        </div>

        <ol className="grid gap-4 sm:grid-cols-3">
          {t.help.steps.map((step, index) => (
            // Phones: a small picture beside the text; wider screens: three columns.
            <li key={step.title} className="flex items-start gap-3 sm:flex-col sm:gap-2">
              <img
                src={STEP_IMAGES[index]}
                alt={step.alt}
                className="aspect-[43/60] w-24 shrink-0 rounded-xl border border-line object-cover object-top sm:w-full sm:rounded-2xl"
              />
              <span className="flex flex-col gap-1">
                <span className="text-[11px] font-bold tracking-wider text-brand-from uppercase">{t.help.stepLabel(index + 1)}</span>
                <span className="font-bricolage text-base font-extrabold text-ink">{step.title}</span>
                <span className="text-[13px] leading-snug font-medium text-muted">{step.text}</span>
              </span>
            </li>
          ))}
        </ol>
      </div>
    </BottomSheet>
  );
}
