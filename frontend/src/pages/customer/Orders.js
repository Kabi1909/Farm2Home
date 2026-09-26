import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Check, Package, ArrowRight } from 'lucide-react';
import { useAuth, useMarket, useUI } from '../../context/AppContext';
import { orderSteps } from '../../data/catalog';
import { money } from '../../utils/helpers';
import {
  PageHeading,
  EmptyState,
  StockBadge,
  Img,
  ConfirmDialog,
  Select,
} from '../../components/common/UI';
import { ReviewForm } from '../../components/order/Reviews';
export function OrderStatusTracker({ order }) {
  if (order.status === 'Cancelled')
    return <div className="notice error-text">This order was cancelled.</div>;
  const steps = orderSteps(order.fulfillment),
    current = steps.indexOf(order.status);
  return (
    <ol className="status-tracker">
      {steps.map((step, i) => (
        <li key={step} className={i <= current ? 'complete' : ''}>
          <span>{i <= current ? <Check size={16} /> : i + 1}</span>
          <strong>{step}</strong>
        </li>
      ))}
    </ol>
  );
}
export function OrderActions({ order }) {
  const { user } = useAuth();
  const { changeStatus } = useMarket();
  const { notify } = useUI();
  const [confirm, setConfirm] = useState(null);
  const steps = orderSteps(order.fulfillment),
    next = steps[steps.indexOf(order.status) + 1];
  return (
    <>
      <div className="actions">
        {user.role === 'farmer' && next && !['Cancelled', 'Completed'].includes(order.status) && (
          <button className="btn small" onClick={() => setConfirm(next)}>
            {next === 'Confirmed'
              ? 'Confirm order'
              : next === 'Preparing'
                ? 'Start preparing'
                : next === 'Completed'
                  ? 'Complete order'
                  : 'Mark ' + next.toLowerCase()}
          </button>
        )}
        {order.status === 'Pending' && (
          <button className="btn small secondary" onClick={() => setConfirm('Cancelled')}>
            Cancel order
          </button>
        )}
      </div>
      {confirm && (
        <ConfirmDialog
          title={confirm === 'Cancelled' ? 'Cancel this order?' : 'Update order status?'}
          description={`${order.displayName} will be marked ${confirm.toLowerCase()}.${confirm === 'Cancelled' ? ' Reserved stock will be restored.' : ''}`}
          onConfirm={async () => {
            try {
              await changeStatus(order.id, confirm);
            } catch (err) {
              notify(err.message, 'error');
            }
          }}
          onClose={() => setConfirm(null)}
        />
      )}
    </>
  );
}
export default function Orders() {
  const { user } = useAuth();
  const { orders, farmers } = useMarket();
  const [filter, setFilter] = useState('All');
  const farmer = user.role === 'farmer';
  const own = orders.filter((o) => (farmer ? o.farmerId === user.id : o.customerId === user.id));
  const filtered = own.filter(
    (o) =>
      filter === 'All' ||
      (filter === 'Active' && !['Completed', 'Cancelled'].includes(o.status)) ||
      (filter === 'Ready' && o.status === 'Ready for Pickup') ||
      (filter === 'Delivery' && ['Out for Delivery', 'Delivered'].includes(o.status)) ||
      o.status === filter,
  );
  return (
    <>
      <PageHeading
        eyebrow={farmer ? 'FROM YOUR FARM TO THEIR TABLE' : 'YOUR FARM-TO-HOME JOURNEY'}
        title={farmer ? 'Farm orders' : 'Your orders'}
        description={
          farmer
            ? 'Keep every customer in the loop, from harvest to handover.'
            : 'Follow the goodness, every step of the way.'
        }
      />
      <div className="tabs order-tabs">
        {(farmer
          ? [
              'All',
              'Pending',
              'Confirmed',
              'Preparing',
              'Ready',
              'Delivery',
              'Completed',
              'Cancelled',
            ]
          : ['All', 'Active', 'Completed', 'Cancelled']
        ).map((t) => (
          <button className={filter === t ? 'active' : ''} key={t} onClick={() => setFilter(t)}>
            {t}
          </button>
        ))}
      </div>
      {filtered.length ? (
        <div className="order-list">
          {filtered.map((o) => (
            <article className="panel order-card" key={o.id}>
              <div className="between">
                <div>
                  <Link to={'/' + user.role + '/orders/' + o.id}>
                    <h3>{o.displayName}</h3>
                  </Link>
                  <p>
                    {o.date} ·{' '}
                    {farmer ? o.customer : farmers.find((f) => f.id === o.farmerId)?.farm}
                  </p>
                </div>
                <StockBadge status={o.status} />
              </div>
              <div className="order-items-preview">
                {o.items.map((i) => (
                  <div key={i.productId}>
                    <Img src={i.image} alt={i.name} />
                    <span>
                      <strong>{i.name}</strong>
                      <small>
                        {i.quantity} {i.unit}
                        {i.preorder ? ' · Pre-order' : ''}
                      </small>
                    </span>
                  </div>
                ))}
              </div>
              <div className="between">
                <span>
                  <strong>{money(o.total)}</strong> ·{' '}
                  {o.fulfillment === 'pickup' ? 'Farm pickup' : 'Home delivery'}
                </span>
                <Link className="text-link" to={'/' + user.role + '/orders/' + o.id}>
                  View order <ArrowRight size={16} />
                </Link>
              </div>
              {farmer && <OrderActions order={o} />}
            </article>
          ))}
        </div>
      ) : (
        <EmptyState
          title="No orders yet."
          description="Orders in this view will appear here."
          to={farmer ? '/farmer/products' : '/products'}
          label={farmer ? 'Manage products' : 'Explore produce'}
        />
      )}
    </>
  );
}
export function OrderDetails() {
  const { id } = useParams();
  const { orders, farmers } = useMarket();
  const { user } = useAuth();
  const order = orders.find(
    (o) =>
      o.id === id && (user.role === 'farmer' ? o.farmerId === user.id : o.customerId === user.id),
  );
  if (!order)
    return (
      <EmptyState
        title="Order not found."
        to={'/' + user.role + '/orders'}
        label="View your orders"
      />
    );
  return (
    <>
      <PageHeading
        eyebrow="EVERY STEP, A LITTLE CLOSER"
        title={order.displayName}
        description={`Placed ${order.date} · ${order.fulfillment === 'pickup' ? 'Farm pickup' : 'Home delivery'}`}
        action={<StockBadge status={order.status} />}
      />
      <section className="panel">
        <OrderStatusTracker order={order} />
        <OrderActions order={order} />
      </section>
      <div className="detail-lower">
        <section className="panel">
          <h2>Your fresh picks</h2>
          {order.items.map((i) => (
            <div className="checkout-line" key={i.productId}>
              <Img src={i.image} alt={i.name} />
              <span>
                <strong>{i.name}</strong>
                <small>
                  {i.quantity} {i.unit} × {money(i.price)}
                  {i.preorder ? ' · Pre-order' : ''}
                </small>
              </span>
              <strong>{money(i.price * i.quantity)}</strong>
            </div>
          ))}
          <dl className="spec-list">
            <div>
              <dt>Subtotal</dt>
              <dd>{money(order.subtotal)}</dd>
            </div>
            <div>
              <dt>Delivery</dt>
              <dd>{money(order.deliveryFee)}</dd>
            </div>
            <div>
              <dt>Total</dt>
              <dd>
                <strong>{money(order.total)}</strong>
              </dd>
            </div>
          </dl>
        </section>
        <section className="panel">
          <h2>Handover details</h2>
          <dl className="spec-list">
            {[
              ['Order reference', order.id],
              ['Farmer', farmers.find((f) => f.id === order.farmerId)?.farm],
              ['Customer', order.customer],
              ['Phone', order.phone],
              [
                'Address',
                order.fulfillment === 'delivery'
                  ? order.address
                  : 'Coordinate pickup with the farmer after confirmation',
              ],
              ['Payment', order.payment],
              ['Estimated date', order.estimatedDate],
            ].map(([label, value]) => (
              <div key={label}>
                <dt>{label}</dt>
                <dd>{value}</dd>
              </div>
            ))}
          </dl>
        </section>
      </div>
      {user.role === 'customer' &&
        order.items.map((item) => <ReviewForm key={item.productId} order={order} item={item} />)}
    </>
  );
}
