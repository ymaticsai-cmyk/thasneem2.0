import { cx } from './utils';

const toneMap = {
  neutral: 'bg-surface-muted text-text-muted',
  info: 'bg-info-soft text-info',
  success: 'bg-success-soft text-success',
  warning: 'bg-warning-soft text-warning',
  danger: 'bg-danger-soft text-danger',
};

export default function Badge({ tone = 'neutral', className = '', children }) {
  return (
    <span className={cx('inline-flex rounded-full px-2.5 py-1 text-xs font-medium', toneMap[tone], className)}>
      {children}
    </span>
  );
}
