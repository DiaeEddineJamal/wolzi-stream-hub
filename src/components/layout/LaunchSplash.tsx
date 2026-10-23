import { Component, lazy, Suspense, useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import './LaunchSplash.css';

const LiquidGlassLogo = lazy(() => import('../vendor/reactdrops/liquid-glass-logo').then(module => ({ default: module.LiquidGlassLogo })));
const RETURN_AFTER_MS = 5 * 60 * 1000;
const LOGO = '/brand/admax-logo.png';

// A failed animation chunk must never prevent entry into the app.
class AnimationFallback extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() { return this.state.failed ? null : this.props.children; }
}

/** Lives above routing so navigation never replays the launch animation. */
export default function LaunchSplash({ children }: { children: ReactNode }) {
  const [launch, setLaunch] = useState(1);
  const [active, setActive] = useState(true);
  const [leaving, setLeaving] = useState(false);
  const [ready, setReady] = useState(false);
  const [foreground, setForeground] = useState(!document.hidden);
  const [reducedMotion, setReducedMotion] = useState(() => matchMedia('(prefers-reduced-motion: reduce)').matches);
  const hiddenAt = useRef<number | null>(document.hidden ? Date.now() : null);
  const activeRef = useRef(active);
  const skip = useRef<HTMLButtonElement>(null);
  activeRef.current = active;
  const dismiss = useCallback(() => setLeaving(true), []);
  const handleReady = useCallback(() => setReady(true), []);

  useEffect(() => {
    const motion = matchMedia('(prefers-reduced-motion: reduce)');
    const updateMotion = () => setReducedMotion(motion.matches);
    motion.addEventListener('change', updateMotion);
    const hide = () => {
      hiddenAt.current ??= Date.now();
      setForeground(false);
    };
    const show = () => {
      if (document.hidden) return;
      const since = hiddenAt.current;
      hiddenAt.current = null;
      setForeground(true);
      if (since !== null && (activeRef.current || Date.now() - since >= RETURN_AFTER_MS)) {
        setReady(false);
        setLeaving(false);
        setLaunch(value => value + 1);
        setActive(true);
      }
    };
    const visibility = () => document.hidden ? hide() : show();
    document.addEventListener('visibilitychange', visibility);
    window.addEventListener('pagehide', hide);
    window.addEventListener('pageshow', show);
    document.addEventListener('freeze', hide);
    document.addEventListener('resume', show);
    return () => {
      motion.removeEventListener('change', updateMotion);
      document.removeEventListener('visibilitychange', visibility);
      window.removeEventListener('pagehide', hide);
      window.removeEventListener('pageshow', show);
      document.removeEventListener('freeze', hide);
      document.removeEventListener('resume', show);
    };
  }, []);

  useEffect(() => {
    if (!active || !foreground || leaving) return;
    // Bound the wait even if image loading, the GPU or the dynamic import fails.
    const timer = window.setTimeout(dismiss, reducedMotion ? 350 : ready ? 2200 : 5000);
    return () => clearTimeout(timer);
  }, [active, foreground, leaving, ready, reducedMotion, launch, dismiss]);

  useEffect(() => {
    if (!leaving) return;
    const timer = window.setTimeout(() => setActive(false), reducedMotion ? 100 : 360);
    return () => clearTimeout(timer);
  }, [leaving, reducedMotion]);

  useEffect(() => {
    if (!active) return;
    const overflow = document.body.style.overflow;
    const previousFocus = document.activeElement;
    document.body.style.overflow = 'hidden';
    skip.current?.focus({ preventScroll: true });
    return () => {
      document.body.style.overflow = overflow;
      if (previousFocus instanceof HTMLElement && previousFocus.isConnected) previousFocus.focus({ preventScroll: true });
    };
  }, [active]);

  return (
    <>
      <div aria-hidden={active || undefined} {...(active ? { inert: '' } : {})}>{children}</div>
      {active && (
        <div className={`launch-splash${leaving ? ' launch-splash--leaving' : ''}`} role="dialog" aria-modal="true" aria-label="Welcome to A&D MAX" onKeyDown={event => { if (event.key === 'Escape') dismiss(); }}>
          <div className="launch-splash__art" aria-hidden="true">
            <img className="launch-splash__still" src={LOGO} alt="" width="2172" height="724" />
            {!reducedMotion && foreground && (
              <AnimationFallback key={launch}><Suspense fallback={null}>
                <LiquidGlassLogo key={launch} logo={LOGO} ending="logo" theme="dark" background="#000000" tileColor="#161616" logoColor="original" logoSize={560} logoScale={0.88} finalLogoScale={1} depth={2.9} maxDpr={1.5} loop={false} onReady={handleReady} />
              </Suspense></AnimationFallback>
            )}
          </div>
          <button ref={skip} className="launch-splash__skip" onClick={dismiss}>Skip intro<span aria-hidden="true"> ↗</span></button>
        </div>
      )}
    </>
  );
}
