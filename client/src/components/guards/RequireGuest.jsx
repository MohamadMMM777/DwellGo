import { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { UserContext } from '../../contexts/UserContext';

/**
 * Blocks ADMIN users from guest-only actions (booking, payment, wishlist).
 */
export default function RequireGuest({ children }) {
    const { user, ready } = useContext(UserContext);

    if (!ready) return null;

    if (!user) return <Navigate to="/login" replace />;

    if (user.role?.toUpperCase() === 'ADMIN') {
        return <Navigate to="/" replace />;
    }

    return children;
}
