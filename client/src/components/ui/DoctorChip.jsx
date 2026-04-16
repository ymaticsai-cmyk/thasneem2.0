import { Stethoscope } from 'lucide-react';
import { cx } from './utils';

export default function DoctorChip({ name, specialty, selected = false, onClick }) {
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
      <div>
        <p className="text-sm font-medium">{name}</p>
        <p className="text-xs text-text-muted">{specialty || 'Specialty not set'}</p>
      </div>
      <Stethoscope size={16} />
    </button>
  );
}
