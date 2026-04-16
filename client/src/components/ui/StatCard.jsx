import Card from './Card';
import KpiCounter from './KpiCounter';

export default function StatCard({ icon: Icon, label, value, tone = 'info' }) {
  const toneMap = {
    info: 'text-info bg-info-soft',
    warning: 'text-warning bg-warning-soft',
    success: 'text-success bg-success-soft',
    danger: 'text-danger bg-danger-soft',
  };

  const numericValue = Number(value);
  const isNumeric = Number.isFinite(numericValue);

  return (
    <Card className="group relative overflow-hidden">
      <div className="pointer-events-none absolute -right-8 -top-8 h-20 w-20 rounded-full bg-primary-fade blur-2xl transition-transform duration-[var(--duration-slow)] group-hover:scale-125" />
      <div className="relative flex items-start justify-between gap-3">
        <div>
          <p className="text-sm text-text-muted">{label}</p>
          {isNumeric ? (
            <KpiCounter value={numericValue} className="mt-2 font-display text-3xl font-semibold text-text" />
          ) : (
            <p className="mt-2 text-base font-semibold text-text">{value}</p>
          )}
        </div>
        <div className={`rounded-lg p-2 ${toneMap[tone] || toneMap.info}`}>{Icon ? <Icon size={18} /> : null}</div>
      </div>
    </Card>
  );
}
