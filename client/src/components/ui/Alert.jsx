import { cx } from './utils';

const toneMap = {
  info: 'border-info/35 bg-info-soft text-info',
  success: 'border-success/30 bg-success-soft text-success',
  warning: 'border-warning/30 bg-warning-soft text-warning',
  danger: 'border-danger/30 bg-danger-soft text-danger',
};

export default function Alert({ tone = 'info', className = '', children }) {
  return <div className={cx('rounded-md border px-3 py-2 text-sm', toneMap[tone], className)}>{children}</div>;
}
