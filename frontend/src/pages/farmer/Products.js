import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Edit, Trash2, Eye, Package, Power } from 'lucide-react';
import { useMarket, useAuth, useUI } from '../../context/AppContext';
import {
  PageHeading,
  Img,
  StockBadge,
  EmptyState,
  ConfirmDialog,
  Modal,
  Field,
  Select,
} from '../../components/common/UI';
import { money } from '../../utils/helpers';
export default function Products() {
  const { products, setProducts, orders, setOrders } = useMarket();
  const { user } = useAuth();
  const { notify } = useUI();
  const [search, setSearch] = useState(''),
    [filter, setFilter] = useState('All'),
    [remove, setRemove] = useState(null),
    [stock, setStock] = useState(null);
  const own = products.filter((p) => p.farmerId === user.id);
  const filtered = own.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) &&
      (filter === 'All' || (filter === 'Drafts' && p.draft) || p.availability === filter),
  );
  const update = (id, changes) => {
    setProducts((old) => old.map((p) => (p.id === id ? { ...p, ...changes } : p)));
    notify('Product updated.');
  };
  return (
    <>
      <PageHeading
        eyebrow="YOUR HARVEST, YOUR MARKET"
        title="My products"
        description="Keep your fresh picks looking their best."
        action={
          <Link to="/farmer/products/new" className="btn">
            <Plus size={17} />
            Add product
          </Link>
        }
      />
      <div className="directory-filters">
        <Field
          label="Search your produce"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Find a product…"
        />
        <Select
          label="Availability"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          options={['All', 'Available', 'Low Stock', 'Upcoming Harvest', 'Sold Out', 'Drafts']}
        />
      </div>
      {filtered.length ? (
        <div className="management-list">
          {filtered.map((p) => (
            <article className="panel management-product" key={p.id}>
              <Img src={p.images[0]} alt={p.name} />
              <div>
                <span className="eyebrow">{p.category}</span>
                <h3>{p.name}</h3>
                <span>
                  {money(p.price)} / {p.unit} · {p.quantity} {p.unit}
                </span>
                <p>
                  {p.views} views ·{' '}
                  {orders.filter((o) => o.items.some((i) => i.productId === p.id)).length} orders
                </p>
                <StockBadge status={p.draft ? 'Draft' : !p.enabled ? 'Disabled' : p.availability} />
              </div>
              <div className="management-actions">
                <Link className="btn small secondary" to={'/farmer/products/' + p.id + '/edit'}>
                  <Edit size={14} />
                  Edit
                </Link>
                <button
                  className="btn small secondary"
                  onClick={() => setStock({ id: p.id, quantity: p.quantity })}
                >
                  <Package size={14} />
                  Stock
                </button>
                <button
                  className="btn small secondary"
                  onClick={() => update(p.id, { enabled: !p.enabled })}
                >
                  <Power size={14} />
                  {p.enabled ? 'Disable' : 'Enable'}
                </button>
                <button
                  className="btn small secondary"
                  onClick={() => update(p.id, { quantity: 0, availability: 'Sold Out' })}
                >
                  Sold out
                </button>
                {!p.draft && p.enabled && (
                  <Link className="icon-btn" aria-label={'View ' + p.name} to={'/products/' + p.id}>
                    <Eye size={17} />
                  </Link>
                )}
                <button
                  className="icon-btn danger"
                  aria-label={'Delete ' + p.name}
                  onClick={() => setRemove(p)}
                >
                  <Trash2 size={17} />
                </button>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <EmptyState
          title={
            own.length ? 'No products match your search.' : 'You haven’t listed any products yet.'
          }
          to="/farmer/products/new"
          label="Add your first harvest"
        />
      )}
      {remove && (
        <ConfirmDialog
          title={'Delete ' + remove.name + '?'}
          description="This removes the listing from the marketplace. Existing order records will be kept."
          onConfirm={() => {
            setProducts((old) => old.filter((p) => p.id !== remove.id));
            notify('Product deleted.');
          }}
          onClose={() => setRemove(null)}
        />
      )}{' '}
      {stock && (
        <Modal title="Update available stock" onClose={() => setStock(null)}>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              update(stock.id, {
                quantity: Number(stock.quantity),
                availability:
                  Number(stock.quantity) === 0
                    ? 'Sold Out'
                    : Number(stock.quantity) < 5
                      ? 'Low Stock'
                      : 'Available',
              });
              setStock(null);
            }}
          >
            <Field
              label="Available quantity"
              type="number"
              min="0"
              step="1"
              required
              value={stock.quantity}
              onChange={(e) => setStock({ ...stock, quantity: e.target.value })}
            />
            <button className="btn">Save stock</button>
          </form>
        </Modal>
      )}
    </>
  );
}
