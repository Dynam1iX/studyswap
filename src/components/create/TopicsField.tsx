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

export function TopicsField({ label, placeholder, value, onChange, error, shakeKey }: TopicsFieldProps) {
  // The counter trembles once when it enters "near" (130+) and again at the limit.
  const counterLevel: keyof typeof COUNTER_COLOR =
    value.length >= TOPICS_MAX_LENGTH ? 'max' : value.length >= TOPICS_MAX_LENGTH - 20 ? 'near' : 'ok';

  return (
    <div key={shakeKey} className={`space-y-1.5 pt-1 transition ${error ? 'animate-shake' : ''}`}>
      <label className="block text-[14px] font-bold text-ink">
        {label} <span className="text-xs font-semibold text-brand-from">*</span>
      </label>

      <div className="relative">
        <textarea
          value={value}
          onChange={(event) => onChange(event.target.value.slice(0, TOPICS_MAX_LENGTH))}
          placeholder={placeholder}
          rows={2}
          className={`w-full resize-none rounded-[14px] border p-3 pb-7 text-[16px] leading-relaxed sm:text-[14px] font-semibold text-ink placeholder-placeholder outline-none transition ${
            error ? 'border-danger ring-2 ring-red-100' : 'border-field focus:border-brand-from'
          }`}
        />
        <span
          key={counterLevel}
          className={`absolute right-3 bottom-2 text-[12px] font-semibold transition-colors duration-300 select-none ${
            COUNTER_COLOR[counterLevel]
          } ${counterLevel === 'ok' ? '' : 'animate-tremble motion-reduce:animate-none'}`}
        >
          {value.length} / {TOPICS_MAX_LENGTH}
        </span>
      </div>

      {error && <p className="text-[12px] font-semibold text-danger">{error}</p>}
    </div>
  );
}
