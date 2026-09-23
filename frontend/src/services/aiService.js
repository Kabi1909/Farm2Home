import { marketplaceApi } from './marketplaceApi.js';
export async function getPriceSuggestion(data, { signal } = {}) {
  return marketplaceApi.suggestPrice(
    {
      product: data.name.trim(),
      category: data.category,
      district: data.district,
      quality: data.quality,
      quantity: Number(data.quantity),
      unit: data.unit,
      harvestDate: data.harvestDate,
      month: Number(data.harvestDate?.slice(5, 7)),
    },
    signal,
  );
}
