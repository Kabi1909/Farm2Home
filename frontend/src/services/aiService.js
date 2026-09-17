import { delay } from './api.js';
export async function getPriceSuggestion(data) {
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
// Future adapter: return (await api.post('/ai/price-suggestion', data)).data;
