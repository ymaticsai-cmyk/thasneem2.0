import { cx } from './utils';

export default function Card({ className = '', children }) {
  return (
    <section className={cx('glass-panel animate-rise-in rounded-xl p-5 text-text', className)}>
      {children}
    </section>
  );
}
