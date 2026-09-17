import { Link } from 'react-router-dom';
import { Sprout, Handshake, Truck, ArrowRight } from 'lucide-react';
import { PageHeading, Img, SectionHeading } from '../../components/common/UI';
import { images } from '../../data/seed';
export default function About() {
  return (
    <main className="container page about-page">
      <PageHeading
        eyebrow="ROOTED IN SRI LANKA"
        title="Closer to the farm. Better for everyone."
        description="We believe the best food comes with a connection—to the land, to the season, and to the people who grow it."
      />
      <Img
        className="about-cover"
        src={images.farm}
        alt="Sunlight over a green agricultural landscape"
      />
      <div className="about-story">
        <span className="eyebrow">OUR STORY</span>
        <h2>Good food shouldn’t feel a world away.</h2>
        <p>
          Farm2Home LK brings Sri Lankan growers and households together in one welcoming
          marketplace. It’s a place where farmers can tell their story, set a fair price, and share
          their harvest directly with the people who enjoy it.
        </p>
        <p>
          For customers, that means more choice, a clearer picture of where food comes from, and a
          simple way to support local farming communities.
        </p>
      </div>
      <section id="how-it-works" className="section">
        <SectionHeading title="A fresher way forward" />
        <div className="how-grid">
          {[
            [
              Sprout,
              'Discover your local growers',
              'Browse by produce, district, growing method, and harvest availability.',
            ],
            [
              Handshake,
              'Choose what’s right for you',
              'Compare transparent prices, save favourites, and order directly from farmers.',
            ],
            [
              Truck,
              'Enjoy it your way',
              'Choose home delivery or farm pickup, and pay when you receive your order.',
            ],
          ].map(([Icon, title, text]) => (
            <div key={title}>
              <Icon size={30} />
              <h3>{title}</h3>
              <p>{text}</p>
            </div>
          ))}
        </div>
      </section>
      <div className="notice">
        <strong>A working frontend demonstration</strong>
        <p>
          All farmers, customers, orders, reviews, and marketplace prices are fictional. No orders,
          payments, emails, or AI requests are sent to a backend.
        </p>
      </div>
      <Link className="btn" to="/products">
        Meet your next fresh favourite <ArrowRight size={17} />
      </Link>
    </main>
  );
}
