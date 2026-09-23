import { api } from './api.js';

// These adapters return server DTOs. Existing mock repositories stay available
// while individual screens migrate to asynchronous, server-owned state.
export function createMarketplaceApi(client = api, tokenStore = globalThis.sessionStorage) {
  const data = async (request) => (await request).data.data;
  const page = async (request) => (await request).data;
  const resource = (path) => ({
    list: (params) => page(client.get(path, { params })),
    get: (id) => data(client.get(`${path}/${encodeURIComponent(id)}`)),
    create: (values) => data(client.post(path, values)),
    update: (id, values) => data(client.put(`${path}/${encodeURIComponent(id)}`, values)),
    remove: (id) => data(client.delete(`${path}/${encodeURIComponent(id)}`)),
  });
  return {
    auth: {
      async login(email, password) {
        const result = await data(client.post('/auth/login', { email, password }));
        tokenStore?.setItem('f2h:token', result.token);
        return result.user;
      },
      register: (values) => data(client.post('/auth/register', values)),
      me: () => data(client.get('/auth/me')),
      async logout() {
        // Keep the token if revocation fails so the caller can retry.
        await client.post('/auth/logout');
        tokenStore?.removeItem('f2h:token');
      },
    },
    products: resource('/products'),
    farmers: {
      list: (params) => page(client.get('/farmers', { params })),
      get: (userId) => data(client.get(`/farmers/${encodeURIComponent(userId)}`)),
    },
    farmer: {
      profile: () => data(client.get('/farmer/profile')),
      updateProfile: (values) => data(client.put('/farmer/profile', values)),
      products: (params) => page(client.get('/farmer/products', { params })),
      orders: (params) => page(client.get('/farmer/orders', { params })),
      reviews: (params) => page(client.get('/farmer/reviews', { params })),
      analytics: () => data(client.get('/farmer/analytics')),
    },
    customer: {
      profile: () => data(client.get('/customer/profile')),
      updateProfile: (values) => data(client.put('/customer/profile', values)),
      addAddress: (values) => data(client.post('/customer/addresses', values)),
      updateAddress: (id, values) =>
        data(client.put(`/customer/addresses/${encodeURIComponent(id)}`, values)),
      removeAddress: (id) => data(client.delete(`/customer/addresses/${encodeURIComponent(id)}`)),
    },
    cart: {
      get: () => data(client.get('/cart')),
      add: (productId, quantity) => data(client.post('/cart', { productId, quantity })),
      update: (itemId, quantity) =>
        data(client.put(`/cart/${encodeURIComponent(itemId)}`, { quantity })),
      remove: (itemId) => data(client.delete(`/cart/${encodeURIComponent(itemId)}`)),
      clear: () => data(client.delete('/cart')),
    },
    wishlist: {
      get: () => data(client.get('/wishlist')),
      add: (productId) => data(client.post(`/wishlist/${encodeURIComponent(productId)}`)),
      remove: (productId) => data(client.delete(`/wishlist/${encodeURIComponent(productId)}`)),
    },
    orders: {
      list: (params) => page(client.get('/orders/my', { params })),
      get: (id) => data(client.get(`/orders/${encodeURIComponent(id)}`)),
      // Keep one key per checkout attempt and reuse it when retrying a timeout.
      create: (values, idempotencyKey) => {
        if (!idempotencyKey) throw new Error('A checkout retry key is required.');
        return data(
          client.post('/orders', values, { headers: { 'Idempotency-Key': idempotencyKey } }),
        );
      },
      cancel: (id) => data(client.put(`/orders/${encodeURIComponent(id)}/cancel`)),
      updateStatus: (id, status) =>
        data(client.put(`/orders/${encodeURIComponent(id)}/status`, { status })),
    },
    reviews: {
      create: (values) => data(client.post('/reviews', values)),
      product: (id, params) =>
        page(client.get(`/reviews/product/${encodeURIComponent(id)}`, { params })),
      farmer: (id, params) =>
        page(client.get(`/reviews/farmer/${encodeURIComponent(id)}`, { params })),
    },
    notifications: {
      list: (params) => page(client.get('/notifications', { params })),
      read: (id) => data(client.put(`/notifications/${encodeURIComponent(id)}/read`)),
      readAll: () => data(client.put('/notifications/read-all')),
    },
    prices: {
      recent: (params) => page(client.get('/prices/recent', { params })),
      trends: (params) => page(client.get('/prices/trends', { params })),
    },
    suggestPrice: (values, signal) => data(client.post('/ai/price-suggestion', values, { signal })),
    upload: (files, kind = 'product') => {
      const form = new FormData();
      Array.from(files).forEach((file) => form.append('images', file));
      return data(client.post(`/uploads/${kind}`, form));
    },
  };
}

export const marketplaceApi = createMarketplaceApi();
