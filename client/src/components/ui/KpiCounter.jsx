import { useEffect, useRef, useState } from 'react';

export default function KpiCounter({ value = 0, duration = 700, className = '' }) {
  const [display, setDisplay] = useState(0);
  const rafRef = useRef(0);

  useEffect(() => {
    const start = performance.now();
    const from = display;
    const delta = value - from;
    cancelAnimationFrame(rafRef.current);

    const tick = (now) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - (1 - progress) ** 3;
      setDisplay(Math.round(from + delta * eased));
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(tick);
      }
    };
    rafRef.current = requestAnimationFrame(tick);

    return () => cancelAnimationFrame(rafRef.current);
  }, [value]);

  return <span className={className}>{display}</span>;
}
