export const money = (value) =>
  'Rs. ' + Number(value || 0).toLocaleString('en-LK', { maximumFractionDigits: 2 });
export const unitPrice = (product, quantity) =>
  product.bulkPrice > 0 && product.bulkThreshold > 0 && quantity >= product.bulkThreshold
    ? Number(product.bulkPrice)
    : Number(product.price);
export const validPhone = (value) => /^(?:\+94|0)\d{9}$/.test(String(value).replace(/[\s-]/g, ''));
export const filterProducts = (products, query, farmers = []) =>
  products
    .filter((p) => {
      const get = (k) => query.get(k) || '';
      const farmer = farmers.find((f) => f.id === p.farmerId);
      return (
        p.enabled !== false &&
        !p.draft &&
        (!get('search') ||
          [p.name, p.district, p.city, farmer?.name, farmer?.farm]
            .join(' ')
            .toLowerCase()
            .includes(get('search').toLowerCase())) &&
        ['category', 'district', 'city', 'method', 'quality', 'availability'].every(
          (k) => !get(k) || p[k] === get(k),
        ) &&
        (!get('min') || p.price >= Number(get('min'))) &&
        (!get('max') || p.price <= Number(get('max'))) &&
        (!get('rating') || p.rating >= Number(get('rating'))) &&
        (!get('delivery') || p.delivery) &&
        (!get('pickup') || p.pickup)
      );
    })
    .sort((a, b) => {
      switch (query.get('sort')) {
        case 'price-asc':
          return a.price - b.price;
        case 'price-desc':
          return b.price - a.price;
        case 'rating':
          return b.rating - a.rating;
        case 'popular':
          return b.popularity - a.popularity;
        default:
          return new Date(b.createdAt) - new Date(a.createdAt);
      }
    });
