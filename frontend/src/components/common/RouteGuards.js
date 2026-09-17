import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AppContext';
export function ProtectedRoute() {
  const { user } = useAuth();
  const location = useLocation();
  return user ? <Outlet /> : <Navigate to="/login" state={{ from: location.pathname }} replace />;
}
export function RoleRoute({ role }) {
  const { user } = useAuth();
  return user?.role === role ? <Outlet /> : <Navigate to="/unauthorized" replace />;
}
