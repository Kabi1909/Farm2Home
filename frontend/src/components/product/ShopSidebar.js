import { Link } from 'react-router-dom';
import { Leaf, Headphones, ArrowRight } from 'lucide-react';
import { Img } from '../common/UI';
import { useMarket } from '../../context/AppContext';
import { money } from '../../utils/helpers';
export default function ShopSidebar() {
  const { products, recent } = useMarket();
  const selected = recent.map((id) => products.find((p) => p.id === id)).filter(Boolean);
  const viewed = (selected.length ? selected : products.slice(0, 4)).slice(0, 4);
  return (
    <aside className="shop-right">
      <section className="support-card">
        <Leaf size={33} />
        <h2>
          Support Local
          <br />
          Farmers
        </h2>
        <p>Every purchase helps a farmer and a healthier Sri Lanka.</p>
        <Link to="/farmers" className="text-link">
          Meet our farmers <ArrowRight size={13} />
        </Link>
      </section>
      <section className="shop-promo">
        <h2>Fresh Harvest</h2>
        <p>Straight to Your Home</p>
        <Link className="btn light small" to="/products?availability=Upcoming+Harvest">
          Shop Now <ArrowRight size={13} />
        </Link>
      </section>
      <section className="recently-viewed panel">
        <div className="between">
          <h3>{selected.length ? 'Recently Viewed' : 'Fresh Finds'}</h3>
          <Link className="text-link" to="/products">
            View All
          </Link>
        </div>
        {viewed.map((p) => (
          <Link key={p.id} to={'/products/' + p.id}>
            <Img src={p.images[0]} alt={p.name} />
            <span>
              <strong>{p.name}</strong>
              <small>
                {money(p.price)} / {p.unit}
              </small>
            </span>
            <ArrowRight size={11} />
          </Link>
        ))}
      </section>
      <section className="support-help panel">
        <Headphones size={30} />
        <h3>Need Help?</h3>
        <p>We’re here for you</p>
        <Link className="btn secondary full small" to="/contact">
          Contact Support
        </Link>
      </section>
    </aside>
  );
}
