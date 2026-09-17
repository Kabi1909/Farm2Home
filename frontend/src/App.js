import { Component, Suspense, lazy, useEffect } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import StoreLayout from './layouts/StoreLayout';
import DashboardLayout from './layouts/DashboardLayout';
import { ProtectedRoute, RoleRoute } from './components/common/RouteGuards';
import { EmptyState, LoadingSpinner } from './components/common/UI';
import Home from './pages/public/Home';
const Shop = lazy(() => import('./pages/public/Shop'));
const Categories = lazy(() =>
  import('./pages/public/Shop').then((m) => ({ default: m.Categories })),
);
const ProductDetails = lazy(() => import('./pages/public/ProductDetails'));
const Farmers = lazy(() => import('./pages/public/Farmers').then((m) => ({ default: m.Farmers })));
const FarmerProfile = lazy(() =>
  import('./pages/public/Farmers').then((m) => ({ default: m.FarmerProfile })),
);
const Auth = lazy(() => import('./pages/public/Auth'));
const About = lazy(() => import('./pages/public/About'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Analytics = lazy(() => import('./pages/Dashboard').then((m) => ({ default: m.Analytics })));
const Profile = lazy(() => import('./pages/Profile'));
const Notifications = lazy(() => import('./pages/Notifications'));
const Orders = lazy(() => import('./pages/customer/Orders'));
const OrderDetails = lazy(() =>
  import('./pages/customer/Orders').then((m) => ({ default: m.OrderDetails })),
);
const shopping = (name) =>
  lazy(() => import('./pages/customer/Shopping').then((m) => ({ default: m[name] })));
const Cart = shopping('Cart'),
  Checkout = shopping('Checkout'),
  Wishlist = shopping('Wishlist'),
  OrderSuccess = shopping('OrderSuccess');
const Products = lazy(() => import('./pages/farmer/Products'));
const ProductForm = lazy(() => import('./pages/farmer/ProductForm'));
const Reviews = lazy(() => import('./pages/farmer/Reviews'));
class ErrorBoundary extends Component {
  state = { error: null };
  static getDerivedStateFromError(error) {
    return { error };
  }
  render() {
    return this.state.error ? (
      <div className="empty-state">
        <h1>Something didn’t load.</h1>
        <p>Please try again. Your saved marketplace data is still in your browser.</p>
        <button className="btn" onClick={() => window.location.reload()}>
          Retry
        </button>
      </div>
    ) : (
      this.props.children
    );
  }
}
function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
    document.title =
      'Farm2Home LK · ' +
      (pathname === '/'
        ? 'Fresh from the farm'
        : pathname.split('/').filter(Boolean).pop().replaceAll('-', ' '));
  }, [pathname]);
  return null;
}
export default function App() {
  return (
    <ErrorBoundary>
      <ScrollToTop />
      <Suspense fallback={<LoadingSpinner />}>
        <Routes>
          <Route element={<StoreLayout />}>
            <Route index element={<Home />} />
            <Route path="products" element={<Shop />} />
            <Route path="products/:id" element={<ProductDetails />} />
            <Route path="farmers" element={<Farmers />} />
            <Route path="farmers/:id" element={<FarmerProfile />} />
            <Route path="categories" element={<Categories />} />
            <Route path="about" element={<About />} />
            {['login', 'register', 'forgot-password', 'reset-password'].map((mode) => (
              <Route key={mode} path={mode} element={<Auth mode={mode} />} />
            ))}
            <Route element={<ProtectedRoute />}>
              {['customer', 'farmer'].map((role) => (
                <Route key={role} element={<RoleRoute role={role} />}>
                  <Route path={role} element={<DashboardLayout />}>
                    <Route path="dashboard" element={<Dashboard />} />
                    <Route path="profile" element={<Profile />} />
                    <Route path="orders" element={<Orders />} />
                    <Route path="orders/:id" element={<OrderDetails />} />
                    <Route path="notifications" element={<Notifications />} />
                    {role === 'customer' ? (
                      <>
                        <Route path="cart" element={<Cart />} />
                        <Route path="wishlist" element={<Wishlist />} />
                        <Route path="checkout" element={<Checkout />} />
                        <Route path="order-success" element={<OrderSuccess />} />
                      </>
                    ) : (
                      <>
                        <Route path="products" element={<Products />} />
                        <Route path="products/new" element={<ProductForm />} />
                        <Route path="products/:id/edit" element={<ProductForm />} />
                        <Route path="reviews" element={<Reviews />} />
                        <Route path="analytics" element={<Analytics />} />
                      </>
                    )}
                  </Route>
                </Route>
              ))}
            </Route>
            <Route
              path="unauthorized"
              element={
                <EmptyState
                  title="This space belongs to a different role."
                  description="Sign in with the right account to continue."
                  to="/login"
                  label="Sign in"
                />
              }
            />
            <Route
              path="*"
              element={
                <EmptyState
                  title="This path hasn’t been planted yet."
                  description="We couldn’t find that page. Let’s get you back to something fresh."
                  to="/"
                  label="Back to home"
                />
              }
            />
          </Route>
        </Routes>
      </Suspense>
    </ErrorBoundary>
  );
}
