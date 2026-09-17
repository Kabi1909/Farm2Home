import { useState } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  Sprout,
  Heart,
  ShoppingBag,
  Search,
  Menu,
  X,
  ChevronDown,
  ArrowUpRight,
  MapPin,
  Truck,
  Bell,
  LogOut,
  User,
  Instagram,
  Facebook,
  ArrowRight,
} from 'lucide-react';
import { useAuth, useCart, useWishlist, useNotifications, useUI } from '../context/AppContext';
export function NotificationDropdown() {
  const [open, setOpen] = useState(false);
  const { notifications, markRead } = useNotifications();
  const { user } = useAuth();
  return (
    <div className="notification-wrap">
      <button className="icon-btn" aria-label="Notifications" onClick={() => setOpen(!open)}>
        <Bell size={20} />
        {notifications.some((n) => !n.read) && (
          <span className="count">{notifications.filter((n) => !n.read).length}</span>
        )}
      </button>
      {open && (
        <div className="notification-popover">
          <div className="between">
            <strong>Notifications</strong>
            <button onClick={() => markRead('all')}>Read all</button>
          </div>
          {notifications.slice(0, 3).map((n) => (
            <Link
              to={n.path}
              key={n.id}
              onClick={() => {
                markRead(n.id);
                setOpen(false);
              }}
            >
              <strong>
                {!n.read ? '• ' : ''}
                {n.title}
              </strong>
              <small>{n.message}</small>
            </Link>
          ))}
          {!notifications.length && <p>You’re all caught up.</p>}
          <Link to={'/' + user.role + '/notifications'} onClick={() => setOpen(false)}>
            View all notifications <ArrowRight size={14} />
          </Link>
        </div>
      )}
    </div>
  );
}
export function Navbar() {
  const { user, logout } = useAuth();
  const { cart } = useCart();
  const { wishlist } = useWishlist();
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  return (
    <>
      <div className="announcement">
        <span>
          <Sprout size={13} /> Rooted in Sri Lanka. Delivered with care.
        </span>
        <span>
          <Truck size={14} /> Fresh from local farms to your doorstep{' '}
          <span className="divider">|</span>
          <Link to="/register?role=farmer">
            Become a farmer <ArrowUpRight size={12} />
          </Link>
        </span>
      </div>
      <header className="navbar">
        <div className="container nav-inner">
          <Link to="/" className="logo">
            <span className="logo-icon">
              <Sprout size={28} />
            </span>
            Farm2Home<span className="lk">LK</span>
          </Link>
          <nav className="desktop-nav">
            {[
              ['/', 'Home'],
              ['/products', 'Shop'],
              ['/farmers', 'Our Farmers'],
              ['/categories', 'Categories'],
              ['/about', 'Our Story'],
            ].map(([to, label]) => (
              <NavLink key={to} to={to} end={to === '/'}>
                {label}
              </NavLink>
            ))}
          </nav>
          <div className="nav-actions">
            <Link to="/products" aria-label="Search products" className="icon-btn">
              <Search size={20} />
            </Link>
            {user?.role !== 'farmer' && (
              <>
                <Link to="/customer/wishlist" aria-label="Wishlist" className="icon-btn">
                  <Heart size={20} />
                  {wishlist.length > 0 && <span className="count">{wishlist.length}</span>}
                </Link>
                <Link to="/customer/cart" aria-label="Shopping cart" className="icon-btn">
                  <ShoppingBag size={20} />
                  {cart.length > 0 && (
                    <span className="count">{cart.reduce((s, c) => s + c.quantity, 0)}</span>
                  )}
                </Link>
              </>
            )}
            {user ? (
              <>
                <NotificationDropdown />
                <Link className="btn small nav-auth" to={'/' + user.role + '/dashboard'}>
                  {user.name.split(' ')[0]}
                  <User size={15} />
                </Link>
                <button
                  className="icon-btn desktop-only"
                  aria-label="Sign out"
                  onClick={() => {
                    logout();
                    navigate('/');
                  }}
                >
                  <LogOut size={18} />
                </button>
              </>
            ) : (
              <>
                <Link className="login-link" to="/login">
                  Log in
                </Link>
                <Link className="btn small nav-auth" to="/register">
                  Join the community <ArrowUpRight size={15} />
                </Link>
              </>
            )}
            <button
              className="icon-btn menu-btn"
              aria-label="Toggle menu"
              aria-expanded={open}
              onClick={() => setOpen(!open)}
            >
              {open ? <X /> : <Menu />}
            </button>
          </div>
        </div>
        {open && (
          <nav className="mobile-nav" onClick={() => setOpen(false)}>
            {[
              ['/', 'Home'],
              ['/products', 'Shop'],
              ['/farmers', 'Our Farmers'],
              ['/categories', 'Categories'],
              ['/about', 'Our Story'],
              [user ? '/' + user.role + '/dashboard' : '/login', user ? 'Dashboard' : 'Log in'],
            ].map(([to, label]) => (
              <Link key={to} to={to}>
                {label}
              </Link>
            ))}
            {user && <button onClick={logout}>Sign out</button>}
          </nav>
        )}
      </header>
    </>
  );
}
export function Footer() {
  return (
    <footer>
      <div className="container footer-grid">
        <div>
          <Link to="/" className="logo">
            <Sprout size={29} />
            Farm2Home<span>LK</span>
          </Link>
          <p>
            Fresh food. Fair prices. Stronger communities.
            <br />
            Bringing the goodness of Sri Lankan farms
            <br />
            closer to your home.
          </p>
          <div className="socials">
            <span aria-label="Sri Lankan community">
              <Sprout size={18} />
            </span>
            <span>Grown locally. Loved everywhere.</span>
          </div>
        </div>
        <div>
          <h4>Explore</h4>
          <Link to="/products">Shop all produce</Link>
          <Link to="/categories">Shop by category</Link>
          <Link to="/farmers">Meet our farmers</Link>
          <Link to="/products?availability=Upcoming+Harvest">Seasonal harvest</Link>
        </div>
        <div>
          <h4>Our community</h4>
          <Link to="/about">Our story</Link>
          <Link to="/register?role=farmer">Become a farmer</Link>
          <Link to="/about#how-it-works">How it works</Link>
          <Link to="/login">My account</Link>
        </div>
        <div>
          <h4>Made for Sri Lanka</h4>
          <p>
            <MapPin size={15} /> Connecting all 25 districts
          </p>
          <p>
            <Truck size={15} /> Home delivery & farm pickup
          </p>
          <span className="footer-badge">
            <Sprout size={15} /> Support local. Grow together.
          </span>
        </div>
      </div>
      <div className="container footer-bottom">
        <span>© {new Date().getFullYear()} Farm2Home LK. All rights reserved.</span>
        <span>A frontend demonstration • All marketplace data is fictional</span>
        <span>Made with care in Sri Lanka 🇱🇰</span>
      </div>
    </footer>
  );
}
export default function StoreLayout() {
  return (
    <>
      <a href="#main" className="skip-link">
        Skip to content
      </a>
      <Navbar />
      <div id="main">
        <Outlet />
      </div>
      <Footer />
    </>
  );
}
