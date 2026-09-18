// Validate against current product and basket state before any visual feedback.
export function cartAdditionError(product, quantity, existing = 0) {
  if (
    !product ||
    !product.enabled ||
    product.draft ||
    product.availability === 'Sold Out' ||
    product.quantity <= 0
  ) {
    return 'This product is currently unavailable.';
  }
  if (!Number.isInteger(quantity) || quantity < 1) return 'Choose a positive whole quantity.';
  if (existing + quantity > product.quantity)
    return `Only ${Math.max(0, product.quantity - existing)} ${product.unit} available.`;
  return null;
}
