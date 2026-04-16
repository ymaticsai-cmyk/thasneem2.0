import { Inbox } from 'lucide-react';
import Card from './Card';

export default function EmptyState({ title, description, action }) {
  return (
    <Card className="border border-dashed border-border text-center">
      <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-surface-muted text-text-muted">
        <Inbox size={18} />
      </div>
      <h3 className="font-display text-lg font-semibold">{title}</h3>
      <p className="mx-auto mt-2 max-w-md text-sm text-text-muted">{description}</p>
      {action ? <div className="mt-4">{action}</div> : null}
    </Card>
  );
}
