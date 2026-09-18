export function flightPoint(start, end, progress, mobile = false) {
  const lift = Math.min(mobile ? 70 : 130, Math.max(35, Math.abs(end.y - start.y) * 0.3));
  const control = { x: start.x + (end.x - start.x) * 0.35, y: Math.min(start.y, end.y) - lift };
  const rest = 1 - progress;
  return {
    x: rest * rest * start.x + 2 * rest * progress * control.x + progress * progress * end.x,
    y: rest * rest * start.y + 2 * rest * progress * control.y + progress * progress * end.y,
  };
}
export function isVisibleRect(rect, width, height) {
  return (
    rect.width > 0 &&
    rect.height > 0 &&
    rect.bottom > 0 &&
    rect.right > 0 &&
    rect.top < height &&
    rect.left < width
  );
}
