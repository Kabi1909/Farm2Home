// Normalized composition anchors keep the flight tied to the responsive scene.
export function heroComposition(width, height) {
  const mobile = width < 640;
  const tablet = width < 1000;
  return {
    start: { x: -0.18, y: mobile ? 0.56 : 0.23 },
    control: { x: mobile ? 0.12 : 0.13, y: mobile ? 0.48 : 0.14 },
    landing: { x: mobile ? 0.25 : 0.29, y: mobile ? 0.88 : 0.78 },
    radius: Math.min(width * (mobile ? 0.085 : tablet ? 0.065 : 0.06), height * 0.105),
    leaves: mobile ? 3 : tablet ? 5 : 6,
  };
}
export function arcPoint(start, control, end, progress) {
  const remaining = 1 - progress;
  return {
    x:
      remaining * remaining * start.x +
      2 * remaining * progress * control.x +
      progress * progress * end.x,
    y:
      remaining * remaining * start.y +
      2 * remaining * progress * control.y +
      progress * progress * end.y,
  };
}

export function shouldPlayHero(storage, reducedMotion) {
  if (reducedMotion) return false;
  try {
    return storage.getItem('farm2homeHeroPlayed') !== 'true';
  } catch {
    return false;
  }
}
