import { createContext, useContext, useState, useEffect } from 'react';
import * as seed from '../data/seed';
import { readStore, writeStore, unitPrice } from '../utils/helpers';
import { updateAccount } from '../services/authService';
const AuthContext = createContext();
const ProductContext = createContext();
const CartContext = createContext();
const WishlistContext = createContext();
const NotificationContext = createContext();
const UIContext = createContext();
export { AuthContext, CartContext, WishlistContext, NotificationContext };
export const useAuth = () => useContext(AuthContext);
export const useMarket = () => useContext(ProductContext);
export const useCart = () => useContext(CartContext);
export const useWishlist = () => useContext(WishlistContext);
export const useNotifications = () => useContext(NotificationContext);
export const useUI = () => useContext(UIContext);
function usePersist(key, initial) {
  const [value, setValue] = useState(() => readStore(key, initial));
  useEffect(() => {
    try {
      writeStore(key, value);
    } catch {
      window.dispatchEvent(new CustomEvent('storage-error'));
    }
  }, [key, value]);
  return [value, setValue];
}
export function Providers({ children }) {
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(
        localStorage.getItem('f2h:user') || sessionStorage.getItem('f2h:user') || 'null',
      );
    } catch {
      return null;
    }
  });
  const [products, setProducts] = usePersist('products', seed.products),
    [farmers, setFarmers] = usePersist('farmers', seed.farmers),
    [orders, setOrders] = usePersist('orders', seed.orders),
    [reviews, setReviews] = usePersist('reviews', seed.reviews),
    [allCart, setAllCart] = usePersist('cart', {}),
    [allWish, setAllWish] = usePersist('wishlist', {}),
    [notifications, setNotifications] = usePersist('notifications', seed.notifications),
    [recent, setRecent] = usePersist('recent', []);
  const [toast, setToast] = useState(null);
  const notify = (message, type = 'success') => setToast({ message, type, key: Date.now() });
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [toast]);
  useEffect(() => {
    const handle = () =>
      notify('Browser storage is full. Remove some uploaded images to save changes.', 'error');
    window.addEventListener('storage-error', handle);
    return () => window.removeEventListener('storage-error', handle);
  }, []);
  const signIn = (account, remember) => {
    // Keep the visitor's basket and saved finds when they become a customer.
    if (!user && account.role === 'customer') {
      setAllCart((old) => {
        const merged = [...(old[account.id] || [])];
        for (const item of old.guest || []) {
          const product = products.find((p) => p.id === item.productId);
          if (!product || product.quantity < 1 || !product.enabled || product.draft) continue;
          const index = merged.findIndex((row) => row.productId === item.productId);
          const quantity = Math.min(
            product.quantity,
            item.quantity + (merged[index]?.quantity || 0),
          );
          if (index >= 0) merged[index] = { ...item, quantity };
          else merged.push({ ...item, quantity });
        }
        return { ...old, guest: [], [account.id]: merged };
      });
      setAllWish((old) => ({
        ...old,
        guest: [],
        [account.id]: [...new Set([...(old[account.id] || []), ...(old.guest || [])])],
      }));
    }
    localStorage.removeItem('f2h:user');
    sessionStorage.removeItem('f2h:user');
    (remember ? localStorage : sessionStorage).setItem('f2h:user', JSON.stringify(account));
    setUser(account);
  };
  const logout = () => {
    localStorage.removeItem('f2h:user');
    sessionStorage.removeItem('f2h:user');
    setUser(null);
    notify('You have signed out.');
  };
  const updateProfile = (changes) => {
    const updated = { ...user, ...changes };
    updateAccount(user.id, changes);
    signIn(updated, !!localStorage.getItem('f2h:user'));
    if (user.role === 'farmer')
      setFarmers((old) =>
        old.some((f) => f.id === user.id)
          ? old.map((f) => (f.id === user.id ? { ...f, ...changes } : f))
          : [...old, { ...updated, rating: 0, completed: 0, lat: 7.87, lng: 80.77 }],
      );
    notify('Profile saved.');
  };
  const owner = user?.id || 'guest';
  const cart = allCart[owner] || [];
  const setCart = (updater) =>
    setAllCart((old) => ({
      ...old,
      [owner]: typeof updater === 'function' ? updater(old[owner] || []) : updater,
    }));
  const wishlist = allWish[owner] || [];
  const addToCart = (p, quantity = 1) => {
    if (user?.role === 'farmer') {
      notify('Sign in as a customer to shop.', 'error');
      return false;
    }
    const existing = cart.find((c) => c.productId === p.id)?.quantity || 0;
    if (
      !Number.isInteger(quantity) ||
      quantity < 1 ||
      existing + quantity > p.quantity ||
      !p.enabled ||
      p.availability === 'Sold Out'
    ) {
      notify('Please choose a quantity within available stock.', 'error');
      return false;
    }
    setCart((old) =>
      old.some((c) => c.productId === p.id)
        ? old.map((c) => (c.productId === p.id ? { ...c, quantity: c.quantity + quantity } : c))
        : [...old, { productId: p.id, quantity }],
    );
    notify(
      p.availability === 'Upcoming Harvest'
        ? 'Pre-order added to your basket.'
        : 'Fresh pick added to your basket.',
    );
    return true;
  };
  const updateQuantity = (id, quantity) => {
    const p = products.find((p) => p.id === id);
    if (!p || !Number.isInteger(quantity) || quantity < 1 || quantity > p.quantity) {
      notify('Quantity must be a whole number within available stock.', 'error');
      return;
    }
    setCart((old) => old.map((c) => (c.productId === id ? { ...c, quantity } : c)));
  };
  const toggleWish = (id) => {
    setAllWish((old) => ({
      ...old,
      [owner]: (old[owner] || []).includes(id)
        ? old[owner].filter((x) => x !== id)
        : [...(old[owner] || []), id],
    }));
  };
  const addNotice = (userId, title, path) =>
    setNotifications((old) => [
      {
        id: crypto.randomUUID(),
        userId,
        title,
        message: 'Open to see the latest details.',
        path,
        read: false,
        date: new Date().toISOString().slice(0, 10),
      },
      ...old,
    ]);
  const placeOrder = (details) => {
    if (!user || user.role !== 'customer') throw new Error('Please sign in as a customer.');
    if (!cart.length) throw new Error('Your basket is empty.');
    const groups = {};
    for (const item of cart) {
      const p = products.find((p) => p.id === item.productId);
      if (
        !p ||
        p.draft ||
        !p.enabled ||
        p.quantity < item.quantity ||
        p.availability === 'Sold Out'
      )
        throw new Error('Some products are no longer available. Please update your basket.');
      if (!p[details.fulfillment])
        throw new Error(`${p.name} does not support this fulfillment option.`);
      (groups[p.farmerId] ??= []).push({
        ...item,
        name: p.name,
        image: p.images[0],
        unit: p.unit,
        price: unitPrice(p, item.quantity),
        preorder: p.availability === 'Upcoming Harvest',
        availableDate: p.availableDate,
      });
    }
    const placed = Object.entries(groups).map(([farmerId, items]) => {
      const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0),
        deliveryFee = details.fulfillment === 'delivery' ? 250 : 0;
      return {
        ...details,
        id: 'F2H-' + crypto.randomUUID().slice(0, 8).toUpperCase(),
        customerId: user.id,
        customer: details.name,
        farmerId,
        items,
        subtotal,
        deliveryFee,
        total: subtotal + deliveryFee,
        status: 'Pending',
        date: new Date().toISOString().slice(0, 10),
        estimatedDate: items.reduce(
          (latest, i) => (i.preorder && i.availableDate > latest ? i.availableDate : latest),
          new Date(Date.now() + 3 * 86400000).toISOString().slice(0, 10),
        ),
      };
    });
    setOrders((old) => [...placed, ...old]);
    setProducts((old) =>
      old.map((p) => {
        const item = cart.find((c) => c.productId === p.id);
        if (!item) return p;
        const quantity = p.quantity - item.quantity;
        return {
          ...p,
          quantity,
          availability:
            quantity === 0
              ? 'Sold Out'
              : p.availability === 'Upcoming Harvest'
                ? 'Upcoming Harvest'
                : quantity < 5
                  ? 'Low Stock'
                  : 'Available',
        };
      }),
    );
    placed.forEach((o) => addNotice(o.farmerId, 'New order ' + o.id, '/farmer/orders/' + o.id));
    setCart([]);
    sessionStorage.setItem('f2h:lastOrders', JSON.stringify(placed.map((o) => o.id)));
    return placed;
  };
  const changeStatus = (id, status) => {
    const order = orders.find((o) => o.id === id);
    if (!order) return;
    const isFarmer = user?.role === 'farmer' && user.id === order.farmerId,
      isCustomer = user?.role === 'customer' && user.id === order.customerId;
    const next = seed.orderSteps(order.fulfillment)[
      seed.orderSteps(order.fulfillment).indexOf(order.status) + 1
    ];
    if (
      !(
        status === 'Cancelled' &&
        ['Pending', 'Confirmed'].includes(order.status) &&
        (isCustomer || isFarmer)
      ) &&
      !(isFarmer && !['Cancelled', 'Completed'].includes(order.status) && status === next)
    )
      throw new Error('This status change is not allowed.');
    setOrders((old) => old.map((o) => (o.id === id ? { ...o, status } : o)));
    if (status === 'Cancelled')
      setProducts((old) =>
        old.map((p) => {
          const item = order.items.find((i) => i.productId === p.id);
          return item
            ? {
                ...p,
                quantity: p.quantity + item.quantity,
                availability: item.preorder ? 'Upcoming Harvest' : 'Available',
              }
            : p;
        }),
      );
    addNotice(
      isFarmer ? order.customerId : order.farmerId,
      `Order ${id}: ${status}`,
      `/${isFarmer ? 'customer' : 'farmer'}/orders/${id}`,
    );
    notify('Order updated.');
  };
  return (
    <UIContext.Provider value={{ notify, toast }}>
      <AuthContext.Provider value={{ user, signIn, logout, updateProfile }}>
        <ProductContext.Provider
          value={{
            products,
            setProducts,
            farmers,
            setFarmers,
            orders,
            setOrders,
            reviews,
            setReviews,
            placeOrder,
            changeStatus,
            recent,
            setRecent,
            addNotice,
          }}
        >
          <CartContext.Provider
            value={{
              cart,
              addToCart,
              updateQuantity,
              removeFromCart: (id) => setCart((old) => old.filter((c) => c.productId !== id)),
            }}
          >
            <WishlistContext.Provider value={{ wishlist, toggleWish }}>
              <NotificationContext.Provider
                value={{
                  notifications: notifications.filter((n) => n.userId === user?.id),
                  markRead: (id) =>
                    setNotifications((old) =>
                      old.map((n) =>
                        (id === 'all' ? n.userId === user?.id : n.id === id)
                          ? { ...n, read: true }
                          : n,
                      ),
                    ),
                }}
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
