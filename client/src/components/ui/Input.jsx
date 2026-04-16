import { cx } from './utils';

export default function Input({ className = '', ...props }) {
  return (
    <input
      className={cx(
        'h-10 w-full rounded-lg border border-border bg-surface px-3 text-sm text-text placeholder:text-text-soft',
        'transition-colors duration-[var(--duration-fast)] ease-[var(--ease-standard)]',
        'focus-visible:border-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2 focus-visible:ring-offset-bg',
        'disabled:cursor-not-allowed disabled:opacity-60',
        className
      )}
      {...props}
    />
  );
}
