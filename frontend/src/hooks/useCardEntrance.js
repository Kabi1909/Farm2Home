import { useEffect } from 'react';

const cards = [
  '.stat-card',
  '.panel',
  '.product-card',
  '.review-card',
  '.empty-state',
  '.notice',
  '.ai-advisor',
  '.sidebar-bottom > div',
  '.category-card',
  '.farmer-card',
  '.section-heading',
  '.page-heading',
  '.category-heading',
  '.farm-profile-header',
  '.product-detail',
  '.auth-form',
  '.directory-filters',
  '.reference-benefits .container > div',
  '.how-grid > div',
  '.testimonial-grid > article',
  '.reference-prices > div',
  '.season-popular',
  '.reference-cta',
  '.banner-copy',
  '.support-card',
  '.shop-promo',
  '.contact-quote',
  '.reference-prices > a',
].join(', ');

// Animate each mounted card once. Content stays visible without browser support.
export default function useCardEntrance(rootRef, route) {
  useEffect(() => {
    const root = rootRef.current;
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (!root || motion.matches || !window.IntersectionObserver) return;

    const seen = new WeakSet();
    const pending = new Set();
    const observer = new IntersectionObserver(
      (entries) => {
        let stagger = 0;
        entries.forEach(({ target, isIntersecting }) => {
          if (!isIntersecting) return;
          observer.unobserve(target);
          pending.delete(target);
          if (!root.contains(target) || target.contains(document.activeElement)) return;
          target.style.setProperty('--card-delay', `${Math.min(stagger++, 4) * 80}ms`);
          target.classList.add('page-element-enter');
        });
      },
      { threshold: 0.04 },
    );

    function discover() {
      pending.forEach((card) => {
        if (!root.contains(card)) {
          observer.unobserve(card);
          pending.delete(card);
        }
      });
      root.querySelectorAll(cards).forEach((card) => {
        if (seen.has(card) || card.closest('.cinematic-hero')) return;
        seen.add(card);
        pending.add(card);
        observer.observe(card);
      });
    }

    function finish(event) {
      if (event.animationName !== 'page-element-arrive') return;
      event.target.classList.remove('page-element-enter');
      event.target.style.removeProperty('--card-delay');
    }

    const changes = new MutationObserver((records) => {
      // Chart text and SVG updates do not need another full card scan.
      const cardsChanged = records.some((record) =>
        [...record.addedNodes, ...record.removedNodes].some(
          (node) => node.nodeType === 1 && (node.matches(cards) || node.querySelector(cards)),
        ),
      );
      if (cardsChanged) discover();
    });
    discover();
    // Includes cards loaded by route Suspense, pagination and filters.
    changes.observe(root, { childList: true, subtree: true });
    root.addEventListener('animationend', finish);

    function cleanup() {
      observer.disconnect();
      changes.disconnect();
      pending.clear();
      root.removeEventListener('animationend', finish);
      root.querySelectorAll('.page-element-enter').forEach((card) => {
        card.classList.remove('page-element-enter');
        card.style.removeProperty('--card-delay');
      });
    }

    const preferenceChanged = () => {
      if (motion.matches) cleanup();
    };
    motion.addEventListener('change', preferenceChanged);
    return () => {
      cleanup();
      motion.removeEventListener('change', preferenceChanged);
    };
  }, [rootRef, route]);
}
