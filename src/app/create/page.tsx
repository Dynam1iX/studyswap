'use client';

import { useEffect, useLayoutEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Check, ShieldCheck, X } from 'lucide-react';
import { BarterCard, type CardHalf } from '@/components/barter/BarterCard';
import { ContactMethodToggle } from '@/components/create/ContactMethodToggle';
import { CreateNavBar } from '@/components/create/CreateNavBar';
import { SubjectSelect } from '@/components/create/SubjectSelect';
import { TopicsField } from '@/components/create/TopicsField';
import { AppHeader } from '@/components/layout/AppHeader';
import { MobileShell } from '@/components/layout/MobileShell';
import { paletteFor } from '@/lib/categoryPalette';
import { createBarterPost, fetchCreateFormData, FilesUploadError } from '@/lib/create';
import { AttachmentsField, type AttachmentItem } from '@/components/files/AttachmentsField';
import { formatStudyInfo, getInitials, getShortName } from '@/lib/format';
import { useReplay } from '@/lib/useReplay';
import { playSound } from '@/lib/sound';
import type { ContactMethod, Subject } from '@/types/database';
import { useT } from '@/i18n';

interface FormErrors {
  needed?: boolean;
  offered?: boolean;
  neededDetails?: boolean;
  offeredDetails?: boolean;
  sameSubject?: boolean;
}

/** One half of the live preview: the chosen subject, or a neutral placeholder. */
function previewHalf(subject: Subject | undefined, details: string, emptyTitle: string, emptyTopic: string): CardHalf {
  return {
    palette: paletteFor(subject?.category),
    title: subject?.name || emptyTitle,
    topic: details.trim() ? details : subject ? subject.code : emptyTopic,
  };
}

export default function CreateBarterPage() {
  const t = useT();
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
  /** Photos / PDFs with the tasks ("Needs help" side). */
  const [attachments, setAttachments] = useState<AttachmentItem[]>([]);
  const [contactMethod, setContactMethod] = useState<ContactMethod>('email');

  const [errors, setErrors] = useState<FormErrors>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [shakeTrigger, setShakeTrigger] = useState(0);

  const [authorId, setAuthorId] = useState('');
  /** Telegram is offered as a contact method only when the author has linked it. */
  const [hasTelegram, setHasTelegram] = useState(false);
  const [authorAvatar, setAuthorAvatar] = useState<string | null>(null);
  const [authorName, setAuthorName] = useState('');
  /** Subjects or the profile could not be loaded: Publish stays off, a message says why. */
  const [loadFailed, setLoadFailed] = useState(false);
  const [authorStudy, setAuthorStudy] = useState<{
    major: string | null;
    year: number | null;
  }>({ major: null, year: null });

  useEffect(() => {
    let cancelled = false;
    fetchCreateFormData()
      .then(({ subjects: loaded, author }) => {
        if (cancelled) return;
        setSubjects(loaded);
        if (author) {
          setAuthorId(author.id);
          setHasTelegram(Boolean(author.telegram_handle));
          setAuthorAvatar(author.avatar_path);
          setAuthorName(getShortName(author.full_name));
          setAuthorStudy({ major: author.major, year: author.study_year });
          // Telegram unlinked since the draft chose it: fall back to e-mail.
          if (!author.telegram_handle) setContactMethod('email');
        } else {
          setLoadFailed(true);
        }
      })
      .catch((err: unknown) => {
        console.error('Initial data load error:', err);
        if (!cancelled) setLoadFailed(true);
      })
      .finally(() => {
        if (!cancelled) setLoadingSubjects(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Next.js keeps a page alive (hidden) after navigating away, so a published form
  // came back filled in with "Published!". Once published, clear it as the page hides;
  // an unpublished draft is kept on purpose.
  useLayoutEffect(() => {
    if (!published) return;
    return () => {
      setNeededSubjectId(null);
      setOfferedSubjectId(null);
      setNeededDetails('');
      setOfferedDetails('');
      setContactMethod('email');
      setErrors({});
      setServerError(null);
      setPublished(false);
    };
  }, [published]);

  const neededSubject = subjects.find((s) => s.id === neededSubjectId);
  const offeredSubject = subjects.find((s) => s.id === offeredSubjectId);

  const failValidation = (message?: string) => {
    playSound('error');
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

    if (!authorId) {
      failValidation(t.create.loadError);
      return;
    }
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
      }, attachments.flatMap((item) => (item.prepared ? [item.prepared] : [])));
      setSubmitting(false);
      setPublished(true);
      bubble();
      playSound('publish');
      window.setTimeout(() => router.push('/'), 900);
    } catch (err: unknown) {
      setSubmitting(false);
      console.error('Error publishing the card:', err);
      failValidation(err instanceof FilesUploadError ? t.files.uploadError : t.create.saveError);
    }
  };

  const neededError = errors.needed ? (errors.sameSubject ? t.create.sameSubject : t.create.neededMissing) : null;
  const offeredError = errors.offered ? (errors.sameSubject ? t.create.sameSubject : t.create.offeredMissing) : null;

  return (
    <MobileShell panel="wide">
      {/* Phones: logo and the Back · title · Cancel row. Desktop: title and × of the panel. */}
      <div className="lg:hidden">
        <AppHeader />
        <CreateNavBar />
      </div>
      <div className="hidden items-center justify-between px-4 pt-2 lg:flex">
        <h1 className="font-bricolage text-[26px] font-extrabold text-ink">{t.create.title}</h1>
        <Link
          href="/"
          aria-label={t.common.close}
          className="flex size-11 items-center justify-center rounded-full bg-soft text-ink transition hover:bg-line active:scale-90"
        >
          <X className="size-5" strokeWidth={2.4} />
        </Link>
      </div>

      <div className="animate-rise px-4 py-2 motion-reduce:animate-none">
        <p className="text-[14px] leading-[21px] font-semibold text-muted">{t.create.intro}</p>
      </div>

      {(serverError || loadFailed) && (
        <div
          key={`err-${shakeTrigger}`}
          role="alert"
          className="mx-4 mb-2 animate-shake rounded-xl border border-danger-line bg-danger-soft p-3 text-xs font-semibold text-danger-ink"
        >
          {serverError ?? t.create.loadError}
        </div>
      )}

      {/* Desktop: form on the left, live preview on the right. */}
      <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_380px] lg:items-start lg:gap-2">
        {/* Form */}
        <div style={{ animationDelay: '70ms' }} className="animate-rise px-4 py-2 motion-reduce:animate-none">
          <div className="space-y-4 rounded-[24px] border border-line bg-surface p-4 shadow-sm lg:border-0 lg:p-0 lg:shadow-none">
            <SubjectSelect
              label={t.create.neededSubject}
              subjects={subjects}
              value={neededSubjectId}
              onChange={(id) => {
                setNeededSubjectId(id);
                setErrors((prev) => ({
                  ...prev,
                  needed: false,
                  sameSubject: false,
                }));
                setServerError(null);
              }}
              error={neededError}
              shakeKey={shakeTrigger}
            />

            <TopicsField
              label={t.create.neededTopics}
              placeholder={t.create.neededPlaceholder}
              value={neededDetails}
              onChange={(text) => {
                setNeededDetails(text);
                if (errors.neededDetails && text.trim()) setErrors((prev) => ({ ...prev, neededDetails: false }));
                setServerError(null);
              }}
              error={errors.neededDetails ? t.create.neededTopicsMissing : null}
              shakeKey={shakeTrigger}
            />

            <AttachmentsField items={attachments} onChange={setAttachments} disabled={submitting || published} />

            <SubjectSelect
              label={t.create.offeredSubject}
              subjects={subjects}
              value={offeredSubjectId}
              onChange={(id) => {
                setOfferedSubjectId(id);
                setErrors((prev) => ({
                  ...prev,
                  offered: false,
                  sameSubject: false,
                }));
                setServerError(null);
              }}
              error={offeredError}
              shakeKey={shakeTrigger}
              spaced
            />

            <TopicsField
              label={t.create.offeredTopics}
              placeholder={t.create.offeredPlaceholder}
              value={offeredDetails}
              onChange={(text) => {
                setOfferedDetails(text);
                if (errors.offeredDetails && text.trim()) setErrors((prev) => ({ ...prev, offeredDetails: false }));
                setServerError(null);
              }}
              error={errors.offeredDetails ? t.create.offeredTopicsMissing : null}
              shakeKey={shakeTrigger}
            />

            <ContactMethodToggle value={contactMethod} onChange={setContactMethod} telegramAvailable={hasTelegram} />
          </div>
        </div>

        <div className="lg:sticky lg:top-6">
          {/* Live preview */}
          <div
            style={{ animationDelay: '140ms' }}
            className="animate-rise px-4 pt-4 pb-2 motion-reduce:animate-none lg:pt-2"
          >
            <h2 className="mb-2.5 text-[11px] font-bold tracking-[0.88px] text-muted uppercase">{t.create.preview}</h2>
            <BarterCard
              author={{
                initials: getInitials(authorName),
                avatarPath: authorAvatar,
                name: authorName,
                subtitle: formatStudyInfo(t, authorStudy.major, authorStudy.year),
              }}
              needs={{
                ...previewHalf(neededSubject, neededDetails, t.create.previewSubject, t.create.previewNeeded),
                attachments: attachments.length,
              }}
              teaches={previewHalf(offeredSubject, offeredDetails, t.create.previewSubject, t.create.previewOffered)}
              contactMethod={contactMethod}
            />
          </div>

          <div style={{ animationDelay: '210ms' }} className="animate-rise px-4 py-2 motion-reduce:animate-none">
            <div className="flex items-center gap-3 rounded-[16px] bg-brand-soft p-4">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-linear-to-br from-brand-from to-brand-to text-white shadow-[0_4px_12px_rgba(173,70,255,0.3)]">
                <ShieldCheck aria-hidden className="size-5" strokeWidth={2.2} />
              </span>
              <p className="text-[13px] leading-[19px] font-semibold text-ink">{t.create.privacyNote}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Publish: at the end of the form, not pinned to the screen */}
      <div
        style={{ animationDelay: '280ms' }}
        className="animate-rise px-4 pt-2 pb-4 motion-reduce:animate-none lg:flex lg:items-center lg:justify-end lg:gap-3 lg:pt-4"
      >
        <Link
          href="/"
          className="hidden h-[56px] items-center rounded-[16px] border border-line-strong bg-surface px-7 text-[16px] font-bold text-ink transition hover:bg-soft active:scale-[0.97] lg:flex"
        >
          {t.common.cancel}
        </Link>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={submitting || loadingSubjects || published}
          className={`bubbly flex h-[56px] w-full cursor-pointer lg:w-auto lg:px-10 items-center justify-center gap-2 rounded-[16px] bg-linear-to-r from-brand-fill-from to-brand-fill-to text-[17px] font-bold text-white shadow-[0_8px_20px_rgba(200,40,140,0.28)] transition hover:opacity-95 active:scale-[0.97] disabled:cursor-default ${
            published ? '' : 'disabled:opacity-50'
          } ${bubbling ? 'bubbly-animate' : ''}`}
        >
          {published ? (
            <span className="flex animate-pop items-center gap-2 motion-reduce:animate-none">
              <Check className="size-5" strokeWidth={3} />
              {t.create.published}
            </span>
          ) : submitting ? (
            t.create.publishing
          ) : (
            t.create.publish
          )}
        </button>
      </div>
    </MobileShell>
  );
}
