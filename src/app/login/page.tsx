'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { ArrowLeft, Loader2, MailCheck } from 'lucide-react';
import { CodeInput } from '@/components/auth/CodeInput';
import { HeroCard } from '@/components/auth/HeroCard';
import { AppHeader } from '@/components/layout/AppHeader';
import { MobileShell } from '@/components/layout/MobileShell';
import { Toast, useToast } from '@/components/ui/Toast';
import { RESEND_SECONDS, STUDENT_EMAIL_RE, sendCode, verifyCode } from '@/lib/auth';
import { useReplay } from '@/lib/useReplay';

const HEADLINE = 'Trade what you know for what you need.';

function MicrosoftLogo() {
  return (
    <svg aria-hidden viewBox="0 0 21 21" className="size-5 shrink-0">
      <rect x="0" y="0" width="10" height="10" fill="#F25022" />
      <rect x="11" y="0" width="10" height="10" fill="#7FBA00" />
      <rect x="0" y="11" width="10" height="10" fill="#00A4EF" />
      <rect x="11" y="11" width="10" height="10" fill="#FFB900" />
    </svg>
  );
}

/** The headline, word by word. */
function Headline() {
  return (
    <h1 className="font-bricolage text-[36px] leading-[1.1] font-bold text-ink">
      {HEADLINE.split(' ').map((word, index) => (
        <span
          key={index}
          style={{ animationDelay: `${index * 70}ms` }}
          className="inline-block animate-rise motion-reduce:animate-none"
        >
          {word}&nbsp;
        </span>
      ))}
    </h1>
  );
}

export default function LoginPage() {
  const [step, setStep] = useState<'email' | 'code'>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  /** Changes on every failed attempt, to replay the shake. */
  const [shake, setShake] = useState(0);
  const [resendIn, setResendIn] = useState(0);
  const [bubbling, bubble] = useReplay(700);
  const { toast, show: showToast, hide: hideToast } = useToast();

  useEffect(() => {
    if (resendIn <= 0) return;
    const timer = window.setTimeout(() => setResendIn((s) => s - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [resendIn]);

  const fail = (message: string) => {
    setError(message);
    setShake((n) => n + 1);
  };

  const requestCode = async () => {
    setBusy(true);
    setError(null);
    try {
      await sendCode(email);
      setCode('');
      setStep('code');
      setResendIn(RESEND_SECONDS);
    } catch (err: unknown) {
      fail(err instanceof Error ? err.message : 'Could not send the code');
    } finally {
      setBusy(false);
    }
  };

  const submitEmail = (event: FormEvent) => {
    event.preventDefault();
    if (!STUDENT_EMAIL_RE.test(email.trim())) {
      fail('Enter your student e-mail: 6 digits @astanait.edu.kz');
      return;
    }
    bubble();
    void requestCode();
  };

  const submitCode = async (value: string) => {
    setBusy(true);
    setError(null);
    try {
      await verifyCode(email, value);
      // Signed in: the AuthGate takes the student to the app or to "Complete your profile".
    } catch (err: unknown) {
      setCode('');
      fail(err instanceof Error ? err.message : 'Could not check the code');
      setBusy(false);
    }
  };

  const footer = (
    <div className="relative">
      <Toast toast={toast} onHide={hideToast} />
    </div>
  );

  return (
    <MobileShell footer={footer}>
      <AppHeader />

      {/* 16px sides, 8px top and bottom, 16px between blocks. */}
      <div className="flex flex-col gap-4 px-4 py-2">
        {step === 'email' ? (
          <>
            <Headline />
            <p style={{ animationDelay: '500ms' }} className="animate-rise text-base font-semibold text-muted motion-reduce:animate-none">
              Find study partners on your campus. No money, just a fair swap.
            </p>

            <div style={{ animationDelay: '600ms' }} className="animate-rise motion-reduce:animate-none">
              <HeroCard />
            </div>

            <form
              onSubmit={submitEmail}
              noValidate
              style={{ animationDelay: '700ms' }}
              className="flex animate-rise flex-col gap-4 motion-reduce:animate-none"
            >
              <label key={shake} className={`flex flex-col gap-2 ${error ? 'animate-shake motion-reduce:animate-none' : ''}`}>
                <span className="text-sm font-semibold text-ink">University email</span>
                <input
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  autoCapitalize="none"
                  spellCheck={false}
                  value={email}
                  onChange={(event) => {
                    setEmail(event.target.value);
                    setError(null);
                  }}
                  placeholder="barcode@astanait.edu.kz"
                  aria-invalid={error ? true : undefined}
                  className={`h-12 rounded-xl border bg-white px-4 text-base font-medium text-ink outline-none transition-[border-color,box-shadow] placeholder:text-placeholder ${
                    error
                      ? 'border-danger ring-2 ring-red-100'
                      : 'border-field focus:border-brand-from focus:shadow-[0_0_0_3px_rgba(173,70,255,0.15)]'
                  }`}
                />
                <span className={`text-xs font-semibold ${error ? 'text-danger' : 'text-muted'}`}>
                  {error ?? 'Only university emails are accepted. This keeps StudySwap student-only.'}
                </span>
              </label>

              <button
                type="submit"
                disabled={busy}
                className={`bubbly flex h-12 cursor-pointer items-center justify-center gap-2 rounded-xl bg-linear-to-r from-brand-from to-brand-to text-lg font-semibold text-white shadow-[0_8px_20px_rgba(200,40,140,0.25)] transition active:scale-[0.97] disabled:cursor-default disabled:opacity-70 ${
                  bubbling ? 'bubbly-animate' : ''
                }`}
              >
                {busy && <Loader2 className="size-5 animate-spin" />}
                Continue
              </button>
            </form>

            <div style={{ animationDelay: '800ms' }} className="flex animate-rise flex-col gap-4 motion-reduce:animate-none">
              <div className="h-px bg-line-strong" />
              <button
                type="button"
                onClick={() => showToast('Microsoft sign-in is coming soon')}
                className="flex h-12 cursor-pointer items-center justify-center gap-2.5 rounded-xl border border-line-strong bg-white text-base font-semibold text-ink transition hover:bg-soft active:scale-[0.98]"
              >
                <MicrosoftLogo />
                Login with Microsoft
              </button>
            </div>
          </>
        ) : (
          <div className="flex animate-rise flex-col gap-5 motion-reduce:animate-none">
            <button
              type="button"
              onClick={() => {
                setStep('email');
                setError(null);
              }}
              className="-ml-1 flex w-fit cursor-pointer items-center gap-1.5 rounded-lg px-1 py-1 text-sm font-semibold text-muted transition hover:text-ink"
            >
              <ArrowLeft className="size-4" />
              Change email
            </button>

            <span className="flex size-16 animate-pop items-center justify-center rounded-2xl bg-linear-to-br from-brand-from to-brand-to text-white shadow-[0_8px_20px_rgba(173,70,255,0.3)] motion-reduce:animate-none">
              <MailCheck className="size-8" strokeWidth={2} />
            </span>

            <div className="flex flex-col gap-2">
              <h1 className="font-bricolage text-3xl font-bold text-ink">Check your email</h1>
              <p className="text-base font-semibold text-muted">
                We sent a 6-digit code to <span className="text-ink">{email.trim().toLowerCase()}</span>. It may take a
                minute; check Spam too.
              </p>
            </div>

            <CodeInput
              key={shake}
              value={code}
              onChange={(value) => {
                setCode(value);
                setError(null);
              }}
              onComplete={submitCode}
              disabled={busy}
              error={Boolean(error)}
            />

            <p className={`min-h-5 text-sm font-semibold ${error ? 'text-danger' : 'text-muted'}`}>
              {busy ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="size-4 animate-spin text-brand-from" />
                  Checking the code...
                </span>
              ) : (
                (error ?? 'The code works for 10 minutes.')
              )}
            </p>

            <button
              type="button"
              onClick={() => void requestCode()}
              disabled={busy || resendIn > 0}
              className="h-12 cursor-pointer rounded-xl border border-line-strong bg-white text-sm font-bold text-ink transition hover:bg-soft active:scale-[0.98] disabled:cursor-default disabled:text-muted disabled:hover:bg-white"
            >
              {resendIn > 0 ? `Resend code in ${resendIn}s` : 'Resend code'}
            </button>
          </div>
        )}
      </div>
    </MobileShell>
  );
}
