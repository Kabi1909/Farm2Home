import { readStore, writeStore } from '../utils/helpers';
export const cartService = {
  get: (userId) => readStore('cart', {})[userId] || [],
  save: (userId, items) => writeStore('cart', { ...readStore('cart', {}), [userId]: items }),
};
