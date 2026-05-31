import AccountSidebar from './AccountSidebar.jsx';
import { Outlet, Navigate } from 'react-router-dom';
import { useContext } from "react";
import { UserContext } from '../contexts/UserContext.jsx';

export default function AccountLayout() {
    const { user, ready } = useContext(UserContext);

    if (!ready) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-10 h-10 border-3 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
                    <p className="text-sm" style={{ color: 'var(--on-surface-2)' }}>Yükleniyor...</p>
                </div>
            </div>
        );
    }

    if (ready && !user) {
        // Double check: if we are ready but user is null, it's a definite unauthorized access
        return <Navigate to="/login" replace />;
    }

    return (
        <div className="flex min-h-[calc(100vh-65px)]" style={{ background: 'var(--background)' }}>
            <AccountSidebar />
            <main className="flex-1 p-6 lg:p-8 overflow-auto">
                <Outlet />
            </main>
        </div>
    );
}
