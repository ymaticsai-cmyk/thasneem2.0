import { Check } from 'lucide-react';
import { cx } from './utils';

export default function ProgressSteps({ steps = [], current = 0 }) {
  return (
    <ol className="grid gap-2 md:grid-cols-4">
      {steps.map((step, index) => {
        const isDone = index < current;
        const isCurrent = index === current;
        return (
          <li
            key={step}
            className={cx(
              'rounded-lg border px-3 py-2 text-sm transition-all',
              isCurrent
                ? 'border-primary bg-primary-light text-primary shadow-[var(--shadow-glow)]'
                : isDone
                  ? 'border-success/40 bg-success-soft text-success'
                  : 'border-border bg-surface text-text-muted'
            )}
          >
            <div className="flex items-center gap-2">
              <span className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-current text-[10px]">
                {isDone ? <Check size={12} /> : index + 1}
              </span>
              <span>{step}</span>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
