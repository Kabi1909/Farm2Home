export const recordId = (value) => String(value?._id || value?.id || value || '');
const date = (value) => (value ? String(value).slice(0, 10) : '');
export function productView(value) {
  return {
    ...value,
    id: recordId(value),
    farmerId: recordId(value.farmer),
    images: (value.images || []).map((image) => image.url),
    _assets: value.images || [],
    method: value.farmingMethod,
    rating: value.averageRating || 0,
    popularity: value.orderCount || 0,
    bulkThreshold: value.minimumBulkQuantity,
    enabled: value.isActive,
    draft: false,
    availability: value.availabilityStatus,
    delivery: value.deliveryAvailable,
    pickup: value.pickupAvailable,
    pickupNotes: value.pickupInstructions || '',
    harvestDate: date(value.harvestDate),
    availableDate: date(value.availableDate),
    expiryDate: date(value.freshnessDate),
    lat: value.location?.isPublic ? value.location.latitude : undefined,
    lng: value.location?.isPublic ? value.location.longitude : undefined,
  };
}
export function farmerView(profile) {
  const user = typeof profile.user === 'object' ? profile.user : {};
  return {
    id: recordId(profile.user),
    name: user.name || profile.farmName || 'Farmer',
    image: user.profileImage?.url || '',
    farm: profile.farmName || '',
    district: profile.district || '',
    city: profile.city || '',
    description: profile.description || '',
    crops: (profile.mainCrops || []).join(', '),
    method: profile.farmingMethods?.[0] || '',
    size: profile.farmSize,
    experience: profile.yearsExperience,
    rating: profile.averageRating || 0,
    completed: profile.completedOrders || 0,
    delivery: profile.deliveryAvailable,
    pickup: profile.pickupAvailable,
    lat: profile.publicLocation ? profile.latitude : undefined,
    lng: profile.publicLocation ? profile.longitude : undefined,
  };
}
export function userView(user, profile) {
  const address = profile.addresses?.find((value) => value.isDefault) || profile.addresses?.[0];
  return {
    ...user,
    ...(user.role === 'farmer' ? farmerView({ ...profile, user }) : {}),
    id: recordId(user),
    image: user.profileImage?.url || '',
    district: profile.district || address?.district || '',
    city: profile.city || address?.city || '',
    address: address?.addressLine || '',
    addressId: recordId(address),
    preferences: (profile.preferredProducts || []).join(', '),
  };
}
export function orderView(value) {
  const productNames = [...new Set(value.items.map((item) => item.productName).filter(Boolean))];
  const displayName = productNames.length
    ? productNames[0] + (productNames.length > 1 ? ` + ${productNames.length - 1} more` : '')
    : 'Farm order';
  return {
    ...value,
    id: recordId(value),
    displayName,
    customerId: recordId(value.customer),
    farmerId: recordId(value.farmer),
    customer: value.deliveryAddress?.recipientName || value.customer?.name || 'Customer',
    phone: value.deliveryAddress?.phone || value.customer?.phone || '',
    address: value.deliveryAddress?.addressLine || '',
    deliveryFee: value.deliveryCharge,
    fulfillment: value.fulfillmentMethod,
    payment: value.paymentMethod === 'cash_on_delivery' ? 'Cash on Delivery' : 'Pay on Pickup',
    date: date(value.createdAt),
    estimatedDate: value.items.some((item) => item.isPreOrder)
      ? value.items.reduce(
          (latest, item) => (date(item.availableDate) > latest ? date(item.availableDate) : latest),
          '',
        )
      : 'To be confirmed by the farmer',
    items: value.items.map((item) => ({
      ...item,
      productId: recordId(item.product),
      name: item.productName,
      image: item.productImage,
      price: item.unitPrice,
      preorder: item.isPreOrder,
      availableDate: date(item.availableDate),
    })),
  };
}
export const reviewView = (value) => ({
  ...value,
  id: recordId(value),
  productId: recordId(value.product),
  farmerId: recordId(value.farmer),
  customerId: recordId(value.customer),
  orderId: recordId(value.order),
  customer: value.customerName || value.customer?.name || 'Customer',
  date: date(value.createdAt),
});
export const notificationView = (value, role) => ({
  ...value,
  id: recordId(value),
  read: value.isRead,
  date: date(value.createdAt),
  path: value.relatedOrder
    ? `/${role}/orders/${recordId(value.relatedOrder)}`
    : value.relatedProduct
      ? role === 'farmer'
        ? `/farmer/products/${recordId(value.relatedProduct)}/edit`
        : `/products/${recordId(value.relatedProduct)}`
      : `/${role}/dashboard`,
});
export async function allPages(fetchPage, params = {}) {
  const results = [];
  for (let page = 1; ; page += 1) {
    const response = await fetchPage({ ...params, page, limit: 100 });
    results.push(...response.data);
    if (!response.pagination?.hasNextPage) return results;
  }
}
export async function productPayload(product, client) {
  const images = [];
  for (const source of product.images || []) {
    const asset = product._assets?.find((entry) => entry.url === source);
    if (asset) images.push({ publicId: asset.publicId });
    else if (source.startsWith('data:image/')) {
      const blob = await (await fetch(source)).blob();
      const [uploaded] = await client.upload([
        new File([blob], 'produce.jpg', { type: blob.type }),
      ]);
      images.push({ publicId: uploaded.publicId });
    } else throw new Error('Please upload the product image again.');
  }
  return {
    name: product.name,
    category: product.category,
    description: product.description,
    farmingMethod: product.method,
    quality: product.quality,
    harvestDate: product.harvestDate,
    availableDate: product.availableDate,
    ...(product.expiryDate && { freshnessDate: product.expiryDate }),
    quantity: Number(product.quantity),
    unit: product.unit,
    price: Number(product.price),
    bulkPrice: Number(product.bulkPrice) || 0,
    minimumBulkQuantity: Number(product.bulkThreshold) || 20,
    district: product.district,
    city: product.city,
    deliveryAvailable: product.delivery,
    pickupAvailable: product.pickup,
    deliveryNotes: product.deliveryNotes || '',
    pickupInstructions: product.pickupNotes || '',
    availabilityStatus: product.availability,
    isPreOrder: product.availability === 'Upcoming Harvest',
    isActive: product.enabled !== false,
    images,
  };
}
