import { delay } from './api.js';
import { marketplaceApi } from './marketplaceApi.js';

export const usesPriceApi = import.meta.env?.VITE_PRICE_ADVISOR_MODE === 'api';

export async function getPriceSuggestion(data, { signal } = {}) {
  if (usesPriceApi) {
    if (!globalThis.sessionStorage?.getItem('f2h:token')) {
      throw new Error(
        'A backend farmer session is required for live estimates. You can still enter your own price.',
      );
    }
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
  await delay(1400);
  if (data.simulateError) throw new Error('Price suggestion is temporarily unavailable.');
  const base = /tomato/i.test(data.name)
    ? 340
    : /carrot/i.test(data.name)
      ? 420
      : /potato/i.test(data.name)
        ? 300
        : 280;
  const recommendedPrice = data.quality === 'Premium' ? Math.round(base * 1.1) : base;
  return {
    recommendedPrice,
    minimumPrice: recommendedPrice - 20,
    maximumPrice: recommendedPrice + 20,
    confidence: 'High',
  };
}
