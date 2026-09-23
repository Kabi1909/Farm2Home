import { productView } from '../../services/adapters';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ShoppingBag,
  ArrowRight,
  Trash2,
  Truck,
  ShieldCheck,
  CheckCircle2,
  MapPin,
} from 'lucide-react';
import { useAuth, useMarket, useCart, useWishlist } from '../../context/AppContext';
import { districts, towns } from '../../data/catalog';
import { money, unitPrice, validPhone } from '../../utils/helpers';
import {
  PageHeading,
  EmptyState,
  Img,
  QuantitySelector,
  Field,
  Select,
} from '../../components/common/UI';
import { ProductGrid } from '../../components/product/ProductCard';
export function Wishlist() {
  const { wishlist } = useWishlist();
  const { products } = useMarket();
  const selected = products.filter((p) => wishlist.includes(p.id) && p.enabled && !p.draft);
  return (
    <>
      <PageHeading
        eyebrow="SAVED FOR SOMETHING GOOD"
        title="Your favourites"
        description="A little collection of fresh finds you love."
      />
      {selected.length ? (
        <ProductGrid products={selected} />
      ) : (
        <EmptyState
          title="Your wishlist is empty."
          description="Tap a heart on any product to save it here."
        />
      )}
    </>
  );
}
function useBasket() {
  const { cart, deliveryCharge } = useCart();
  const { products, farmers } = useMarket();
  const rows = cart.map((item) => ({
    ...item,
    product: {
      ...(item.product
        ? productView(item.product)
        : {
            id: item.productId,
            name: 'Unavailable product',
            images: [],
            quantity: 0,
            price: 0,
            unit: '',
          }),
      unavailable: item.unavailable,
      price: item.unitPrice || 0,
      bulkPrice: 0,
      isBulkPrice: item.isBulkPrice,
    },
  }));
  const groups = Object.groupBy
    ? Object.groupBy(rows, (i) => i.product.farmerId)
    : rows.reduce(
        (o, i) => ({ ...o, [i.product.farmerId]: [...(o[i.product.farmerId] || []), i] }),
        {},
      );
  const subtotal = rows.reduce((sum, item) => sum + (item.lineTotal || 0), 0);
  return { rows, groups, subtotal, farmers, deliveryCharge };
}
export function Cart() {
  const { rows, groups, subtotal, farmers, deliveryCharge } = useBasket();
  const { updateQuantity, removeFromCart } = useCart();
  if (!rows.length)
    return (
      <EmptyState
        title="Your cart is empty."
        description="Let’s fill it with something fresh from a local farm."
      />
    );
  const delivery = Object.keys(groups).length * deliveryCharge;
  return (
    <>
      <PageHeading
        eyebrow="A LITTLE GOODNESS FOR YOUR HOME"
        title="Your fresh basket"
        description={`${rows.length} fresh finds from ${Object.keys(groups).length} local farms`}
      />
      <div className="checkout-layout">
        <div>
          {Object.entries(groups).map(([id, items]) => (
            <section className="panel cart-farm" key={id}>
              <h3>
                <SproutIcon />
                {farmers.find((f) => f.id === id)?.farm || 'Local farm'}
              </h3>
              {items.map(({ product: p, quantity }) => (
                <div className="cart-item" key={p.id}>
                  <Link to={'/products/' + p.id}>
                    <Img src={p.images[0]} alt={p.name} />
                  </Link>
                  <div>
                    <Link to={'/products/' + p.id}>
                      <h3>{p.name}</h3>
                    </Link>
                    <p>
                      {money(unitPrice(p, quantity))} / {p.unit}
                    </p>
                    {p.isBulkPrice && <span className="badge green">Bulk price applied</span>}
                    {p.availability === 'Upcoming Harvest' && (
                      <span className="badge amber">Pre-order · {p.availableDate}</span>
                    )}
                    {p.unavailable && (
                      <p className="error-text">
                        This item is unavailable. Remove it or update its quantity.
                      </p>
                    )}
                    <QuantitySelector
                      value={quantity}
                      max={p.quantity}
                      onChange={(n) => updateQuantity(p.id, n)}
                    />
                  </div>
                  <div className="cart-item-total">
                    <strong>{money(unitPrice(p, quantity) * quantity)}</strong>
                    <button
                      className="icon-btn"
                      aria-label={'Remove ' + p.name}
                      onClick={() => removeFromCart(p.id)}
                    >
                      <Trash2 size={17} />
                    </button>
                  </div>
                </div>
              ))}
              <div className="between farm-subtotal">
                <span>Farm subtotal</span>
                <strong>
                  {money(
                    items.reduce((s, i) => s + unitPrice(i.product, i.quantity) * i.quantity, 0),
                  )}
                </strong>
              </div>
            </section>
          ))}
        </div>
        <aside className="panel order-summary">
          <h2>Your basket, at a glance</h2>
          <div>
            <span>Subtotal</span>
            <strong>{money(subtotal)}</strong>
          </div>
          <div>
            <span>Delivery estimate</span>
            <strong>{money(delivery)}</strong>
          </div>
          <small>{money(deliveryCharge)} per farm. Pickup is free.</small>
          <div className="summary-total">
            <span>Estimated total</span>
            <strong>{money(subtotal + delivery)}</strong>
          </div>
          <Link className="btn full" to="/customer/checkout">
            Proceed to checkout <ArrowRight size={17} />
          </Link>
          <Link to="/products" className="text-link center">
            Keep exploring
          </Link>
          <p className="summary-note">
            <ShieldCheck size={17} /> Fresh produce. Fair prices. No online payment needed.
          </p>
        </aside>
      </div>
    </>
  );
}
function SproutIcon() {
  return <ShoppingBag size={19} />;
}
export function Checkout() {
  const { user } = useAuth();
  const { placeOrder } = useMarket();
  const { rows, groups, subtotal, deliveryCharge } = useBasket();
  const [form, setForm] = useState({
    name: user.name,
    phone: user.phone || '',
    address: user.address || '',
    district: user.district || 'Colombo',
    city: user.city || 'Colombo',
    fulfillment: 'delivery',
  });
  const [error, setError] = useState(''),
    [busy, setBusy] = useState(false);
  const navigate = useNavigate();
  const set = (k, v) =>
    setForm((f) => ({ ...f, [k]: v, ...(k === 'district' ? { city: towns[v][0] } : {}) }));
  const delivery =
    form.fulfillment === 'delivery' ? Object.keys(groups).length * deliveryCharge : 0;
  if (!rows.length) return <EmptyState title="Your basket is empty." />;
  return (
    <>
      <PageHeading
        eyebrow="ONE STEP CLOSER TO FRESH"
        title="Make it yours."
        description="Confirm your details and we’ll let your farmers know."
      />
      <form
        className="checkout-layout"
        onSubmit={async (e) => {
          e.preventDefault();
          if (!validPhone(form.phone)) return setError('Enter a valid Sri Lankan phone number.');
          setBusy(true);
          try {
            await placeOrder({
              ...form,
              payment: form.fulfillment === 'delivery' ? 'Cash on Delivery' : 'Pay on Pickup',
            });
            navigate('/customer/order-success');
          } catch (err) {
            setError(err.message);
            setBusy(false);
          }
        }}
      >
        <div>
          <section className="panel">
            <h2>
              <span className="step-number">1</span> Contact details
            </h2>
            <div className="form-row">
              <Field
                label="Full name"
                required
                value={form.name}
                onChange={(e) => set('name', e.target.value)}
              />
              <Field
                label="Phone number"
                type="tel"
                required
                value={form.phone}
                onChange={(e) => set('phone', e.target.value)}
                error={error.includes('phone') ? error : null}
              />
            </div>
          </section>
          <section className="panel">
            <h2>
              <span className="step-number">2</span> Your way to fresh
            </h2>
            <div className="fulfillment-options">
              {[
                ['delivery', 'Home delivery', `${money(deliveryCharge)} per farm`, Truck],
                ['pickup', 'Farm pickup', 'Free · collect from each farm', MapPin],
              ].map(([value, title, description, Icon]) => (
                <label key={value} className={form.fulfillment === value ? 'selected' : ''}>
                  <input
                    type="radio"
                    name="fulfillment"
                    value={value}
                    checked={form.fulfillment === value}
                    onChange={() => set('fulfillment', value)}
                  />
                  <Icon />
                  <span>
                    <strong>{title}</strong>
                    <small>{description}</small>
                  </span>
                </label>
              ))}
            </div>
            {form.fulfillment === 'delivery' && (
              <>
                <Field
                  label="Delivery address"
                  required
                  value={form.address}
                  onChange={(e) => set('address', e.target.value)}
                />
                <div className="form-row">
                  <Select
                    label="District"
                    options={districts}
                    value={form.district}
                    onChange={(e) => set('district', e.target.value)}
                  />
                  <Select
                    label="City / town"
                    options={towns[form.district]}
                    value={form.city}
                    onChange={(e) => set('city', e.target.value)}
                  />
                </div>
              </>
            )}
            {rows.some((i) => i.unavailable || !i.product[form.fulfillment]) && (
              <p className="error-text">
                Some products do not support {form.fulfillment}. Choose another option or update
                your cart.
              </p>
            )}
          </section>
          <section className="panel">
            <h2>
              <span className="step-number">3</span> Payment
            </h2>
            <div className="notice">
              <ShieldCheck size={21} />
              <div>
                <strong>
                  {form.fulfillment === 'delivery' ? 'Cash on Delivery' : 'Pay on Pickup'}
                </strong>
                <p>Pay your farmer when you receive your produce. No card details required.</p>
              </div>
            </div>
          </section>
        </div>
        <aside className="panel order-summary">
          <h2>Review your order</h2>
          {rows.map(({ product: p, quantity }) => (
            <div className="checkout-line" key={p.id}>
              <Img src={p.images[0]} alt={p.name} />
              <span>
                <strong>{p.name}</strong>
                <small>
                  {quantity} {p.unit}
                  {p.availability === 'Upcoming Harvest' ? ' · Pre-order' : ''}
                </small>
              </span>
              <b>{money(unitPrice(p, quantity) * quantity)}</b>
            </div>
          ))}
          <div>
            <span>Subtotal</span>
            <strong>{money(subtotal)}</strong>
          </div>
          <div>
            <span>Delivery</span>
            <strong>{money(delivery)}</strong>
          </div>
          <div className="summary-total">
            <span>Total</span>
            <strong>{money(subtotal + delivery)}</strong>
          </div>
          {error && (
            <p className="error-text" role="alert">
              {error}
            </p>
          )}
          <button
            className="btn full"
            disabled={busy || rows.some((i) => i.unavailable || !i.product[form.fulfillment])}
          >
            {busy ? 'Placing order…' : 'Place order'}
            <ArrowRight size={17} />
          </button>
          <small>Each farm receives a separate order.</small>
        </aside>
      </form>
    </>
  );
}
export function OrderSuccess() {
  const { orders, farmers } = useMarket();
  const { user } = useAuth();
  let ids = [];
  try {
    ids = JSON.parse(sessionStorage.getItem('f2h:checkoutResult') || '[]');
  } catch {}
  const placed = orders.filter((o) => ids.includes(o.id) && o.customerId === user.id);
  if (!placed.length) return <EmptyState title="No recent order to show." />;
  return (
    <div className="success-page">
      <div className="success-icon">
        <CheckCircle2 size={44} />
      </div>
      <span className="eyebrow">GOOD THINGS ARE ON THEIR WAY</span>
      <h1>Order placed successfully!</h1>
      <p>Your farmers have received your order. Thank you for supporting local.</p>
      {placed.map((o) => (
        <section className="panel" key={o.id}>
          <div className="between">
            <strong>{o.id}</strong>
            <span className="badge green">{o.status}</span>
          </div>
          <h3>{farmers.find((f) => f.id === o.farmerId)?.farm}</h3>
          <p>{o.items.map((i) => `${i.name} × ${i.quantity} ${i.unit}`).join(' · ')}</p>
          <p>
            {o.fulfillment === 'delivery' ? 'Home delivery' : 'Farm pickup'} · Estimated{' '}
            {o.estimatedDate}
          </p>
          <div className="between">
            <strong>{money(o.total)}</strong>
            <Link className="btn small" to={'/customer/orders/' + o.id}>
              Track order <ArrowRight size={16} />
            </Link>
          </div>
        </section>
      ))}
      <Link to="/products" className="text-link center">
        Continue shopping <ArrowRight size={17} />
      </Link>
    </div>
  );
}
