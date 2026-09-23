import { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { marketplaceApi as client } from '../services/marketplaceApi.js';
import {
  allPages,
  productView,
  farmerView,
  userView,
  orderView,
  reviewView,
  notificationView,
  productPayload,
} from '../services/adapters.js';
export const AuthContext = createContext();
const ProductContext = createContext();
export const CartContext = createContext();
export const WishlistContext = createContext();
export const NotificationContext = createContext();
const UIContext = createContext();
export const useAuth = () => useContext(AuthContext);
export const useMarket = () => useContext(ProductContext);
export const useCart = () => useContext(CartContext);
export const useWishlist = () => useContext(WishlistContext);
export const useNotifications = () => useContext(NotificationContext);
export const useUI = () => useContext(UIContext);
const merge = (...lists) => [...new Map(lists.flat().map((value) => [value.id, value])).values()];
const empty = {
  products: [],
  farmers: [],
  orders: [],
  reviews: [],
  cart: [],
  wishlist: [],
  notifications: [],
  prices: [],
  deliveryCharge: 0,
};
function removeLegacyRecords() {
  for (const storage of [localStorage, sessionStorage]) {
    for (const key of [
      'accounts',
      'user',
      'products',
      'farmers',
      'orders',
      'reviews',
      'cart',
      'wishlist',
      'notifications',
      'recent',
      'resetEmail',
      'lastOrders',
      'newsletter',
      'contactDraft',
    ])
      storage.removeItem(`f2h:${key}`);
  }
}
export function Providers({ children }) {
  const [user, setUser] = useState(null),
    [state, setState] = useState(empty);
  const [loading, setLoading] = useState(true),
    [error, setError] = useState('');
  const [toast, setToast] = useState(null),
    [recent, setRecent] = useState([]);
  const version = useRef(0),
    account = useRef(null),
    cartQueue = useRef(Promise.resolve()),
    checkoutAttempt = useRef(null);
  const notify = useCallback(
    (message, type = 'success') => setToast({ message, type, key: Date.now() }),
    [],
  );
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [toast]);
  const refresh = useCallback(async (identity = account.current) => {
    const request = ++version.current;
    const [products, farmers, reviews, prices] = await Promise.all([
      allPages(client.products.list),
      allPages(client.farmers.list),
      allPages(client.reviews.list),
      allPages(client.prices.recent),
    ]);
    const next = {
      ...empty,
      products: products.map(productView),
      farmers: farmers.map(farmerView),
      reviews: reviews.map(reviewView),
      prices,
    };
    let currentUser = null;
    if (identity) {
      currentUser = userView(identity, await client[identity.role].profile());
      const [orders, notices] = await Promise.all([
        allPages(identity.role === 'farmer' ? client.farmer.orders : client.orders.list),
        allPages(client.notifications.list),
      ]);
      next.orders = orders.map(orderView);
      next.notifications = notices.map((value) => notificationView(value, identity.role));
      if (identity.role === 'farmer')
        next.products = merge(
          next.products,
          (await allPages(client.farmer.products)).map(productView),
        );
      else {
        const [basket, saved, ownReviews] = await Promise.all([
          client.cart.get(),
          client.wishlist.get(),
          allPages(client.reviews.mine),
        ]);
        next.cart = basket.items.map((item) => ({ ...item, productId: item.productId || item.id }));
        next.deliveryCharge = basket.deliveryCharge;
        next.wishlist = saved.map((item) => item.id);
        next.products = merge(next.products, saved.map(productView));
        next.reviews = merge(next.reviews, ownReviews.map(reviewView));
      }
    }
    if (request !== version.current) return;
    account.current = identity;
    setUser(currentUser);
    setState(next);
  }, []);
  const initialize = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      let identity = null;
      if (sessionStorage.getItem('f2h:token')) {
        try {
          identity = await client.auth.me();
        } catch (failure) {
          if (failure.status === 401) sessionStorage.removeItem('f2h:token');
          else throw failure;
        }
      }
      await refresh(identity);
    } catch (failure) {
      setError(failure.message);
    } finally {
      setLoading(false);
    }
  }, [refresh]);
  useEffect(() => {
    removeLegacyRecords();
    void initialize();
    return () => {
      version.current += 1;
    };
  }, [initialize]);
  async function signIn(identity) {
    await refresh(identity);
  }
  async function logout() {
    try {
      await client.auth.logout();
    } catch (failure) {
      notify(failure.message, 'error');
    } finally {
      version.current += 1;
      account.current = null;
      sessionStorage.removeItem('f2h:token');
      sessionStorage.removeItem('f2h:checkoutResult');
      setUser(null);
      setState(empty);
      setRecent([]);
      await initialize();
    }
  }
  async function updateProfile(form) {
    if (user.image && !form.image)
      throw new Error('Please choose a replacement profile image before saving.');
    if (form.image?.startsWith('data:image/')) {
      const blob = await (await fetch(form.image)).blob();
      await client.upload([new File([blob], 'profile.jpg', { type: blob.type })], 'profile');
    }
    const fields = {
      name: form.name,
      phone: form.phone.replaceAll(' ', ''),
      district: form.district,
      city: form.city,
    };
    if (user.role === 'farmer')
      Object.assign(fields, {
        farmName: form.farm,
        description: form.description || undefined,
        farmSize: Number(form.size) || 0,
        yearsExperience: Number(form.experience) || 0,
        mainCrops: (form.crops || '')
          .split(',')
          .map((v) => v.trim())
          .filter(Boolean),
        farmingMethods: form.method ? [form.method] : [],
        deliveryAvailable: !!form.delivery,
        pickupAvailable: !!form.pickup,
      });
    else {
      fields.preferredProducts = (form.preferences || '')
        .split(',')
        .map((v) => v.trim())
        .filter(Boolean);
      if (form.address) {
        const address = {
          recipientName: form.name,
          phone: fields.phone,
          addressLine: form.address,
          district: form.district,
          city: form.city,
          isDefault: true,
        };
        if (user.addressId) await client.customer.updateAddress(user.addressId, address);
        else await client.customer.addAddress(address);
      } else if (user.addressId) await client.customer.removeAddress(user.addressId);
    }
    await client[user.role].updateProfile(fields);
    await refresh(await client.auth.me());
    notify('Profile saved.');
  }
  function customerAction(action) {
    if (account.current?.role !== 'customer') {
      notify('Please sign in as a customer to shop.', 'error');
      return Promise.resolve(false);
    }
    const identity = account.current;
    cartQueue.current = cartQueue.current
      .catch(() => {})
      .then(async () => {
        if (identity !== account.current) return false;
        try {
          const result = await action();
          if (identity !== account.current) return false;
          setState((current) =>
            Array.isArray(result)
              ? {
                  ...current,
                  wishlist: result.map((item) => item.id),
                  products: merge(current.products, result.map(productView)),
                }
              : {
                  ...current,
                  cart: result.items.map((item) => ({
                    ...item,
                    productId: item.productId || item.id,
                  })),
                },
          );
          return true;
        } catch (failure) {
          notify(failure.message, 'error');
          return false;
        }
      });
    return cartQueue.current;
  }
  async function addToCart(product, quantity = 1, { silentSuccess = false } = {}) {
    const added = await customerAction(() => client.cart.add(product.id, quantity));
    if (added && !silentSuccess) notify(`${product.name} added to cart`);
    return added;
  }
  const basketItem = (productId) => state.cart.find((item) => item.productId === productId);
  const updateQuantity = (productId, quantity) =>
    customerAction(() => client.cart.update(basketItem(productId)?.id, quantity));
  const removeFromCart = (productId) =>
    customerAction(() => client.cart.remove(basketItem(productId)?.id));
  const toggleWish = (productId) =>
    customerAction(async () => {
      const saved = await client.wishlist.get();
      return saved.some((item) => item.id === productId)
        ? client.wishlist.remove(productId)
        : client.wishlist.add(productId);
    });
  async function placeOrder(form) {
    const input = {
      fulfillmentMethod: form.fulfillment,
      paymentMethod: form.fulfillment === 'delivery' ? 'cash_on_delivery' : 'pay_on_pickup',
      ...(form.fulfillment === 'delivery' && {
        deliveryAddress: {
          recipientName: form.name,
          phone: form.phone.replaceAll(' ', ''),
          addressLine: form.address,
          district: form.district,
          city: form.city,
        },
      }),
    };
    const signature = JSON.stringify(input);
    if (checkoutAttempt.current?.signature !== signature)
      checkoutAttempt.current = { signature, key: crypto.randomUUID() };
    const placed = await client.orders.create(input, checkoutAttempt.current.key);
    checkoutAttempt.current = null;
    sessionStorage.setItem('f2h:checkoutResult', JSON.stringify(placed.map((value) => value.id)));
    setState((current) => ({
      ...current,
      orders: merge(placed.map(orderView), current.orders),
      cart: [],
    }));
    await syncAfterWrite();
    return placed;
  }
  async function syncAfterWrite() {
    try {
      await refresh();
    } catch (failure) {
      notify('Your changes were saved. Reload to fetch the latest marketplace data.', 'error');
    }
  }
  async function changeStatus(id, status) {
    if (user.role === 'customer') await client.orders.cancel(id);
    else await client.orders.updateStatus(id, status);
    await syncAfterWrite();
    notify('Order updated.');
  }
  async function saveProduct(product) {
    const payload = await productPayload(product, client);
    const result = product.id
      ? await client.products.update(product.id, payload)
      : await client.products.create(payload);
    await syncAfterWrite();
    return productView(result);
  }
  async function removeProduct(id) {
    await client.products.remove(id);
    await syncAfterWrite();
  }
  async function submitReview(values) {
    await client.reviews.create(values);
    await syncAfterWrite();
  }
  async function markRead(id) {
    try {
      if (id === 'all') await client.notifications.readAll();
      else await client.notifications.read(id);
      await refresh();
    } catch (failure) {
      notify(failure.message, 'error');
    }
  }
  if (loading)
    return (
      <main className="container page" role="status">
        <span className="spinner" /> Loading marketplace…
      </main>
    );
  if (error)
    return (
      <main className="container page">
        <h1>Unable to load the marketplace</h1>
        <p role="alert">{error}</p>
        <button className="btn" onClick={initialize}>
          Try again
        </button>
      </main>
    );
  return (
    <UIContext.Provider value={{ notify, toast }}>
      <AuthContext.Provider value={{ user, signIn, logout, updateProfile, loading }}>
        <ProductContext.Provider
          value={{
            ...state,
            recent,
            setRecent,
            saveProduct,
            removeProduct,
            submitReview,
            placeOrder,
            changeStatus,
            refresh,
          }}
        >
          <CartContext.Provider
            value={{
              cart: state.cart,
              deliveryCharge: state.deliveryCharge,
              addToCart,
              updateQuantity,
              removeFromCart,
            }}
          >
            <WishlistContext.Provider value={{ wishlist: state.wishlist, toggleWish }}>
              <NotificationContext.Provider
                value={{ notifications: state.notifications, markRead }}
              >
                {children}
                {toast && (
                  <div className={'toast ' + toast.type} role="status">
                    {toast.message}
                  </div>
                )}
              </NotificationContext.Provider>
            </WishlistContext.Provider>
          </CartContext.Provider>
        </ProductContext.Provider>
      </AuthContext.Provider>
    </UIContext.Provider>
  );
}
