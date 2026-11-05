import { createContext, useCallback, useContext, useState, type ReactNode } from 'react';
import { Check, Copy } from 'lucide-react';
import { copyText } from '../utils/browser';

// ── Toast ────────────────────────────────────────────────────
interface ToastCtx {
  notify: (msg: string, kind?: 'ok' | 'err') => void;
}
const ToastContext = createContext<ToastCtx>({ notify: () => undefined });

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<{ id: number; msg: string; kind: 'ok' | 'err' }[]>([]);
  const notify = useCallback((msg: string, kind: 'ok' | 'err' = 'ok') => {
    const id = Date.now() + Math.random();
    setItems((s) => [...s.slice(-2), { id, msg, kind }]);
    setTimeout(() => setItems((s) => s.filter((x) => x.id !== id)), 2600);
  }, []);
  return (
    <ToastContext.Provider value={{ notify }}>
      {children}
      <div className="pointer-events-none fixed bottom-4 right-4 z-50 flex flex-col gap-2" data-testid="toasts">
        {items.map((t) => (
          <div
            key={t.id}
            className={`pointer-events-auto rounded-lg border px-4 py-2 text-sm shadow-xl backdrop-blur ${
              t.kind === 'ok' ? 'border-accent/40 bg-studio-800/95 text-accent' : 'border-rose-500/40 bg-rose-950/90 text-rose-200'
            }`}
          >
            {t.msg}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);

// ── Copy button ──────────────────────────────────────────────
export function CopyButton({ text, label = 'Copy', className = '', size = 'sm' }: { text: string; label?: string; className?: string; size?: 'sm' | 'xs' }) {
  const [done, setDone] = useState(false);
  const { notify } = useToast();
  return (
    <button
      type="button"
      className={`${done ? 'btn-primary' : 'btn-ghost'} ${size === 'xs' ? 'btn-xs' : ''} ${className}`}
      onClick={async () => {
        const ok = await copyText(text);
        if (ok) {
          setDone(true);
          notify('✅ Đã copy vào clipboard');
          setTimeout(() => setDone(false), 1400);
        } else notify('Không copy được — hãy bôi đen thủ công', 'err');
      }}
      title="Copy 1 chạm"
    >
      {done ? <Check size={14} /> : <Copy size={14} />}
      {done ? 'Copied' : label}
    </button>
  );
}

// ── Layout bits ──────────────────────────────────────────────
export function Card({ title, icon, actions, children, className = '', subtitle }: { title?: ReactNode; subtitle?: ReactNode; icon?: ReactNode; actions?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={`card ${className}`}>
      {(title || actions) && (
        <header className="flex flex-wrap items-center justify-between gap-2 border-b border-studio-700/70 px-4 py-3">
          <div className="min-w-0">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-100">
              {icon}
              {title}
            </h3>
            {subtitle && <p className="mt-0.5 text-xs text-slate-400">{subtitle}</p>}
          </div>
          {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
        </header>
      )}
      <div className="card-pad">{children}</div>
    </section>
  );
}

export function scoreColor(score: number): string {
  if (score >= 75) return '#14e0b0';
  if (score >= 58) return '#38bdf8';
  if (score >= 40) return '#fbbf24';
  return '#f87171';
}

export function ProgressBar({ value, color }: { value: number; color?: string }) {
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-studio-700">
      <div className="h-full rounded-full transition-all duration-500" style={{ width: `${Math.max(2, Math.min(100, value))}%`, background: color ?? scoreColor(value) }} />
    </div>
  );
}

export function Gauge({ value, size = 150, label }: { value: number; size?: number; label?: string }) {
  const r = size / 2 - 12;
  const c = 2 * Math.PI * r;
  const arc = c * 0.75;
  const color = scoreColor(value);
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-[225deg]">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#1f2632" strokeWidth={12} strokeDasharray={`${arc} ${c}`} strokeLinecap="round" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={12}
          strokeDasharray={`${(arc * value) / 100} ${c}`}
          strokeLinecap="round"
          style={{ transition: 'stroke-dasharray .6s ease' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-4xl font-bold tabular-nums" style={{ color }} data-testid="win-rate-value">
          {value}%
        </span>
        {label && <span className="mt-1 text-[11px] uppercase tracking-wider text-slate-400">{label}</span>}
      </div>
    </div>
  );
}

export function Toggle({ checked, onChange, label, testId }: { checked: boolean; onChange: (v: boolean) => void; label: ReactNode; testId?: string }) {
  return (
    <label className="inline-flex cursor-pointer select-none items-center gap-2 text-sm text-slate-300">
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        data-testid={testId}
        onClick={() => onChange(!checked)}
        className={`relative h-5 w-9 rounded-full transition ${checked ? 'bg-accent' : 'bg-studio-600'}`}
      >
        <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition-all ${checked ? 'left-[18px]' : 'left-0.5'}`} />
      </button>
      {label}
    </label>
  );
}

export function Segmented<T extends string>({ value, options, onChange, testId }: { value: T; options: { id: T; label: ReactNode }[]; onChange: (v: T) => void; testId?: string }) {
  return (
    <div className="inline-flex rounded-lg border border-studio-600 bg-studio-850 p-0.5" data-testid={testId}>
      {options.map((o) => (
        <button
          key={o.id}
          type="button"
          onClick={() => onChange(o.id)}
          className={`rounded-md px-3 py-1 text-xs font-medium transition ${value === o.id ? 'bg-accent text-studio-950' : 'text-slate-300 hover:text-white'}`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function Pre({ children, className = '' }: { children: string; className?: string }) {
  return <pre className={`mono overflow-x-auto whitespace-pre rounded-lg border border-studio-700 bg-studio-950 p-3 text-[11.5px] leading-relaxed text-slate-300 ${className}`}>{children}</pre>;
}

export function Empty({ children }: { children: ReactNode }) {
  return <div className="rounded-lg border border-dashed border-studio-600 p-6 text-center text-sm text-slate-500">{children}</div>;
}
