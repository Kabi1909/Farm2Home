import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { MapPin, Sprout, Truck } from 'lucide-react';
import { useMarket } from '../../context/AppContext';
import { districts, methods } from '../../data/seed';
import {
  PageHeading,
  Field,
  Select,
  Checkbox,
  Img,
  RatingStars,
  SectionHeading,
  EmptyState,
} from '../../components/common/UI';
import FarmerCard from '../../components/farmer/FarmerCard';
import { ProductGrid } from '../../components/product/ProductCard';
import { ReviewCard } from '../../components/order/Reviews';
import FarmMap from '../../components/map/FarmMap';
import FarmBanner from '../../components/common/FarmBanner';
export function Farmers() {
  const { farmers } = useMarket();
  const [filters, setFilters] = useState({
    search: '',
    district: '',
    method: '',
    rating: '',
    delivery: false,
  });
  const set = (k, v) => setFilters((f) => ({ ...f, [k]: v }));
  const filtered = farmers.filter(
    (f) =>
      [f.name, f.farm, f.crops].join(' ').toLowerCase().includes(filters.search.toLowerCase()) &&
      (!filters.district || f.district === filters.district) &&
      (!filters.method || f.method === filters.method) &&
      (!filters.rating || f.rating >= Number(filters.rating)) &&
      (!filters.delivery || f.delivery),
  );
  return (
    <main className="reference-farmers">
      <FarmBanner
        title="Our Farmers"
        subtitle="The heart of Farm2Home LK"
        description="Meet the local farmers who grow fresh, healthy and high-quality food for a stronger Sri Lanka. Support local. Choose fresh. Build a better tomorrow."
        variant="farmers"
      />
      <div className="container farmers-content">
        <div className="directory-filters">
          <Field
            label="Farmer, farm or main crop"
            placeholder="Find a grower…"
            value={filters.search}
            onChange={(e) => set('search', e.target.value)}
          />
          <Select
            label="District"
            options={[{ value: '', label: 'All districts' }, ...districts]}
            value={filters.district}
            onChange={(e) => set('district', e.target.value)}
          />
          <Select
            label="Farming method"
            options={[{ value: '', label: 'All methods' }, ...methods]}
            value={filters.method}
            onChange={(e) => set('method', e.target.value)}
          />
          <Select
            label="Rating"
            options={[
              { value: '', label: 'Any rating' },
              { value: '4.8', label: '4.8 & above' },
            ]}
            value={filters.rating}
            onChange={(e) => set('rating', e.target.value)}
          />
          <Checkbox
            label="Delivery available"
            checked={filters.delivery}
            onChange={(e) => set('delivery', e.target.checked)}
          />
        </div>
        <div className="section-heading">
          <div>
            <h2>Featured Farmers</h2>
            <p>Discover trusted growers from different regions of Sri Lanka.</p>
          </div>
          <span className="muted">{filtered.length} local growers</span>
        </div>
        {filtered.length ? (
          <div className="farmer-grid">
            {filtered.map((f) => (
              <FarmerCard key={f.id} farmer={f} />
            ))}
          </div>
        ) : (
          <EmptyState
            title="No farmers found."
            description="Try another location or farming method."
          />
        )}
        <div className="farmer-community-stats">
          <div>
            <Sprout />
            <strong>{farmers.length}+</strong>
            <span>Local Farmers</span>
          </div>
          <div>
            <Truck />
            <strong>25</strong>
            <span>Districts Covered</span>
          </div>
          <div>
            <LeafIcon />
            <strong>Fresh</strong>
            <span>Seasonal Products</span>
          </div>
          <div>
            <Sprout />
            <strong>100%</strong>
            <span>Support Local</span>
          </div>
          <blockquote>
            When you support a local farmer,
            <br />
            you support a stronger Sri Lanka.
          </blockquote>
        </div>
      </div>
    </main>
  );
}
function LeafIcon() {
  return <Sprout />;
}
export function FarmerProfile() {
  const { id } = useParams();
  const { farmers, products, reviews } = useMarket();
  const f = farmers.find((f) => f.id === id);
  if (!f) return <EmptyState title="Farm not found." to="/farmers" label="Meet our farmers" />;
  const listings = products.filter((p) => p.farmerId === id && p.enabled && !p.draft);
  return (
    <main className="container page">
      <section className="farm-profile-header">
        <Img src={f.image} alt={f.name} />
        <div>
          <span className="eyebrow">GROWN WITH CARE IN {f.district?.toUpperCase()}</span>
          <h1>{f.farm || f.name}</h1>
          <p>
            Meet {f.name} · {f.city}, {f.district}
          </p>
          <RatingStars rating={f.rating} />
          <div className="detail-tags">
            <span>{f.experience || 0} years growing</span>
            <span>{f.size || 0} acres</span>
            <span>{f.completed || 0} completed orders</span>
          </div>
        </div>
      </section>
      <div className="detail-lower">
        <section className="panel">
          <h2>A little about our farm</h2>
          <p>{f.description}</p>
          <dl className="spec-list">
            <div>
              <dt>Main crops</dt>
              <dd>{f.crops}</dd>
            </div>
            <div>
              <dt>Farming method</dt>
              <dd>{f.method}</dd>
            </div>
            <div>
              <dt>Home delivery</dt>
              <dd>{f.delivery ? 'Available' : 'Unavailable'}</dd>
            </div>
            <div>
              <dt>Farm pickup</dt>
              <dd>{f.pickup ? 'Available' : 'Unavailable'}</dd>
            </div>
          </dl>
        </section>
        <FarmMap lat={f.lat} lng={f.lng} name={f.farm} />
      </div>
      <section className="section">
        <SectionHeading title="Fresh from our farm" />
        {listings.length ? (
          <ProductGrid products={listings.filter((p) => p.availability !== 'Upcoming Harvest')} />
        ) : (
          <EmptyState title="The next harvest is on its way." />
        )}
      </section>
      <section className="section">
        <SectionHeading title="Looking forward to the next harvest" />
        <ProductGrid products={listings.filter((p) => p.availability === 'Upcoming Harvest')} />
        {!listings.some((p) => p.availability === 'Upcoming Harvest') && (
          <p>No upcoming harvests listed yet.</p>
        )}
      </section>
      <section className="section">
        <SectionHeading title="Words from our customers" />
        <div className="review-grid">
          {reviews
            .filter((r) => r.farmerId === id)
            .map((r) => (
              <ReviewCard key={r.id} review={r} />
            ))}
        </div>
      </section>
    </main>
  );
}
