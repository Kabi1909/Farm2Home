import { Link } from 'react-router-dom';
import { Star, ArrowRight } from 'lucide-react';
import { useMarket } from '../../context/AppContext';
import { categories, images } from '../../data/seed';
import FarmBanner from '../../components/common/FarmBanner';
import { CategoryCard } from '../../components/product/ProductCard';
import { Breadcrumbs, Img } from '../../components/common/UI';
export default function Categories() {
  const { products } = useMarket();
  return (
    <main className="categories-page">
      <FarmBanner
        title="Shop by Category"
        description="Explore a wide range of fresh and natural products from Sri Lankan farms."
        variant="categories"
      />
      <div className="container">
        <Breadcrumbs items={[{ label: 'Categories' }]} />
        <div className="between category-heading">
          <div>
            <h2>All Categories</h2>
            <p>Discover fresh, local and high-quality products from Sri Lankan farmers.</p>
          </div>
          <strong>{categories.length} Categories</strong>
        </div>
        <div className="category-grid reference-categories">
          {categories.map((name) => (
            <CategoryCard
              key={name}
              name={name}
              count={products.filter((p) => p.category === name && p.enabled && !p.draft).length}
            />
          ))}
        </div>
        <section className="season-popular">
          <div>
            <Star size={30} fill="#f3b42d" color="#e6a118" />
            <span>
              <h3>Popular This Season</h3>
              <p>Explore trending categories this month</p>
            </span>
          </div>
          {[
            ['Tomatoes', 'Tomato', images.tomato],
            ['Mangoes', 'Mango', images.mango],
            ['Cinnamon', 'Cinnamon', images.spices],
            ['Coconuts', 'Coconut', images.coconut],
            ['Rice', 'Rice', images.rice],
          ].map(([name, search, img]) => (
            <Link key={name} to={'/products?search=' + search}>
              <Img src={img} alt={name} />
              <span>
                <strong>{name}</strong>
                <small>
                  {
                    products.filter((p) => p.name.toLowerCase().includes(search.toLowerCase()))
                      .length
                  }{' '}
                  Products
                </small>
              </span>
            </Link>
          ))}
        </section>
        <section className="reference-cta category-cta">
          <div>
            <h2>Can’t find what you’re looking for?</h2>
            <p>Support local farmers and help build a healthier Sri Lanka.</p>
            <Link className="btn" to="/products">
              Explore All Products <ArrowRight size={16} />
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
