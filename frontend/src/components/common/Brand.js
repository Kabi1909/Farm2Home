import { Link } from 'react-router-dom';
export default function Brand() {
  return (
    <Link to="/" className="brand" aria-label="Farm2Home LK home">
      <svg viewBox="0 0 54 60" aria-hidden="true">
        <path d="M25 55C21 31 25 15 48 4c2 24-6 38-23 51Z" fill="#3b8129" />
        <path d="M24 55C8 49 2 33 5 18c17 7 23 19 19 37Z" fill="#6ba143" />
        <path d="M25 56c3-19 14-24 27-24-4 17-13 24-27 24Z" fill="#538e32" />
        <path
          d="M24 56c1-17 9-34 19-43M24 56C20 40 13 29 8 24m17 31c8-11 14-15 22-19"
          stroke="#e7f0cd"
          strokeWidth="1.4"
          fill="none"
        />
      </svg>
      <span>
        <strong>Farm2Home LK</strong>
        <small>From Our Farms to Your Home</small>
      </span>
    </Link>
  );
}
