import { useState } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  Sprout,
  Heart,
  ShoppingCart,
  Search,
  Menu,
  X,
  ChevronDown,
  Globe,
  MapPin,
  Truck,
  Bell,
  LogOut,
  ArrowRight,
  Leaf,
} from 'lucide-react';
import { useAuth, useCart, useWishlist, useNotifications, useUI } from '../context/AppContext';
import Brand from '../components/common/Brand';

export function NotificationDropdown() {
  const [open, setOpen] = useState(false);
  const { notifications, markRead } = useNotifications();
  const { user } = useAuth();
  return (
    <div className="notification-wrap">
      <button
        className="icon-btn"
        aria-label="Notifications"
        aria-expanded={open}
        onClick={() => setOpen(!open)}
      >
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
  const [open, setOpen] = useState(false),
    [accountOpen, setAccountOpen] = useState(false),
    [search, setSearch] = useState('');
  const navigate = useNavigate();
  const links = [
    ['/', 'Home'],
    ['/products', 'Shop'],
    ['/farmers', 'Farmers'],
    ['/categories', 'Categories'],
    ['/about', 'About'],
    ['/contact', 'Contact'],
  ];
  return (
    <>
      <div className="announcement">
        <div className="container">
          <span>
            <Sprout size={14} />
            Supporting Sri Lankan Farmers
          </span>
          <span>
            <Truck size={15} />
            Islandwide Delivery
          </span>
          <span>
            <Leaf size={14} />
            Fresh & Healthy Food
          </span>
          <span className="top-locale">
            <Globe size={14} />
            EN <ChevronDown size={11} />
            <i />
            <MapPin size={14} />
            Sri Lanka
          </span>
        </div>
      </div>
      <header className="navbar">
        <div className="container nav-inner">
          <Brand />
          <nav className="desktop-nav">
            {links.map(([to, label]) => (
              <NavLink key={to} to={to} end={to === '/'}>
                {label}
              </NavLink>
            ))}
          </nav>
          <form
            className="nav-search"
            onSubmit={(e) => {
              e.preventDefault();
              navigate('/products?search=' + encodeURIComponent(search));
            }}
          >
            <Search size={18} />
            <input
              aria-label="Search the marketplace"
              placeholder="Search products, farmers or locations..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <button aria-label="Submit marketplace search">
              <Search size={17} />
            </button>
          </form>
          <div className="nav-actions">
            {user?.role !== 'farmer' && (
              <>
                <Link to="/customer/wishlist" aria-label="Wishlist" className="icon-btn">
                  <Heart size={22} />
                  {wishlist.length > 0 && <span className="count">{wishlist.length}</span>}
                </Link>
                <Link
                  to="/customer/cart"
                  aria-label="Shopping cart"
                  className="icon-btn"
                  data-cart-target="navbar-cart"
                >
                  <ShoppingCart size={24} />
                  {cart.length > 0 && (
                    <span className="count" data-cart-badge aria-live="polite" aria-atomic="true">
                      {cart.reduce((s, c) => s + c.quantity, 0)}
                    </span>
                  )}
                </Link>
              </>
            )}
            {user ? (
              <>
                <NotificationDropdown />
                <div className="account-menu">
                  <button
                    className="account-trigger"
                    onClick={() => setAccountOpen(!accountOpen)}
                    aria-expanded={accountOpen}
                  >
                    <span className="initial-avatar">{user.name[0]}</span>
                    <span>
                      <strong>Hello, {user.name.split(' ')[0]}</strong>
                      <small>{user.role}</small>
                    </span>
                    <ChevronDown size={14} />
                  </button>
                  {accountOpen && (
                    <div className="account-popover">
                      <Link
                        to={'/' + user.role + '/dashboard'}
                        onClick={() => setAccountOpen(false)}
                      >
                        My dashboard
                      </Link>
                      <Link to={'/' + user.role + '/profile'} onClick={() => setAccountOpen(false)}>
                        My profile
                      </Link>
                      <button
                        onClick={() => {
                          logout();
                          setAccountOpen(false);
                          navigate('/');
                        }}
                      >
                        <LogOut size={15} />
                        Sign out
                      </button>
                    </div>
                  )}
                </div>
                <button
                  className="icon-btn signout-desktop"
                  aria-label="Sign out"
                  onClick={() => {
                    logout();
                    navigate('/');
                  }}
                >
                  <LogOut size={16} />
                </button>
              </>
            ) : (
              <>
                <Link className="btn secondary small nav-auth" to="/login">
                  Login
                </Link>
                <Link className="btn small nav-auth" to="/register">
                  Register
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
            {links.map(([to, label]) => (
              <Link key={to} to={to}>
                {label}
              </Link>
            ))}
            <Link to={user ? '/' + user.role + '/dashboard' : '/login'}>
              {user ? 'My dashboard' : 'Login'}
            </Link>
            {!user && <Link to="/register">Register</Link>}
            {user && <button onClick={logout}>Sign out</button>}
          </nav>
        )}
      </header>
    </>
  );
}
export function Footer() {
  const { notify } = useUI();
  return (
    <footer className="reference-footer">
      <div className="container footer-grid">
        <div>
          <Brand />
        </div>
        <div>
          <h4>Quick Links</h4>
          <Link to="/">Home</Link>
          <Link to="/products">Shop</Link>
          <Link to="/farmers">Farmers</Link>
          <Link to="/categories">Categories</Link>
        </div>
        <div>
          <h4>Customer Care</h4>
          <Link to="/about">About Us</Link>
          <Link to="/contact">Contact</Link>
          <Link to="/contact#faq">FAQs</Link>
          <Link to="/contact#delivery">Shipping & Delivery</Link>
        </div>
        <div>
          <h4>Our Mission</h4>
          <p>
            To connect Sri Lankan farmers with customers and promote a healthier, more sustainable
            future.
          </p>
        </div>
        <div>
          <h4>Stay Connected</h4>
          <Link to="/contact">Talk to our community</Link>
          <Link to="/register?role=farmer">Become a farmer</Link>
          <span className="footer-badge">
            <Leaf size={13} />
            Support local farmers
          </span>
        </div>
        <div>
          <h4>Subscribe to Our Newsletter</h4>
          <p>Newsletter subscriptions are not available yet.</p>
          <form
            className="footer-subscribe"
            onSubmit={(e) => {
              e.preventDefault();
            }}
          >
            <input
              disabled
              name="email"
              type="email"
              required
              aria-label="Newsletter email"
              placeholder="Your email address"
            />
            <button className="btn small" disabled>
              Subscribe
            </button>
          </form>
        </div>
      </div>
      <div className="container footer-bottom">
        <span>© {new Date().getFullYear()} Farm2Home LK. All rights reserved.</span>
        <span>Fresh Food　•　Local Farmers　•　A Healthier Sri Lanka</span>
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
