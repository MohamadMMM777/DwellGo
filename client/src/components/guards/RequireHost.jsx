import { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { UserContext } from '../../contexts/UserContext';

/**
 * Protects host-only routes (places management, host bookings).
 * Redirects non-hosts to /become-host or home.
 */
export default function RequireHost({ children }) {
    const { user, ready } = useContext(UserContext);

    if (!ready) return (
        <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ width: 36, height: 36, border: '2px solid #3b82f6', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
    );

    if (!user) return <Navigate to="/login" replace />;

    // Admin should not access host pages — send them to their admin dashboard
    if (user.role?.toUpperCase() === 'ADMIN') return <Navigate to="/admin" replace />;

    if (!user.isHost) return <Navigate to="/account" replace />;

    return children;
}
