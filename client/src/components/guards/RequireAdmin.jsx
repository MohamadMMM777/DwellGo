import { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { UserContext } from '../../contexts/UserContext';

/**
 * Protects admin-only routes.
 * Redirects non-admins to home page.
 */
export default function RequireAdmin({ children }) {
    const { user, ready } = useContext(UserContext);

    if (!ready) return (
        <div style={{ minHeight: '100vh', background: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ width: 40, height: 40, border: '2px solid #3b82f6', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
    );

    if (!user || user.role?.toUpperCase() !== 'ADMIN') {
        return <Navigate to="/" replace />;
    }

    return children;
}
