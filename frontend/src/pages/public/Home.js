import HomeHero from '../../components/hero/HomeHero';

import { Link } from 'react-router-dom';
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
import { images, categories } from '../../data/catalog';
import { money } from '../../utils/helpers';
import { Img, SectionHeading, RatingStars } from '../../components/common/UI';
import { ProductGrid, CategoryCard } from '../../components/product/ProductCard';
import FarmerCard from '../../components/farmer/FarmerCard';

export default function Home() {
  const { products, farmers, reviews, prices } = useMarket();
  const visible = products.filter((p) => p.enabled && !p.draft);
  const fresh = visible.slice(0, 6);
  const featured = visible.slice(6, 12);
  return (
    <main className="reference-home">
      <HomeHero />
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
          {!farmers.length && <p>No farmers have published a profile yet.</p>}
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
          description="Current asking prices from published marketplace listings."
        />
        <div className="reference-prices">
          {prices.slice(0, 4).map((price, index) => (
            <Link to={'/products?search=' + encodeURIComponent(price.productName)} key={index}>
              <span>
                <strong>{price.productName}</strong>
                <b>
                  {money(price.averagePrice)} / {price.unit}
                </b>
                <small>
                  {price.district} · {price.sampleCount} listings
                </small>
              </span>
            </Link>
          ))}
          {!prices.length && <p>Prices will appear when farmers publish their products.</p>}
        </div>
      </section>
      <section className="container reference-section">
        <SectionHeading title="Loved by Our Community" />
        <div className="testimonial-grid">
          {reviews.slice(0, 3).map((review) => (
            <article key={review.id}>
              <RatingStars rating={review.rating} />
              <blockquote>“{review.comment}”</blockquote>
              <strong>{review.customer}</strong>
            </article>
          ))}
          {!reviews.length && <p>Customer reviews will appear after completed orders.</p>}
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
