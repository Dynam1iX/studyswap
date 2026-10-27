export const TOPICS_MAX_LENGTH = 150;

interface TopicsFieldProps {
  label: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  error: string | null;
  shakeKey: number;
}

/** Counter colour as the text gets close to the limit. */
const COUNTER_COLOR = { ok: 'text-muted', near: 'text-amber-600', max: 'text-danger' } as const;

/** Characters as the database counts them (an emoji is one, not two). */
function chars(text: string): string[] {
  return Array.from(text);
}

export function TopicsField({ label, placeholder, value, onChange, error, shakeKey }: TopicsFieldProps) {
  const length = chars(value).length;
  // The counter trembles once when it enters "near" (130+) and again at the limit.
  const counterLevel: keyof typeof COUNTER_COLOR =
    length >= TOPICS_MAX_LENGTH ? 'max' : length >= TOPICS_MAX_LENGTH - 20 ? 'near' : 'ok';

  return (
    <div key={shakeKey} className={`space-y-1.5 pt-1 transition ${error ? 'animate-shake' : ''}`}>
      <label className="block text-[14px] font-bold text-ink">
        {label} <span className="text-xs font-semibold text-brand-ink">*</span>
      </label>

      <textarea
        value={value}
        onChange={(event) => onChange(chars(event.target.value).slice(0, TOPICS_MAX_LENGTH).join(''))}
        placeholder={placeholder}
        rows={3}
        className={`block w-full resize-none rounded-[14px] border p-3 text-[16px] leading-relaxed sm:text-[14px] font-semibold text-ink placeholder-placeholder outline-none transition ${
          error ? 'border-danger ring-2 ring-red-100' : 'border-field focus:border-brand-from'
        }`}
      />

      {/* Under the field, so it never covers the text (long KZ / RU placeholders too). */}
      <div className="flex items-start justify-between gap-3">
        {error ? <p className="text-[12px] font-semibold text-danger">{error}</p> : <span />}
        <span
          key={counterLevel}
          className={`shrink-0 text-[12px] font-semibold transition-colors duration-300 select-none ${
            COUNTER_COLOR[counterLevel]
          } ${counterLevel === 'ok' ? '' : 'animate-tremble motion-reduce:animate-none'}`}
        >
          {length} / {TOPICS_MAX_LENGTH}
        </span>
      </div>
    </div>
  );
}
