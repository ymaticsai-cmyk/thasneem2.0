import { cx } from './utils';

const toneMap = {
  primary:
    'bg-primary text-bg hover:bg-primary-strong hover:shadow-[var(--shadow-glow)] active:translate-y-px disabled:bg-primary/60',
  ghost:
    'bg-transparent text-text-muted hover:bg-surface-muted hover:text-text active:translate-y-px disabled:opacity-50',
  secondary:
    'bg-surface-muted text-text hover:bg-primary-light hover:border-primary/40 active:translate-y-px disabled:opacity-50',
  danger:
    'bg-danger text-bg hover:brightness-95 active:translate-y-px disabled:opacity-50',
};

const sizeMap = {
  sm: 'h-9 px-3 text-sm',
  md: 'h-10 px-4 text-sm',
  lg: 'h-11 px-5 text-base',
};

export default function Button({
  tone = 'primary',
  size = 'md',
  className = '',
  type = 'button',
  ...props
}) {
  return (
    <button
      type={type}
      className={cx(
        'inline-flex items-center justify-center gap-2 rounded-md border border-transparent font-medium transition-all duration-[var(--duration-fast)] ease-[var(--ease-standard)]',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg',
        'disabled:cursor-not-allowed',
        toneMap[tone],
        sizeMap[size],
        className
      )}
      {...props}
    />
  );
}
