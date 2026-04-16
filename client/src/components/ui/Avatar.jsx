import { cx } from './utils';

export default function Avatar({ name = 'User', className = '' }) {
  const initials = name
    .split(' ')
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <div
      className={cx(
        'flex h-9 w-9 items-center justify-center rounded-full border border-border bg-primary-light text-xs font-semibold text-primary shadow-[var(--shadow-soft)]',
        className
      )}
      aria-label={name}
      title={name}
    >
      {initials || 'U'}
    </div>
  );
}
