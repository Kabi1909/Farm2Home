import { Link } from 'react-router-dom';
import { MapPin, ArrowRight, Check } from 'lucide-react';
import { Img, RatingStars } from '../common/UI';
import { useMarket } from '../../context/AppContext';
export default function FarmerCard({ farmer: f }) {
  const { products } = useMarket();
  const listings = products.filter((p) => p.farmerId === f.id && p.enabled && !p.draft);
  const crops = [...new Set(listings.map((p) => p.category))].slice(0, 3);
  const portraitIndex = /^f\d+$/.test(f.id) ? (Number(f.id.slice(1)) - 1) % 8 : -1;
  return (
    <article className="farmer-card">
      <Link className="farmer-cover" to={'/farmers/' + f.id}>
        {portraitIndex >= 0 && !f.image?.startsWith('data:') ? (
          <div
            className="farmer-portrait"
            role="img"
            aria-label={f.name}
            style={{
              backgroundImage: 'url(/images/farmer-portraits.png)',
              backgroundSize: '400% 200%',
              backgroundPosition: `${(portraitIndex % 4) * (100 / 3)}% ${Math.floor(portraitIndex / 4) * 100}%`,
              width: '100%',
              aspectRatio: '1',
              transform: 'translateY(-12%)',
            }}
          />
        ) : (
          <Img src={f.image} alt={f.name} />
        )}
        <span className="badge green">
          <Check size={10} />
          Local grower
        </span>
      </Link>
      <div className="farmer-card-body">
        <h3>{f.farm || f.name}</h3>
        <span className="location">
          <MapPin size={11} />
          {f.district}, Sri Lanka
        </span>
        <div className="farmer-crops">
          {(crops.length ? crops : [f.crops || 'Seasonal produce']).map((crop) => (
            <span key={crop}>{crop}</span>
          ))}
        </div>
        <div className="between">
          <RatingStars rating={f.rating} />
          <span>{listings.length} products</span>
        </div>
        <Link className="btn secondary full small" to={'/farmers/' + f.id}>
          View Profile <ArrowRight size={13} />
        </Link>
      </div>
    </article>
  );
}
