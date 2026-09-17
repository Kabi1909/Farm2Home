import { Link, useNavigate } from 'react-router-dom';
import { Heart, MapPin, ShoppingCart, ArrowRight, Leaf } from 'lucide-react';
import { useMarket, useCart, useWishlist, useAuth } from '../../context/AppContext';
import { Img, PriceDisplay, RatingStars, StockBadge } from '../common/UI';
import { categoryArt } from '../../data/visuals';
export default function ProductCard({ product: p }) {
  const { farmers } = useMarket();
  const { addToCart } = useCart();
  const { wishlist, toggleWish } = useWishlist();
  const { user } = useAuth();
  const navigate = useNavigate();
  const farmer = farmers.find((f) => f.id === p.farmerId);
  return (
    <article className="product-card">
      <div className="product-image">
        <Link to={'/products/' + p.id}>
          <Img src={p.images[0]} alt={p.name} />
        </Link>
        <span className={'product-tag ' + (p.availability === 'Low Stock' ? 'low-stock' : '')}>
          {p.availability === 'Upcoming Harvest'
            ? 'Upcoming harvest'
            : p.availability === 'Low Stock'
              ? 'Low stock'
              : p.method === 'Organic'
                ? 'Organic'
                : 'Fresh'}
        </span>
        <button
          className={'wish-btn ' + (wishlist.includes(p.id) ? 'selected' : '')}
          aria-label={(wishlist.includes(p.id) ? 'Remove from' : 'Add to') + ' wishlist: ' + p.name}
          onClick={() => (user?.role === 'farmer' ? navigate('/unauthorized') : toggleWish(p.id))}
        >
          <Heart size={22} fill={wishlist.includes(p.id) ? 'currentColor' : 'none'} />
        </button>
      </div>
      <div className="product-body">
        <Link to={'/products/' + p.id}>
          <h3>{p.name}</h3>
        </Link>
        <Link className="product-farmer" to={'/farmers/' + p.farmerId}>
          <Img src={farmer?.image} alt="" />
          <span>
            {farmer?.farm || 'Local family farm'}
            <small>
              <MapPin size={10} />
              {p.district}
            </small>
          </span>
        </Link>
        <span className="product-category">
          <Leaf size={12} />
          {p.category}
        </span>
        <RatingStars rating={p.rating} count={p.reviewCount} />
        <PriceDisplay price={p.price} unit={p.unit} />
        <span className="product-stock">
          {p.quantity} {p.unit} available <small>· {p.quality}</small>
        </span>
        <div className="product-bottom">
          <Link to={'/products/' + p.id} aria-label={'View ' + p.name} className="product-view">
            <ShoppingCart size={15} />
          </Link>
          <button
            className="btn"
            disabled={p.quantity === 0 || p.availability === 'Sold Out'}
            aria-label={'Add ' + p.name + ' to cart'}
            onClick={() => addToCart(p)}
          >
            {p.availability === 'Upcoming Harvest' ? 'Pre-order' : 'Add to Cart'}
          </button>
        </div>
        {p.availability === 'Sold Out' && <StockBadge status={p.availability} />}
      </div>
    </article>
  );
}
export function ProductGrid({ products }) {
  return (
    <div className="product-grid">
      {products.map((p) => (
        <ProductCard key={p.id} product={p} />
      ))}
    </div>
  );
}
export function CategoryCard({ name, image, count = 0 }) {
  const art = categoryArt[name];
  return (
    <Link className="category-card" to={'/products?category=' + encodeURIComponent(name)}>
      <div className="category-photo">
        <Img src={art?.image || image} alt={name} />
      </div>
      <div className="category-caption">
        <span className="category-symbol">{art?.symbol || '🌿'}</span>
        <div>
          <h3>{name}</h3>
          <span>{count} Products</span>
        </div>
        <span className="category-arrow">
          <ArrowRight size={13} />
        </span>
      </div>
    </Link>
  );
}
