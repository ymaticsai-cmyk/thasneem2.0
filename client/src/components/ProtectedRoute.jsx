import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const rolePath = {
  patient: '/dashboard/patient',
  doctor: '/dashboard/doctor',
  nurse: '/dashboard/nurse',
  receptionist: '/dashboard/receptionist',
};

export default function ProtectedRoute({ children, roles }) {
  const { isAuthenticated, loading, role } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 text-slate-500">
        Loading…
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (roles && roles.length && !roles.includes(role)) {
    return <Navigate to={rolePath[role] || '/login'} replace />;
  }

  return children;
}
