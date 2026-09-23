import ApiError from "../utils/ApiError.js";
export const roundMoney = (value) =>
  Math.round((value + Number.EPSILON) * 100) / 100;
export function calculateLine(product, quantity) {
  if (!Number.isInteger(quantity) || quantity < 1)
    throw new ApiError(400, "Quantity must be a positive whole number.");
  if (
    !product ||
    !product.isActive ||
    product.isDeleted ||
    product.availabilityStatus === "Sold Out" ||
    product.quantity < quantity
  )
    throw new ApiError(409, "Product is unavailable or stock is insufficient.");
  if (
    product.isPreOrder &&
    (!product.availableDate ||
      new Date(product.availableDate) < new Date(product.harvestDate))
  )
    throw new ApiError(409, "Pre-order dates are invalid.");
  const isBulkPrice =
    product.bulkPrice > 0 && quantity >= product.minimumBulkQuantity;
  const unitPrice = isBulkPrice ? product.bulkPrice : product.price;
  return {
    quantity,
    unitPrice,
    isBulkPrice,
    lineTotal: roundMoney(unitPrice * quantity),
  };
}
