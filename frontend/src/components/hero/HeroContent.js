import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Search, MapPin } from 'lucide-react';
import { districts } from '../../data/seed';

export default function HeroContent() {
  const [search, setSearch] = useState('');
  const [district, setDistrict] = useState('');
  const navigate = useNavigate();
  function submit(event) {
    event.preventDefault();
    const query = new URLSearchParams();
    if (search.trim()) query.set('search', search.trim());
    if (district) query.set('district', district);
    navigate('/products?' + query);
  }
  return (
    <div className="cinematic-hero-content">
      <h1 data-hero-reveal>
        Fresh from Sri Lankan
        <br />
        Farms to Your Home
      </h1>
      <p data-hero-reveal>
        Discover fresh vegetables, fruits, rice, spices and locally grown produce directly from Sri
        Lankan farmers.
      </p>
      <form className="cinematic-hero-search" onSubmit={submit} data-hero-reveal>
        <Search size={20} aria-hidden="true" />
        <input
          aria-label="Search fresh produce"
          placeholder="What fresh produce are you looking for?"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
        <label>
          <MapPin size={18} aria-hidden="true" />
          <select
            aria-label="Select location"
            value={district}
            onChange={(event) => setDistrict(event.target.value)}
          >
            <option value="">Select Location</option>
            {districts.map((name) => (
              <option key={name}>{name}</option>
            ))}
          </select>
        </label>
        <button className="btn" type="submit">
          Search
        </button>
      </form>
      <div className="cinematic-hero-actions" data-hero-reveal>
        <Link className="btn" to="/products">
          Shop Fresh Produce <ArrowRight size={17} />
        </Link>
        <Link className="btn secondary" to="/register?role=farmer">
          Sell Your Harvest
        </Link>
      </div>
    </div>
  );
}
