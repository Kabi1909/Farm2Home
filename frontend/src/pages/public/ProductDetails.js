import { useState, useEffect, useRef } from 'react';
import useFlyToCart from '../../hooks/useFlyToCart';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { Heart, Truck, MapPin, Sprout, ShoppingBag, Calendar } from 'lucide-react';
import { useMarket, useCart, useWishlist } from '../../context/AppContext';
import {
  Breadcrumbs,
  EmptyState,
  PriceDisplay,
  QuantitySelector,
  RatingStars,
  StockBadge,
  SectionHeading,
  Img,
} from '../../components/common/UI';
import ImageGallery from '../../components/product/ImageGallery';
import { ProductGrid } from '../../components/product/ProductCard';
import { ReviewCard } from '../../components/order/Reviews';
import FarmMap from '../../components/map/FarmMap';
import { money, unitPrice } from '../../utils/helpers';
export default function ProductDetails() {
  const { id } = useParams();
  const { products, farmers, reviews, recent, setRecent } = useMarket();
  const { addToCart } = useCart();
  const addWithFlight = useFlyToCart();
  const mainImage = useRef(null);
  const { wishlist, toggleWish } = useWishlist();
  const [quantity, setQuantity] = useState(1);
  const navigate = useNavigate();
  const p = products.find((p) => p.id === id && p.enabled && !p.draft);
  const farmer = farmers.find((f) => f.id === p?.farmerId);
  useEffect(() => {
    setQuantity(1);
    if (p) setRecent((old) => [id, ...old.filter((x) => x !== id)].slice(0, 8));
  }, [id]);
  if (!p) return <EmptyState title="This product is unavailable." />;
  const productReviews = reviews.filter((r) => r.productId === id);
  return (
    <main className="container page">
      <Breadcrumbs
        items={[
          { label: 'Shop', to: '/products' },
          { label: p.category, to: '/products?category=' + encodeURIComponent(p.category) },
          { label: p.name },
        ]}
      />
      <div className="product-detail">
        <ImageGallery images={p.images} name={p.name} imageRef={mainImage} />
        <div className="product-detail-copy">
          <div className="between">
            <span className="eyebrow">FRESH FROM {p.district.toUpperCase()}</span>
            <StockBadge status={p.availability} />
          </div>
          <h1>{p.name}</h1>
          <Link className="text-link" to={'/farmers/' + p.farmerId}>
            {farmer?.farm || 'Local family farm'}
          </Link>
          <RatingStars rating={p.rating} count={productReviews.length || p.reviewCount} />
          <PriceDisplay price={unitPrice(p, quantity)} unit={p.unit} />
          <p>{p.description}</p>
          <div className="detail-tags">
            <span>{p.quality}</span>
            <span>{p.method}</span>
            <span>
              {p.quantity} {p.unit} available
            </span>
          </div>
          {p.bulkPrice > 0 && (
            <div className="bulk-note">
              <ShoppingBag size={20} />
              <div>
                <strong>
                  {quantity >= p.bulkThreshold
                    ? 'Bulk price applied'
                    : 'A little more, a little less'}
                </strong>
                <p>
                  {money(p.bulkPrice)} / {p.unit} when you buy {p.bulkThreshold} {p.unit} or more.
                </p>
              </div>
            </div>
          )}
          {p.availability === 'Upcoming Harvest' && (
            <div className="notice">
              <Calendar size={18} /> Pre-order · Available from {p.availableDate}
            </div>
          )}
          <div className="buy-row">
            <QuantitySelector value={quantity} max={p.quantity} onChange={setQuantity} />
            <button
              className="btn"
              disabled={!p.quantity || p.availability === 'Sold Out'}
              onClick={() => addWithFlight(p, quantity, mainImage.current)}
            >
              <ShoppingBag size={18} />
              {p.availability === 'Upcoming Harvest' ? 'Pre-order' : 'Add to cart'}
            </button>
            <button
              className="icon-btn bordered"
              aria-label="Toggle wishlist"
              onClick={() => toggleWish(id)}
            >
              <Heart fill={wishlist.includes(id) ? 'currentColor' : 'none'} />
            </button>
          </div>
          <button
            className="btn secondary full"
            disabled={!p.quantity}
            onClick={async () => {
              if (await addToCart(p, quantity)) navigate('/customer/checkout');
            }}
          >
            Buy now
          </button>
          <div className="delivery-info">
            <span>
              <Truck size={18} />
              {p.delivery ? 'Home delivery available' : 'Delivery unavailable'}
            </span>
            <span>
              <MapPin size={18} />
              {p.pickup ? 'Farm pickup available' : 'Pickup unavailable'}
            </span>
          </div>
        </div>
      </div>
      <div className="detail-lower">
        <section className="panel">
          <h2>Good to know</h2>
          <dl className="spec-list">
            {[
              ['Farming method', p.method],
              ['Quality', p.quality],
              ['Harvested', p.harvestDate],
              ['Available from', p.availableDate],
              ['Best before', p.expiryDate],
              ['Location', p.city + ', ' + p.district],
              [
                'Delivery notes',
                p.deliveryNotes || 'Delivery usually takes 2–3 days after availability.',
              ],
              [
                'Pickup instructions',
                p.pickupNotes || 'Coordinate pickup after the farmer confirms your order.',
              ],
            ].map(([label, value]) => (
              <div key={label}>
                <dt>{label}</dt>
                <dd>{value}</dd>
              </div>
            ))}
          </dl>
        </section>
        <section className="panel">
          <h2>Meet your grower</h2>
          <div className="grower-mini">
            <Img src={farmer?.image} alt={farmer?.name || 'Farmer'} />
            <div>
              <h3>{farmer?.name}</h3>
              <p>{farmer?.farm}</p>
              <Link to={'/farmers/' + p.farmerId} className="text-link">
                Visit the farm →
              </Link>
            </div>
          </div>
          <FarmMap lat={farmer?.lat} lng={farmer?.lng} name={farmer?.farm} />
        </section>
      </div>
      <section className="section">
        <SectionHeading
          title="From their tables to yours"
          description="Honest words from our community."
        />
        {productReviews.length ? (
          <div className="review-grid">
            {productReviews.map((r) => (
              <ReviewCard key={r.id} review={r} />
            ))}
          </div>
        ) : (
          <p>No reviews yet. Complete an order to share your experience.</p>
        )}
      </section>
      <section className="section">
        <SectionHeading title="More goodness to discover" to="/products" />
        <ProductGrid
          products={products
            .filter((x) => x.id !== id && x.category === p.category && x.enabled && !x.draft)
            .slice(0, 4)}
        />
      </section>
      {recent.length > 1 && (
        <section className="section">
          <SectionHeading title="Your recent fresh finds" />
          <ProductGrid
            products={recent
              .filter((x) => x !== id)
              .map((x) => products.find((p) => p.id === x && p.enabled && !p.draft))
              .filter(Boolean)
              .slice(0, 4)}
          />
        </section>
      )}
    </main>
  );
}
