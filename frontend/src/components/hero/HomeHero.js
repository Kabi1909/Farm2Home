import { Component, lazy, Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import HeroContent from './HeroContent';
import { shouldPlayHero } from './heroMotion';
import './hero.css';

const Hero3DScene = lazy(() => import('./Hero3DScene'));
const SESSION_KEY = 'farm2homeHeroPlayed';

class SceneBoundary extends Component {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch() {
    this.props.onFailure();
  }
  render() {
    return this.state.failed ? null : this.props.children;
  }
}

export default function HomeHero() {
  const content = useRef(null);
  const reveal = useRef(null);
  const ready = useRef(false);
  const [failed, setFailed] = useState(false);
  const [settled, setSettled] = useState(false);
  const [skip, setSkip] = useState(() => {
    try {
      return !shouldPlayHero(
        sessionStorage,
        window.matchMedia('(prefers-reduced-motion: reduce)').matches,
      );
    } catch {
      return true;
    }
  });
  const showContent = useCallback(() => {
    reveal.current?.kill();
    if (content.current)
      gsap.set(content.current.querySelectorAll('[data-hero-reveal]'), {
        clearProps: 'opacity,transform,filter',
      });
  }, []);
  const stop = useCallback(() => {
    setSkip(true);
    showContent();
  }, [showContent]);
  const onFailure = useCallback(() => {
    setFailed(true);
    showContent();
  }, [showContent]);
  const onReady = useCallback(
    (animate) => {
      ready.current = true;
      if (skip || !animate) return;
      try {
        sessionStorage.setItem(SESSION_KEY, 'true');
      } catch {
        /* Storage may be disabled. */
      }
      const elements = content.current?.querySelectorAll('[data-hero-reveal]');
      if (!elements) return;
      reveal.current?.kill();
      reveal.current = gsap.timeline();
      reveal.current.set(elements, { opacity: 0, y: 20, filter: 'blur(3px)' });
      reveal.current.to(
        elements,
        {
          opacity: 1,
          y: 0,
          filter: 'blur(0px)',
          duration: 0.7,
          stagger: 0.12,
          ease: 'power2.out',
          clearProps: 'opacity,transform,filter',
        },
        1.9,
      );
    },
    [skip],
  );
  useEffect(() => {
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const change = () => {
      if (motion.matches) stop();
    };
    const hide = () => {
      if (document.hidden) stop();
    };
    motion.addEventListener('change', change);
    document.addEventListener('visibilitychange', hide);
    const timeout = window.setTimeout(() => {
      if (!ready.current) onFailure();
    }, 8000);
    return () => {
      window.clearTimeout(timeout);
      motion.removeEventListener('change', change);
      document.removeEventListener('visibilitychange', hide);
      reveal.current?.kill();
    };
  }, [stop, onFailure]);
  return (
    <section
      className="cinematic-hero"
      aria-label="Fresh from Sri Lankan farms"
      data-intro={failed ? 'fallback' : skip || settled ? 'settled' : 'intro'}
    >
      <div className="cinematic-hero-light" />
      <div className="cinematic-hero-scene" aria-hidden="true">
        {!failed && (
          <SceneBoundary onFailure={onFailure}>
            <Suspense fallback={null}>
              <Hero3DScene
                play={!skip}
                onReady={onReady}
                onFailure={onFailure}
                onSettled={() => setSettled(true)}
              />
            </Suspense>
          </SceneBoundary>
        )}
      </div>
      <div ref={content} onFocusCapture={stop} className="cinematic-hero-html">
        <HeroContent />
      </div>
    </section>
  );
}
