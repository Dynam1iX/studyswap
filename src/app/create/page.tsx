'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Check, ShieldCheck } from 'lucide-react';
import { BarterCard, type CardHalf } from '@/components/barter/BarterCard';
import { ContactMethodToggle } from '@/components/create/ContactMethodToggle';
import { CreateNavBar } from '@/components/create/CreateNavBar';
import { SubjectSelect } from '@/components/create/SubjectSelect';
import { TopicsField } from '@/components/create/TopicsField';
import { AppHeader } from '@/components/layout/AppHeader';
import { MobileShell } from '@/components/layout/MobileShell';
import { paletteFor } from '@/lib/categoryPalette';
import { createBarterPost, fetchCreateFormData } from '@/lib/create';
import { formatStudyInfo, getInitials, getShortName } from '@/lib/format';
import { useReplay } from '@/lib/useReplay';
import type { ContactMethod, Subject } from '@/types/database';

interface FormErrors {
  needed?: boolean;
  offered?: boolean;
  neededDetails?: boolean;
  offeredDetails?: boolean;
  sameSubject?: boolean;
}

/** One half of the live preview: the chosen subject, or a neutral placeholder. */
function previewHalf(subject: Subject | undefined, details: string, emptyTopic: string): CardHalf {
  return {
    palette: paletteFor(subject?.category),
    title: subject?.name || 'Select subject...',
    topic: details.trim() ? details : subject ? subject.code : emptyTopic,
  };
}

export default function CreateBarterPage() {
  const router = useRouter();

  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loadingSubjects, setLoadingSubjects] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  /** Published: the button turns into a check and bursts bubbles before going to the Feed. */
  const [published, setPublished] = useState(false);
  const [bubbling, bubble] = useReplay(700);

  const [neededSubjectId, setNeededSubjectId] = useState<number | null>(null);
  const [offeredSubjectId, setOfferedSubjectId] = useState<number | null>(null);
  const [neededDetails, setNeededDetails] = useState('');
  const [offeredDetails, setOfferedDetails] = useState('');
  const [contactMethod, setContactMethod] = useState<ContactMethod>('email');

  const [errors, setErrors] = useState<FormErrors>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [shakeTrigger, setShakeTrigger] = useState(0);

  const [authorId, setAuthorId] = useState('');
  const [authorName, setAuthorName] = useState('Alzhan Y.');
  const [authorSubtitle, setAuthorSubtitle] = useState('Software Engineering, Year 1');

  useEffect(() => {
    let cancelled = false;
    fetchCreateFormData()
      .then(({ subjects: loaded, author }) => {
        if (cancelled) return;
        setSubjects(loaded);
        if (author) {
          setAuthorId(author.id);
          setAuthorName(getShortName(author.full_name));
          setAuthorSubtitle(formatStudyInfo(author.major, author.study_year));
        }
      })
      .catch((err: unknown) => console.error('Initial data load error:', err))
      .finally(() => {
        if (!cancelled) setLoadingSubjects(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const neededSubject = subjects.find((s) => s.id === neededSubjectId);
  const offeredSubject = subjects.find((s) => s.id === offeredSubjectId);

  const failValidation = (message?: string) => {
    if (message) setServerError(message);
    setShakeTrigger((prev) => prev + 1);
  };

  const handleSubmit = async () => {
    setServerError(null);
    const nextErrors: FormErrors = {};

    if (!neededSubjectId) nextErrors.needed = true;
    if (!offeredSubjectId) nextErrors.offered = true;
    if (neededSubjectId && offeredSubjectId && neededSubjectId === offeredSubjectId) {
      nextErrors.sameSubject = true;
      nextErrors.needed = true;
      nextErrors.offered = true;
    }
    if (!neededDetails.trim()) nextErrors.neededDetails = true;
    if (!offeredDetails.trim()) nextErrors.offeredDetails = true;

    if (Object.keys(nextErrors).length > 0 || !neededSubjectId || !offeredSubjectId) {
      setErrors(nextErrors);
      failValidation();
      return;
    }

    setSubmitting(true);
    try {
      await createBarterPost({
        author_id: authorId,
        needed_subject_id: neededSubjectId,
        offered_subject_id: offeredSubjectId,
        description: neededDetails.trim(),
        offered_description: offeredDetails.trim(),
        contact_method: contactMethod,
        status: 'active',
      });
      setSubmitting(false);
      setPublished(true);
      bubble();
      window.setTimeout(() => router.push('/'), 900);
    } catch (err: unknown) {
      setSubmitting(false);
      failValidation(err instanceof Error ? err.message : 'Unknown network error');
    }
  };

  const neededError = errors.needed
    ? errors.sameSubject
      ? 'Subjects cannot be identical'
      : 'Please select a subject you need help with'
    : null;
  const offeredError = errors.offered
    ? errors.sameSubject
      ? 'Subjects cannot be identical'
      : 'Please select a subject you can teach'
    : null;

  const publishBar = (
    <div className="border-t border-line bg-white px-4 pt-3 pb-5 shadow-[0_100px_0_0_#fff]">
      <button
        type="button"
        onClick={handleSubmit}
        disabled={submitting || loadingSubjects || published}
        className={`bubbly flex h-[56px] w-full cursor-pointer items-center justify-center gap-2 rounded-[16px] bg-linear-to-r from-brand-from to-brand-to text-[17px] font-bold text-white shadow-[0_8px_20px_rgba(200,40,140,0.28)] transition hover:opacity-95 active:scale-[0.97] disabled:cursor-default ${
          published ? '' : 'disabled:opacity-50'
        } ${bubbling ? 'bubbly-animate' : ''}`}
      >
        {published ? (
          <span className="flex animate-pop items-center gap-2 motion-reduce:animate-none">
            <Check className="size-5" strokeWidth={3} />
            Published!
          </span>
        ) : submitting ? (
          'Publishing offer...'
        ) : (
          'Publish Barter Offer'
        )}
      </button>
    </div>
  );

  return (
    <MobileShell footer={publishBar}>
      <AppHeader />
      <CreateNavBar />

      <div className="animate-rise px-4 py-2 motion-reduce:animate-none">
        <p className="text-[14px] leading-[21px] font-semibold text-muted">
          Exchange your academic strengths to get help with challenging subjects.
        </p>
      </div>

      {serverError && (
        <div
          key={`err-${shakeTrigger}`}
          className="mx-4 mb-2 animate-shake rounded-xl border border-red-300 bg-red-50 p-3 text-xs font-semibold text-red-700"
        >
          {serverError}
        </div>
      )}

      {/* Form */}
      <div style={{ animationDelay: '70ms' }} className="animate-rise px-4 py-2 motion-reduce:animate-none">
        <div className="space-y-4 rounded-[24px] border border-line bg-white p-4 shadow-sm">
          <SubjectSelect
            label="Subject you need help with"
            subjects={subjects}
            value={neededSubjectId}
            onChange={(id) => {
              setNeededSubjectId(id);
              setErrors((prev) => ({ ...prev, needed: false, sameSubject: false }));
              setServerError(null);
            }}
            error={neededError}
            shakeKey={shakeTrigger}
          />

          <TopicsField
            label="Topics you need help with"
            placeholder="e.g., Struggling with RREF, limits, calculus exam questions..."
            value={neededDetails}
            onChange={(text) => {
              setNeededDetails(text);
              if (errors.neededDetails && text.trim()) setErrors((prev) => ({ ...prev, neededDetails: false }));
              setServerError(null);
            }}
            error={errors.neededDetails ? 'Please describe what topics you need assistance with' : null}
            shakeKey={shakeTrigger}
          />

          <SubjectSelect
            label="Subject you can teach"
            subjects={subjects}
            value={offeredSubjectId}
            onChange={(id) => {
              setOfferedSubjectId(id);
              setErrors((prev) => ({ ...prev, offered: false, sameSubject: false }));
              setServerError(null);
            }}
            error={offeredError}
            shakeKey={shakeTrigger}
            spaced
          />

          <TopicsField
            label="Topics you can teach / explain"
            placeholder="e.g., Can explain pointers, OOP principles, binary trees and labs..."
            value={offeredDetails}
            onChange={(text) => {
              setOfferedDetails(text);
              if (errors.offeredDetails && text.trim()) setErrors((prev) => ({ ...prev, offeredDetails: false }));
              setServerError(null);
            }}
            error={errors.offeredDetails ? 'Please describe what topics you can explain in return' : null}
            shakeKey={shakeTrigger}
          />

          <ContactMethodToggle value={contactMethod} onChange={setContactMethod} />
        </div>
      </div>

      {/* Live preview */}
      <div style={{ animationDelay: '140ms' }} className="animate-rise px-4 pt-4 pb-2 motion-reduce:animate-none">
        <h2 className="mb-2.5 text-[11px] font-bold tracking-[0.88px] text-muted uppercase">Preview in feed</h2>
        <BarterCard
          author={{ initials: getInitials(authorName), name: authorName, subtitle: authorSubtitle }}
          needs={previewHalf(neededSubject, neededDetails, 'Topics you need help with...')}
          teaches={previewHalf(offeredSubject, offeredDetails, 'Topics you can teach...')}
          contactMethod={contactMethod}
        />
      </div>

      <div style={{ animationDelay: '210ms' }} className="animate-rise px-4 py-2 motion-reduce:animate-none">
        <div className="flex items-center gap-3 rounded-[16px] bg-[#F3E8FF] p-4">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-linear-to-br from-brand-from to-brand-to text-white shadow-[0_4px_12px_rgba(173,70,255,0.3)]">
            <ShieldCheck aria-hidden className="size-5" strokeWidth={2.2} />
          </span>
          <p className="text-[13px] leading-[19px] font-semibold text-[#3B2A66]">
            Contact details are only shared with verified university students.
          </p>
        </div>
      </div>

    </MobileShell>
  );
}
