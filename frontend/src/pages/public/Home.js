import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  Search,
  MapPin,
  Leaf,
  ShieldCheck,
  Truck,
  Sprout,
  Heart,
  Star,
  Handshake,
} from 'lucide-react';
import { useMarket } from '../../context/AppContext';
import { images, categories, districts } from '../../data/seed';
import { money } from '../../utils/helpers';
import { Img, SectionHeading } from '../../components/common/UI';
import { ProductGrid, CategoryCard } from '../../components/product/ProductCard';
import FarmerCard from '../../components/farmer/FarmerCard';

export function HeroSearch() {
  const [search, setSearch] = useState(''),
    [district, setDistrict] = useState('');
  const navigate = useNavigate();
  return (
    <form
      className="hero-search"
      onSubmit={(e) => {
        e.preventDefault();
        const query = new URLSearchParams();
        if (search) query.set('search', search);
        if (district) query.set('district', district);
        navigate('/products?' + query);
      }}
    >
      <Search size={21} />
      <input
        aria-label="Search produce, farmer or city"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="What are you looking for?"
      />
      <label>
        <MapPin size={18} />
        <select
          aria-label="Search district"
          value={district}
          onChange={(e) => setDistrict(e.target.value)}
        >
          <option value="">Select Location</option>
          {districts.map((d) => (
            <option key={d}>{d}</option>
          ))}
        </select>
      </label>
      <button className="btn">Search</button>
    </form>
  );
}
export default function Home() {
  const { products, farmers } = useMarket();
  const visible = products.filter((p) => p.enabled && !p.draft);
  const fresh = visible.slice(0, 6);
  const featured = visible.slice(6, 12);
  return (
    <main className="reference-home">
      <section className="reference-hero">
        <div className="container">
          <div className="reference-hero-copy">
            <span className="hero-kicker">LOCAL FARMS ・ FRESH PRODUCTS ・ HEALTHY FAMILIES</span>
            <h1>
              Fresh from Sri Lankan
              <br />
              Farms to Your Home
            </h1>
            <p>
              Buy fresh vegetables, fruits, rice, spices and other local products
              <br className="desktop-only" /> directly from trusted farmers.
            </p>
            <HeroSearch />
            <div className="popular-searches">
              <span>Popular:</span>
              {['Tomato', 'Rice', 'Coconut', 'Carrot', 'Cinnamon', 'Organic'].map((t) => (
                <Link
                  key={t}
                  to={'/products?' + (t === 'Organic' ? 'method=Organic' : 'search=' + t)}
                >
                  {t}
                </Link>
              ))}
            </div>
          </div>
          <span className="handwritten">
            Good Food
            <br />
            Brighter Tomorrows
          </span>
          <div className="hero-community">
            <div className="avatar-stack">
              {farmers.slice(0, 3).map((f) => (
                <Img src={f.image} alt={f.name} key={f.id} />
              ))}
            </div>
            <span>
              <strong>Growing together</strong>
              <small>Farmers & happy homes</small>
            </span>
          </div>
        </div>
      </section>
      <section className="reference-benefits">
        <div className="container">
          {[
            [Sprout, 'Direct from Farmers', 'No unnecessary intermediaries'],
            [ShieldCheck, 'Fresh & Quality Products', 'Naturally grown, carefully selected'],
            [Truck, 'Islandwide Delivery', 'From farm to your doorstep'],
            [Heart, 'Support Local Communities', 'Stronger farmers, healthier Sri Lanka'],
          ].map(([Icon, title, text]) => (
            <div key={title}>
              <span>
                <Icon size={31} />
              </span>
              <div>
                <strong>{title}</strong>
                <p>{text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
      <section className="container reference-section">
        <SectionHeading
          title="Shop by Category"
          description="Explore a wide range of fresh and local products"
          to="/categories"
          label="View All Categories"
        />
        <div className="home-category-grid">
          {categories
            .filter((c) => c !== 'Seeds')
            .map((name) => (
              <CategoryCard
                key={name}
                name={name}
                count={visible.filter((p) => p.category === name).length}
              />
            ))}
        </div>
      </section>
      <section className="container reference-section">
        <SectionHeading
          title="Fresh Today"
          description="Handpicked fresh products from our farmers"
          to="/products"
          label="View All Products"
        />
        <ProductGrid products={fresh} />
      </section>
      <section className="container reference-section">
        <SectionHeading
          title="Featured Products"
          description="Local favourites, thoughtfully grown and freshly picked."
          to="/products?sort=popular"
          label="Explore More"
        />
        <ProductGrid products={featured} />
      </section>
      <section className="container reference-section">
        <SectionHeading
          title="Meet Our Farmers"
          description="The people at the heart of Farm2Home LK"
          to="/farmers"
          label="View All Farmers"
        />
        <div className="farmer-grid">
          {farmers.slice(0, 4).map((f) => (
            <FarmerCard key={f.id} farmer={f} />
          ))}
        </div>
      </section>
      <section className="container reference-cta">
        <div>
          <h2>Fresh Harvest. Straight to Your Home.</h2>
          <p>Get the first pick of the season. Pre-order from your favourite farms.</p>
          <Link className="btn" to="/products?availability=Upcoming+Harvest">
            Explore Upcoming Harvests <ArrowRight size={16} />
          </Link>
        </div>
      </section>
      <section className="container reference-section" id="how-it-works">
        <SectionHeading
          title="From Our Farms to Your Home"
          description="A simpler way to choose fresh and support local."
        />
        <div className="how-grid">
          {[
            [Search, 'Discover fresh produce', 'Explore products from Sri Lankan farms.'],
            [Handshake, 'Buy directly from farmers', 'Choose what you love at a fair price.'],
            [Truck, 'Enjoy farm-fresh goodness', 'Home delivery or convenient farm pickup.'],
          ].map(([Icon, title, text]) => (
            <div key={title}>
              <div className="step-icon">
                <Icon size={28} />
              </div>
              <h3>{title}</h3>
              <p>{text}</p>
            </div>
          ))}
        </div>
      </section>
      <section className="container reference-section">
        <SectionHeading
          title="Recent Marketplace Prices"
          description="Based on recent Farm2Home marketplace listings. Fictional demo prices."
        />
        <div className="reference-prices">
          {[
            ['Tomato', 340, 360, images.tomato],
            ['Carrot', 420, 400, images.carrot],
            ['Potato', 300, 320, images.potato],
            ['Onion', 280, 290, images.onion],
          ].map(([name, price, previous, img]) => (
            <Link to={'/products?search=' + name} key={name}>
              <Img src={img} alt={name} />
              <span>
                <strong>{name}</strong>
                <b>{money(price)} / kg</b>
                <small>
                  Previously {money(previous)} ・{' '}
                  {(((price - previous) / previous) * 100).toFixed(1)}%
                </small>
              </span>
              <svg width="65" height="25" viewBox="0 0 65 25" aria-label="Illustrative price trend">
                <polyline
                  points={
                    price < previous
                      ? '0,4 13,9 24,6 38,16 52,14 65,22'
                      : '0,22 13,16 24,19 38,10 52,13 65,3'
                  }
                  fill="none"
                  stroke="#2f6b3b"
                  strokeWidth="2"
                />
              </svg>
            </Link>
          ))}
        </div>
      </section>
      <section className="container reference-section">
        <SectionHeading title="Loved by Our Community" />
        <div className="testimonial-grid">
          {[
            [
              'Fresh produce, fair prices and a real connection with our farmer. This is how shopping should feel.',
              'Amaya Perera',
            ],
            [
              'Carefully packed, beautifully fresh vegetables. Our family looks forward to every basket.',
              'Kasun Fernando',
            ],
            [
              'A simple way to support local farms while bringing better food to our table.',
              'Nethmi Silva',
            ],
          ].map(([text, name]) => (
            <article key={name}>
              <span className="stars">★★★★★</span>
              <blockquote>“{text}”</blockquote>
              <strong>{name}</strong>
              <small className="muted"> · Demo customer story</small>
            </article>
          ))}
        </div>
      </section>
      <section className="container reference-cta">
        <div>
          <h2>Empowering Local Farmers, Together.</h2>
          <p>You grow the goodness. We help you share it.</p>
          <Link className="btn" to="/register?role=farmer">
            Sell Your Harvest <ArrowRight size={16} />
          </Link>
        </div>
      </section>
    </main>
  );
}
