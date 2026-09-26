import { useRef, useState } from 'react';
import { NavLink, Outlet, Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  ShoppingBag,
  Heart,
  Package,
  User,
  Bell,
  BarChart3,
  Star,
  Sprout,
  ArrowUpRight,
  Menu,
  LogOut,
} from 'lucide-react';
import { useAuth, useNotifications } from '../context/AppContext';
import useCardEntrance from '../hooks/useCardEntrance';
export default function DashboardLayout() {
  const { user, logout } = useAuth();
  const { notifications } = useNotifications();
  const [open, setOpen] = useState(false);
  const shell = useRef(null);
  const { pathname } = useLocation();
  useCardEntrance(shell, pathname);
  const farmer = user.role === 'farmer';
  const links = farmer
    ? [
        ['dashboard', 'Overview', LayoutDashboard],
        ['products', 'My products', Sprout],
        ['orders', 'Orders', Package],
        ['analytics', 'Analytics', BarChart3],
        ['reviews', 'Reviews', Star],
        ['notifications', 'Notifications', Bell],
        ['profile', 'Farm profile', User],
      ]
    : [
        ['dashboard', 'Overview', LayoutDashboard],
        ['orders', 'My orders', Package],
        ['wishlist', 'My favourites', Heart],
        ['cart', 'My basket', ShoppingBag],
        ['notifications', 'Notifications', Bell],
        ['profile', 'My profile', User],
      ];
  return (
    <div className="container dashboard-shell" ref={shell}>
      <button
        className="dashboard-menu btn secondary"
        aria-expanded={open}
        aria-controls="dashboard-sidebar"
        onClick={() => setOpen(!open)}
      >
        <Menu size={17} /> Account menu
      </button>
      <aside id="dashboard-sidebar" className={'dashboard-sidebar ' + (open ? 'open' : '')}>
        <div className="dashboard-identity">
          <span className="initial-avatar">{user.name[0]}</span>
          <div>
            <strong>{user.name}</strong>
            <small>{farmer ? 'Your farmer workspace' : 'Your little corner of fresh'}</small>
          </div>
        </div>
        <span className="eyebrow">{farmer ? 'FARM MANAGEMENT' : 'MY ACCOUNT'}</span>
        <nav aria-label={farmer ? 'Farmer workspace' : 'Customer account'}>
          {links.map(([path, label, Icon]) => (
            <NavLink key={path} to={'/' + user.role + '/' + path} onClick={() => setOpen(false)}>
              <Icon size={18} />
              {label}
              {path === 'notifications' && notifications.some((n) => !n.read) && (
                <span className="sidebar-count">{notifications.filter((n) => !n.read).length}</span>
              )}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div>
            <Sprout size={26} />
            <strong>Good things grow together.</strong>
            <p>Thank you for being part of our farming community.</p>
          </div>
          <Link to="/products">
            Explore the marketplace
            <ArrowUpRight size={16} />
          </Link>
          <button onClick={logout}>
            <LogOut size={16} /> Sign out
          </button>
        </div>
      </aside>
      <main className="dashboard-content">
        <Outlet />
      </main>
    </div>
  );
}
