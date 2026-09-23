import { Link } from 'react-router-dom';
import {
  Package,
  ShoppingBag,
  Heart,
  Sprout,
  TrendingUp,
  ArrowUpRight,
  Calendar,
  AlertTriangle,
} from 'lucide-react';
import { useAuth, useMarket, useCart, useWishlist } from '../context/AppContext';
import { PageHeading, SectionHeading, EmptyState, StockBadge, Img } from '../components/common/UI';
import { ProductGrid } from '../components/product/ProductCard';
import {
  RevenueChart,
  PriceTrendChart,
  ProductSalesChart,
  CategoryChart,
} from '../components/dashboard/Charts';
import { ReviewCard } from '../components/order/Reviews';
import { money } from '../utils/helpers';
export function StatCard({ label, value, Icon = Package, note }) {
  return (
    <div className="stat-card">
      <div>
        <span>{label}</span>
        <Icon size={20} />
      </div>
      <strong>{value}</strong>
      {note && <small>{note}</small>}
    </div>
  );
}
export default function Dashboard() {
  const { user } = useAuth();
  const { products, orders, reviews, recent } = useMarket();
  const { cart } = useCart();
  const { wishlist } = useWishlist();
  const farmer = user.role === 'farmer';
  const own = orders.filter((o) => (farmer ? o.farmerId === user.id : o.customerId === user.id)),
    listings = products.filter((p) => p.farmerId === user.id);
  const completed = own.filter((o) => o.status === 'Completed');
  const available = products.filter((p) => p.enabled && !p.draft);
  const stats = farmer
    ? [
        ['Active products', listings.filter((p) => p.enabled && !p.draft).length, Sprout],
        [
          'Upcoming harvests',
          listings.filter((p) => p.availability === 'Upcoming Harvest').length,
          Calendar,
        ],
        ['Pending orders', own.filter((o) => o.status === 'Pending').length, Package],
        ['Completed orders', completed.length, ShoppingBag],
        ['Revenue', money(completed.reduce((s, o) => s + o.subtotal, 0)), TrendingUp],
        [
          'Low stock',
          listings.filter((p) => p.quantity > 0 && p.quantity < 5).length,
          AlertTriangle,
        ],
      ]
    : [
        [
          'Active orders',
          own.filter((o) => !['Completed', 'Cancelled'].includes(o.status)).length,
          Package,
        ],
        ['Completed orders', completed.length, ShoppingBag],
        ['Your favourites', wishlist.length, Heart],
        ['Basket items', cart.reduce((s, i) => s + i.quantity, 0), Sprout],
      ];
  return (
    <>
      <PageHeading
        eyebrow={farmer ? 'A GOOD DAY TO GROW' : 'YOUR LITTLE CORNER OF FRESH'}
        title={`Hello, ${user.name.split(' ')[0]}.`}
        description={
          farmer
            ? 'Here’s what’s growing in your farm today.'
            : 'Good food and fresh possibilities are waiting.'
        }
        action={
          <Link className="btn" to={farmer ? '/farmer/products/new' : '/products'}>
            {farmer ? 'Add a harvest' : 'Find something fresh'}
            <ArrowUpRight size={17} />
          </Link>
        }
      />
      {farmer && !user.farm && (
        <div className="notice">
          <Sprout />
          <div>
            <strong>Let’s introduce your farm.</strong>
            <p>Complete your profile so customers can get to know you.</p>
          </div>
          <Link className="btn small" to="/farmer/profile">
            Complete profile
          </Link>
        </div>
      )}
      <div className={'stats-grid ' + (farmer ? 'six' : '')}>
        {stats.map(([label, value, Icon]) => (
          <StatCard key={label} label={label} value={value} Icon={Icon} />
        ))}
      </div>
      {farmer && (
        <div className="chart-grid">
          <section className="panel">
            <h2>Monthly revenue</h2>
            <p>Completed orders · excluding delivery</p>
            <RevenueChart orders={completed} />
          </section>
          <section className="panel">
            <h2>Sales by category</h2>
            <CategoryChart products={products} orders={completed} />
          </section>
        </div>
      )}
      <section className="section compact">
        <SectionHeading
          title="Recent orders"
          to={'/' + user.role + '/orders'}
          label="View orders"
        />
        {own.length ? (
          <div className="panel recent-orders">
            {own.slice(0, 4).map((o) => (
              <Link key={o.id} to={'/' + user.role + '/orders/' + o.id}>
                <Img src={o.items[0]?.image} alt={o.items[0]?.name} />
                <div>
                  <strong>{user.role === 'farmer' ? o.displayName : o.id}</strong>
                  <small>{o.items.map((i) => i.name).join(', ')}</small>
                </div>
                <StockBadge status={o.status} />
                <strong>{money(o.total)}</strong>
                <ArrowUpRight size={17} />
              </Link>
            ))}
          </div>
        ) : (
          <EmptyState
            title="A fresh start."
            description={
              farmer
                ? 'New customer orders will appear here.'
                : 'Your first farm-fresh order is waiting to happen.'
            }
          />
        )}
      </section>
      {farmer ? (
        <>
          <div className="chart-grid">
            <section className="panel">
              <h2>Best-selling products</h2>
              <ProductSalesChart orders={completed} />
            </section>
            <section className="panel">
              <h2>Harvest watch</h2>
              {listings
                .filter((p) => p.quantity < 5 || p.availability === 'Upcoming Harvest')
                .map((p) => (
                  <div key={p.id} className="between harvest-watch">
                    <Link to={'/farmer/products/' + p.id + '/edit'}>{p.name}</Link>
                    <StockBadge status={p.availability} />
                  </div>
                ))}
              {!listings.some((p) => p.quantity < 5 || p.availability === 'Upcoming Harvest') && (
                <p>Your stock is looking good.</p>
              )}
            </section>
          </div>
          <PriceTrendChart />
          <SectionHeading title="Recent reviews" to="/farmer/reviews" />
          <div className="review-grid">
            {reviews
              .filter((r) => r.farmerId === user.id)
              .slice(0, 3)
              .map((r) => (
                <ReviewCard key={r.id} review={r} />
              ))}
          </div>
        </>
      ) : (
        <>
          <section className="section compact">
            <SectionHeading title="Picked for your table" to="/products" />
            <ProductGrid products={available.slice(0, 4)} />
          </section>
          {completed.length > 0 && (
            <section className="section compact">
              <SectionHeading title="Loved it? Bring it home again." />
              <ProductGrid
                products={available
                  .filter((p) => completed.some((o) => o.items.some((i) => i.productId === p.id)))
                  .slice(0, 4)}
              />
            </section>
          )}
          <section className="section compact">
            <SectionHeading
              title="A taste of the next season"
              to="/products?availability=Upcoming+Harvest"
            />
            <ProductGrid
              products={available.filter((p) => p.availability === 'Upcoming Harvest').slice(0, 4)}
            />
          </section>
          {recent.length > 0 && (
            <section className="section compact">
              <SectionHeading title="Recently viewed" />
              <ProductGrid
                products={recent
                  .map((id) => available.find((p) => p.id === id))
                  .filter(Boolean)
                  .slice(0, 4)}
              />
            </section>
          )}
        </>
      )}
    </>
  );
}
export function Analytics() {
  const { user } = useAuth();
  const { orders, products } = useMarket();
  const own = orders.filter((o) => o.farmerId === user.id),
    completed = own.filter((o) => o.status === 'Completed');
  const revenue = completed.reduce((s, o) => s + o.subtotal, 0);
  const totals = {};
  completed.forEach((o) =>
    o.items.forEach((i) => {
      totals[i.name] = (totals[i.name] || 0) + i.quantity;
    }),
  );
  const best = Object.entries(totals).sort((a, b) => b[1] - a[1])[0]?.[0] || 'No sales yet';
  return (
    <>
      <PageHeading
        eyebrow="SEE HOW YOUR FARM IS GROWING"
        title="Your harvest, in numbers."
        description="Revenue reflects completed orders and excludes delivery fees."
      />
      <div className="stats-grid">
        {[
          ['Revenue', money(revenue)],
          ['Completed orders', completed.length],
          ['Units sold', Object.values(totals).reduce((s, n) => s + n, 0)],
          ['Average order', money(completed.length ? revenue / completed.length : 0)],
        ].map(([label, value]) => (
          <StatCard key={label} label={label} value={value} />
        ))}
      </div>
      <div className="notice">
        Best seller: <strong>{best}</strong>
      </div>
      <div className="chart-grid">
        <section className="panel">
          <h2>Revenue</h2>
          <RevenueChart orders={completed} />
        </section>
        <section className="panel">
          <h2>Orders received</h2>
          <RevenueChart orders={own} kind="orders" />
        </section>
        <section className="panel">
          <h2>Product sales</h2>
          <ProductSalesChart orders={completed} />
        </section>
        <section className="panel">
          <h2>Category performance</h2>
          <CategoryChart products={products} orders={completed} />
        </section>
      </div>
      <PriceTrendChart />
    </>
  );
}
