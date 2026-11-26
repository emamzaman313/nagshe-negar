/* Accessible ambient pointer lighting for desktop; disabled on touch and reduced motion. */
(() => {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;
  const root = document.documentElement;
  const reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = window.matchMedia && window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  if (reduced || !fine) return;
  let frame = 0, x = 0.5, y = 0.22;
  const paint = () => { frame = 0; root.style.setProperty('--nn-pointer-x', (x * 100) + '%'); root.style.setProperty('--nn-pointer-y', (y * 100) + '%'); };
  const move = (event) => {
    if (event.pointerType === 'touch') return;
    x = Math.max(0, Math.min(1, event.clientX / Math.max(1, window.innerWidth)));
    y = Math.max(0, Math.min(1, event.clientY / Math.max(1, window.innerHeight)));
    if (!frame) frame = window.requestAnimationFrame(paint);
  };
  const leave = () => { x = 0.5; y = 0.18; if (!frame) frame = window.requestAnimationFrame(paint); };
  window.addEventListener('pointermove', move, { passive: true });
  document.documentElement.addEventListener('pointerleave', leave, { passive: true });
  window.addEventListener('pagehide', () => {
    window.removeEventListener('pointermove', move);
    document.documentElement.removeEventListener('pointerleave', leave);
    if (frame) window.cancelAnimationFrame(frame);
  }, { once: true });
})();
