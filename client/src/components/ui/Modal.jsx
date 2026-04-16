import { useEffect } from 'react';
import Button from './Button';

export default function Modal({ open, title, onClose, children }) {
  useEffect(() => {
    if (!open) return undefined;
    const handleEscape = (event) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[var(--z-modal)] flex items-center justify-center bg-overlay px-3 py-4 sm:px-4">
      <div className="glass-panel max-h-[90dvh] w-full max-w-lg overflow-y-auto rounded-xl p-4 sm:p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold">{title}</h2>
          <Button tone="ghost" size="sm" onClick={onClose} aria-label="Close modal">
            Close
          </Button>
        </div>
        {children}
      </div>
    </div>
  );
}
