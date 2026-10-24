'use client';

import { useEffect, useState, type FormEvent, type ReactNode } from 'react';
import { ChevronDown, Loader2, Lock } from 'lucide-react';
import { AppHeader } from '@/components/layout/AppHeader';
import { MobileShell } from '@/components/layout/MobileShell';
import { completeProfile, currentEmail, nameFromAccount, signOut, type NewProfile } from '@/lib/auth';
import { PROGRAM_GROUPS, STUDY_YEARS } from '@/lib/search';
import type { StudyYear } from '@/types/database';
import { useT } from '@/i18n';


const DEGREES: NewProfile['degree'][] = ['Undergraduate', "Master's Degree"];

const FIELD =
  'h-12 w-full rounded-xl border border-field bg-surface px-4 text-[16px] font-semibold text-ink outline-none transition-[border-color,box-shadow] placeholder:text-placeholder focus:border-brand-from focus:shadow-[0_0_0_3px_rgba(173,70,255,0.15)] sm:text-[15px]';

function Field({ label, children, delay }: { label: string; children: ReactNode; delay: number }) {
  return (
    <label style={{ animationDelay: `${delay}ms` }} className="flex animate-rise flex-col gap-2 motion-reduce:animate-none">
      <span className="text-sm font-semibold text-ink">{label}</span>
      {children}
    </label>
  );
}

/** Segmented choice with a gradient pill on the selected option. */
function Segmented<T extends string | number>({
  options,
  value,
  onChange,
  label,
}: {
  options: { value: T; label: string }[];
  value: T | null;
  onChange: (value: T) => void;
  label: string;
}) {
  return (
    <div role="radiogroup" aria-label={label} className="flex gap-1 rounded-2xl bg-soft p-1">
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <button
            key={String(option.value)}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(option.value)}
            className={`relative h-11 flex-1 cursor-pointer overflow-hidden rounded-xl text-sm font-bold transition-[color,transform] duration-300 active:scale-95 ${
              selected ? 'text-white' : 'text-ink hover:bg-line/60'
            }`}
          >
            <span
              aria-hidden
              className={`absolute inset-0 bg-linear-to-r from-brand-from to-brand-to transition-opacity duration-300 ${
                selected ? 'opacity-100' : 'opacity-0'
              }`}
            />
            <span className="relative">{option.label}</span>
          </button>
        );
      })}
    </div>
  );
}

/** First sign-in: the student fills in their details once; afterwards they are read-only. */
export default function WelcomePage() {
  const t = useT();
  const [email, setEmail] = useState<string | null>(null);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [major, setMajor] = useState('');
  const [studyYear, setStudyYear] = useState<StudyYear | null>(null);
  const [degree, setDegree] = useState<NewProfile['degree'] | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [shake, setShake] = useState(0);

  useEffect(() => {
    void currentEmail().then(setEmail);
    // Signed in with Microsoft: start from the name on the account (still editable).
    void nameFromAccount().then((name) => {
      if (!name) return;
      setFirstName((current) => current || name.firstName.slice(0, 50));
      setLastName((current) => current || name.lastName.slice(0, 50));
    });
  }, []);

  const missing =
    firstName.trim().length < 1
      ? t.welcome.missingFirst
      : lastName.trim().length < 1
        ? t.welcome.missingLast
        : !major
          ? t.welcome.missingMajor
          : !studyYear
            ? t.welcome.missingYear
            : !degree
              ? t.welcome.missingDegree
              : null;

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (missing || !studyYear || !degree) {
      setError(missing);
      setShake((n) => n + 1);
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await completeProfile({ firstName, lastName, major, studyYear, degree });
      // A full load so every page starts with the new profile.
      window.location.assign('/');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t.welcome.saveError);
      setShake((n) => n + 1);
      setBusy(false);
    }
  };

  return (
    <MobileShell panel="narrow">
      <AppHeader />

      <form onSubmit={submit} noValidate className="flex flex-col gap-4 px-4 py-2">
        <div className="flex animate-rise flex-col gap-1 motion-reduce:animate-none">
          <h1 className="font-bricolage text-3xl font-bold text-ink">{t.welcome.title}</h1>
          <p className="text-sm font-semibold text-muted">
            {t.welcome.subtitle}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Field label={t.edit.firstName} delay={60}>
            <input
              value={firstName}
              onChange={(event) => setFirstName(event.target.value.slice(0, 50))}
              autoComplete="given-name"
              placeholder={t.welcome.firstPlaceholder}
              className={FIELD}
            />
          </Field>
          <Field label={t.edit.lastName} delay={100}>
            <input
              value={lastName}
              onChange={(event) => setLastName(event.target.value.slice(0, 50))}
              autoComplete="family-name"
              placeholder={t.welcome.lastPlaceholder}
              className={FIELD}
            />
          </Field>
        </div>

        <Field label={t.edit.major} delay={140}>
          <span className="relative">
            <select
              value={major}
              onChange={(event) => setMajor(event.target.value)}
              className={`${FIELD} cursor-pointer appearance-none pr-10 ${major ? '' : 'text-placeholder'}`}
            >
              <option value="" disabled>
                {t.welcome.majorPlaceholder}
              </option>
              {PROGRAM_GROUPS.flat().map((program) => (
                <option key={program.label} value={program.label}>
                  {program.label}
                </option>
              ))}
            </select>
            <ChevronDown aria-hidden className="pointer-events-none absolute top-1/2 right-3 size-5 -translate-y-1/2 text-muted" />
          </span>
        </Field>

        <Field label={t.edit.yearOfStudy} delay={180}>
          <Segmented
            label={t.edit.yearOfStudy}
            options={STUDY_YEARS.map((year) => ({ value: year, label: t.common.year(year) }))}
            value={studyYear}
            onChange={setStudyYear}
          />
        </Field>

        <Field label={t.edit.degree} delay={220}>
          <Segmented label={t.edit.degree} options={DEGREES.map((value) => ({ value, label: t.degree[value] }))} value={degree} onChange={setDegree} />
        </Field>

        <div
          style={{ animationDelay: '260ms' }}
          className="flex animate-rise items-center justify-between gap-3 rounded-2xl bg-soft px-4 py-3 motion-reduce:animate-none"
        >
          <div className="flex min-w-0 flex-col">
            <span className="text-xs font-semibold text-muted">{t.edit.email}</span>
            <span className="truncate text-[15px] font-bold text-ink">{email ?? '…'}</span>
          </div>
          <Lock aria-hidden className="size-4 shrink-0 text-placeholder" />
        </div>

        <p className="flex items-start gap-2 text-xs font-medium text-muted">
          <Lock aria-hidden className="mt-px size-3.5 shrink-0" strokeWidth={2.4} />
          {t.welcome.checkCarefully}
        </p>

        {error && (
          <p key={shake} className="animate-shake rounded-xl border border-danger-line bg-danger-soft p-3 text-xs font-semibold text-danger-ink">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={busy}
          className="shine flex h-14 cursor-pointer items-center justify-center gap-2 rounded-2xl bg-linear-to-r from-brand-from to-brand-to text-[17px] font-bold text-white shadow-[0_8px_20px_rgba(200,40,140,0.28)] transition active:scale-[0.98] disabled:opacity-70"
        >
          {busy && <Loader2 className="size-5 animate-spin" />}
          {t.welcome.start}
        </button>

        <button
          type="button"
          onClick={() => void signOut().then(() => window.location.assign('/login'))}
          className="h-11 cursor-pointer text-sm font-semibold text-muted transition hover:text-ink"
        >
          {t.welcome.otherEmail}
        </button>
      </form>
    </MobileShell>
  );
}
