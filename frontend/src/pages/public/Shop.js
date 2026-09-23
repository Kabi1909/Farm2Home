import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, SlidersHorizontal, X, Leaf } from 'lucide-react';
import { useMarket } from '../../context/AppContext';
import { categories, districts, towns, methods, qualities, statuses } from '../../data/catalog';
import { filterProducts } from '../../utils/helpers';
import {
  PageHeading,
  Select,
  Field,
  Checkbox,
  EmptyState,
  Pagination,
  Breadcrumbs,
} from '../../components/common/UI';
import { ProductGrid } from '../../components/product/ProductCard';
import FarmBanner from '../../components/common/FarmBanner';
import ShopSidebar from '../../components/product/ShopSidebar';
export default function Shop() {
  const { products, farmers } = useMarket();
  const [params, setParams] = useSearchParams();
  const [drawer, setDrawer] = useState(false);
  const [view, setView] = useState('grid');
  const set = (key, value) => {
    const next = new URLSearchParams(params);
    value ? next.set(key, value) : next.delete(key);
    if (key !== 'page') next.delete('page');
    if (key === 'district') next.delete('city');
    setParams(next);
  };
  const filtered = filterProducts(products, params, farmers);
  const pages = Math.ceil(filtered.length / 12);
  const page = Math.min(Math.max(1, Number(params.get('page')) || 1), pages || 1);
  const active = [...params.entries()].filter(([key]) => !['page', 'sort'].includes(key));
  return (
    <main className="reference-shop">
      <FarmBanner
        title="Fresh Produce from Local Farmers"
        description="Discover high-quality fruits, vegetables, rice, spices and more from trusted Sri Lankan farmers."
        variant="shop"
      />
      <div className="container shop-container">
        <div className="shop-search mobile-shop-search">
          <Search size={20} />
          <input
            aria-label="Search products"
            placeholder="Search produce, farms, or places…"
            value={params.get('search') || ''}
            onChange={(e) => set('search', e.target.value)}
          />
          <button className="btn secondary filter-toggle" onClick={() => setDrawer(!drawer)}>
            <SlidersHorizontal size={16} /> Filters
          </button>
        </div>
        <div className={'shop-layout view-' + view}>
          <aside className={'filters ' + (drawer ? 'open' : '')}>
            <div className="between">
              <h3>
                <SlidersHorizontal size={17} /> Filters
              </h3>
              <button
                onClick={() => {
                  setParams({});
                  setDrawer(false);
                }}
              >
                Clear All
              </button>
              <button
                className="filter-toggle icon-btn"
                aria-label="Close filters"
                onClick={() => setDrawer(false)}
              >
                <X />
              </button>
            </div>
            <Field
              label="Search products"
              value={params.get('search') || ''}
              placeholder="Search products..."
              onChange={(e) => set('search', e.target.value)}
            />
            <fieldset className="filter-options">
              <legend>Category</legend>
              {categories.map((category) => (
                <Checkbox
                  key={category}
                  label={category}
                  checked={params.get('category') === category}
                  onChange={(e) => set('category', e.target.checked ? category : '')}
                />
              ))}
            </fieldset>
            <div className="form-row">
              <Field
                label="Min price (Rs.)"
                type="number"
                min="0"
                value={params.get('min') || ''}
                onChange={(e) => set('min', e.target.value)}
              />
              <Field
                label="Max price (Rs.)"
                type="number"
                min="0"
                value={params.get('max') || ''}
                onChange={(e) => set('max', e.target.value)}
              />
            </div>
            <Select
              label="District"
              value={params.get('district') || ''}
              onChange={(e) => set('district', e.target.value)}
              options={[{ value: '', label: 'All districts' }, ...districts]}
            />
            <Select
              label="City / town"
              value={params.get('city') || ''}
              onChange={(e) => set('city', e.target.value)}
              options={[
                { value: '', label: 'All towns' },
                ...(towns[params.get('district')] || []),
              ]}
            />
            {[
              ['method', 'Farming method', methods],
              ['quality', 'Quality', qualities],
              ['availability', 'Availability', statuses],
            ].map(([key, label, options]) => (
              <fieldset className="filter-options" key={key}>
                <legend>{label}</legend>
                {options.map((option) => (
                  <Checkbox
                    key={option}
                    label={option}
                    checked={params.get(key) === option}
                    onChange={(e) => set(key, e.target.checked ? option : '')}
                  />
                ))}
              </fieldset>
            ))}
            <Select
              label="Minimum rating"
              value={params.get('rating') || ''}
              onChange={(e) => set('rating', e.target.value)}
              options={[
                { value: '', label: 'Any rating' },
                { value: '4', label: '4 stars & above' },
                { value: '4.5', label: '4.5 stars & above' },
                { value: '5', label: '5 stars' },
              ]}
            />
            <Checkbox
              label="Home delivery available"
              checked={!!params.get('delivery')}
              onChange={(e) => set('delivery', e.target.checked ? 'true' : '')}
            />
            <Checkbox
              label="Farm pickup available"
              checked={!!params.get('pickup')}
              onChange={(e) => set('pickup', e.target.checked ? 'true' : '')}
            />
            <button className="btn full" onClick={() => setDrawer(false)}>
              Apply Filters
            </button>
          </aside>
          <section className="shop-results">
            <div className="results-bar">
              <span>
                <strong>{filtered.length} Products Found</strong>
              </span>
              <Select
                label="Sort by"
                value={params.get('sort') || 'latest'}
                onChange={(e) => set('sort', e.target.value)}
                options={[
                  { value: 'latest', label: 'Latest arrivals' },
                  { value: 'price-asc', label: 'Price: low to high' },
                  { value: 'price-desc', label: 'Price: high to low' },
                  { value: 'rating', label: 'Highest rated' },
                  { value: 'popular', label: 'Most popular' },
                ]}
              />
              <div className="view-buttons">
                <button
                  aria-label="Grid view"
                  aria-pressed={view === 'grid'}
                  onClick={() => setView('grid')}
                >
                  ▦
                </button>
                <button
                  aria-label="List view"
                  aria-pressed={view === 'list'}
                  onClick={() => setView('list')}
                >
                  ☷
                </button>
              </div>
            </div>
            {active.length > 0 && (
              <div className="filter-chips">
                {active.map(([key, value]) => (
                  <button key={key} onClick={() => set(key, '')}>
                    {key}: {value}
                    <X size={12} />
                  </button>
                ))}
              </div>
            )}
            {filtered.length ? (
              <ProductGrid products={filtered.slice((page - 1) * 12, page * 12)} />
            ) : (
              <EmptyState
                title="No products found."
                description="Try another search or clear a filter to find something fresh."
              />
            )}
            <Pagination page={page} total={pages} onChange={(p) => set('page', p)} />
          </section>
          <ShopSidebar />
        </div>
      </div>
    </main>
  );
}
