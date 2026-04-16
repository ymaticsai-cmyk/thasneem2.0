import { UserRound } from 'lucide-react';
import { cx } from './utils';

export default function PatientCard({ name, subtitle, selected = false, onClick, actionLabel = 'Select' }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cx(
        'flex w-full items-center justify-between rounded-lg border px-3 py-2 text-left transition-all',
        selected
          ? 'border-primary bg-primary-light text-primary shadow-[var(--shadow-glow)]'
          : 'border-border bg-surface text-text hover:bg-surface-muted'
      )}
    >
      <div className="flex items-center gap-2">
        <span className="rounded-md bg-surface-muted p-1.5 text-text-muted">
          <UserRound size={14} />
        </span>
        <span>
          <p className="text-sm font-medium">{name}</p>
          <p className="text-xs text-text-muted">{subtitle}</p>
        </span>
      </div>
      <span className="text-xs font-semibold">{selected ? 'Selected' : actionLabel}</span>
    </button>
  );
}
