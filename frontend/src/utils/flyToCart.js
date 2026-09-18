import { gsap } from 'gsap';
import { flightPoint, isVisibleRect } from './cartFlightGeometry';

const pulses = new WeakMap();
function visible(element) {
  if (!element?.isConnected) return false;
  const style = getComputedStyle(element);
  return (
    style.visibility !== 'hidden' &&
    style.display !== 'none' &&
    Number(style.opacity) !== 0 &&
    isVisibleRect(element.getBoundingClientRect(), window.innerWidth, window.innerHeight)
  );
}
function pulseCart(target) {
  pulses.get(target)?.();
  const icon = target.querySelector('svg');
  const badge = target.querySelector('[data-cart-badge]');
  const elements = [icon, badge].filter(Boolean);
  let timeline;
  const cleanup = () => {
    timeline?.kill();
    if (pulses.get(target) === cleanup) {
      gsap.set(elements, { clearProps: 'transform' });
      pulses.delete(target);
    }
  };
  pulses.set(target, cleanup);
  timeline = gsap.timeline({ onComplete: cleanup });
  if (icon)
    timeline
      .to(icon, { scale: 1.18, duration: 0.12 })
      .to(icon, { scale: 0.94, duration: 0.1 })
      .to(icon, { scale: 1, duration: 0.13 });
  if (badge)
    timeline
      .fromTo(badge, { scale: 0.7 }, { scale: 1.25, duration: 0.16 }, 0)
      .to(badge, { scale: 1, duration: 0.19 }, 0.16);
  return cleanup;
}

// Decorative only: the caller has already updated CartContext successfully.
export function flyToCart(source, onArrival = () => {}, onDone = () => {}) {
  let clone, timeline, timeout, pulse;
  let active = true,
    announced = false;
  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const announce = () => {
    if (!announced) {
      announced = true;
      onArrival();
    }
  };
  const cleanup = () => {
    if (!active) return;
    active = false;
    timeline?.kill();
    window.clearTimeout(timeout);
    clone?.remove();
    pulse?.();
    window.removeEventListener('resize', cleanup);
    window.removeEventListener('scroll', cleanup, true);
    document.removeEventListener('visibilitychange', cleanup);
    motion.removeEventListener('change', cleanup);
    announce();
    onDone();
  };
  try {
    const target = [...document.querySelectorAll('[data-cart-target="navbar-cart"]')].find(visible);
    if (motion.matches || !visible(source) || !target) {
      cleanup();
      return {
        cancel: cleanup,
        get active() {
          return active;
        },
      };
    }
    const sourceRect = source.getBoundingClientRect(),
      targetRect = target.getBoundingClientRect();
    const mobile = window.innerWidth < 640;
    const size = mobile ? 60 : 80;
    const start = {
      x: Math.max(
        size / 2,
        Math.min(window.innerWidth - size / 2, sourceRect.left + sourceRect.width / 2),
      ),
      y: Math.max(
        size / 2,
        Math.min(window.innerHeight - size / 2, sourceRect.top + sourceRect.height / 2),
      ),
    };
    const end = {
      x: targetRect.left + targetRect.width / 2,
      y: targetRect.top + targetRect.height / 2,
    };
    clone = document.createElement('img');
    clone.src = source.currentSrc || source.src;
    clone.alt = '';
    clone.setAttribute('aria-hidden', 'true');
    clone.dataset.cartFlight = '';
    Object.assign(clone.style, {
      position: 'fixed',
      left: '0',
      top: '0',
      width: `${size}px`,
      height: `${size}px`,
      objectFit: 'cover',
      borderRadius: '16px',
      boxShadow: '0 6px 18px #214e2c35',
      pointerEvents: 'none',
      zIndex: '1500',
      willChange: 'transform,opacity',
    });
    document.body.appendChild(clone);
    gsap.set(clone, { x: start.x - size / 2, y: start.y - size / 2 });
    const lifted = { x: start.x, y: start.y - 18 };
    const progress = { value: 0 };
    timeline = gsap.timeline({ onComplete: cleanup });
    timeline.to(clone, { y: lifted.y - size / 2, scale: 0.95, duration: 0.12, ease: 'power1.out' });
    timeline.to(
      progress,
      {
        value: 1,
        duration: 0.58,
        ease: 'power2.inOut',
        onUpdate: () => {
          if (!visible(target) || !source.isConnected) {
            cleanup();
            return;
          }
          const point = flightPoint(lifted, end, progress.value, mobile);
          gsap.set(clone, {
            x: point.x - size / 2,
            y: Math.max(0, point.y - size / 2),
            scale: 0.95 - 0.7 * progress.value,
            opacity: progress.value < 0.7 ? 1 : (1 - progress.value) / 0.3,
          });
        },
      },
      0.12,
    );
    timeline.call(
      () => {
        clone.remove();
        pulse = pulseCart(target);
        announce();
      },
      [],
      0.7,
    );
    timeline.call(() => {}, [], 1.05);
    window.addEventListener('resize', cleanup);
    window.addEventListener('scroll', cleanup, { capture: true, passive: true });
    document.addEventListener('visibilitychange', cleanup);
    motion.addEventListener('change', cleanup);
    timeout = window.setTimeout(cleanup, 1400);
  } catch {
    cleanup();
  }
  return {
    cancel: cleanup,
    get active() {
      return active;
    },
  };
}
