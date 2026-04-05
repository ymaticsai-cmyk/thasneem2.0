import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';

/**
 * html5-qrcode sets the <video> width from container.clientWidth when the stream starts.
 * If that is 0 (before layout / flex), the video is 0px wide → black box while the camera LED is on.
 */
export default function QRScanner({ onScan, onError, guidedFrame = false }) {
  const containerIdRef = useRef(`h5qr-${Math.random().toString(36).slice(2, 12)}`);
  const html5Ref = useRef(null);
  const onScanRef = useRef(onScan);
  const onErrorRef = useRef(onError);
  const [starting, setStarting] = useState(true);
  const [hint, setHint] = useState('');

  useEffect(() => {
    onScanRef.current = onScan;
  }, [onScan]);

  useEffect(() => {
    onErrorRef.current = onError;
  }, [onError]);

  useLayoutEffect(() => {
    const id = containerIdRef.current;
    const el = document.getElementById(id);
    if (el) {
      el.style.width = '100%';
      el.style.minWidth = '320px';
      el.style.minHeight = '280px';
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    const id = containerIdRef.current;

    const waitForSize = () =>
      new Promise((resolve) => {
        const tick = () => {
          const el = document.getElementById(id);
          if (cancelled) {
            resolve(false);
            return;
          }
          if (el && el.clientWidth >= 80) {
            resolve(true);
            return;
          }
          if (el) {
            el.style.minWidth = '320px';
            el.style.width = '100%';
          }
          requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      });

    // No `qrbox` → full frame scan and no dark shaded overlay (see html5-qrcode docs).
    const config = guidedFrame
      ? {
          fps: 10,
          qrbox: (viewfinderWidth, viewfinderHeight) => {
            const edge = Math.min(viewfinderWidth, viewfinderHeight);
            const size = Math.max(140, Math.floor(edge * 0.72));
            return { width: size, height: size };
          },
        }
      : { fps: 10 };

    const tryConfigs = [
      { facingMode: 'environment' },
      { facingMode: 'user' },
      true,
    ];

    const start = async () => {
      await new Promise((r) => requestAnimationFrame(r));
      await waitForSize();
      if (cancelled) return;

      let lastErr;
      for (const cameraIdOrConfig of tryConfigs) {
        if (cancelled) return;
        const html5 = new Html5Qrcode(id, false);
        try {
          await html5.start(
            cameraIdOrConfig,
            config,
            (decodedText) => onScanRef.current?.(decodedText),
            () => {}
          );
          html5Ref.current = html5;
          if (!cancelled) {
            setStarting(false);
            setHint(
              cameraIdOrConfig === true
                ? ''
                : typeof cameraIdOrConfig === 'object' &&
                    cameraIdOrConfig.facingMode === 'user'
                  ? 'Using front camera'
                  : ''
            );
          }
          return;
        } catch (e) {
          lastErr = e;
          try {
            await html5.stop();
          } catch {
            /* ignore */
          }
          try {
            html5.clear();
          } catch {
            /* ignore */
          }
        }
      }

      if (!cancelled) {
        setStarting(false);
        onErrorRef.current?.(lastErr?.message || 'Camera failed');
      }
    };

    start();

    return () => {
      cancelled = true;
      const h = html5Ref.current;
      html5Ref.current = null;
      if (h) {
        Promise.resolve()
          .then(() => h.stop())
          .then(() => h.clear())
          .catch(() => {});
      }
    };
  }, [guidedFrame]);

  return (
    <div className="qr-scanner-shell relative w-full max-w-lg overflow-hidden rounded-2xl border border-slate-200 bg-slate-100 shadow-sm">
      {starting && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-slate-200/90 text-sm text-slate-700">
          Starting camera…
        </div>
      )}
      {hint && !starting && (
        <div className="bg-slate-800 px-3 py-1 text-center text-xs text-slate-300">{hint}</div>
      )}
      <div id={containerIdRef.current} className="qr-scanner-host relative min-h-[280px] w-full" />
    </div>
  );
}
