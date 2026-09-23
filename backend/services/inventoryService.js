export function inventoryStatus(quantity, isPreOrder, lowStockThreshold = 5) {
  if (quantity === 0) return "Sold Out";
  if (isPreOrder) return "Upcoming Harvest";
  return quantity <= lowStockThreshold ? "Low Stock" : "Available";
}
