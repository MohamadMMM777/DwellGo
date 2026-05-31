import { Link, useLocation } from "react-router-dom";
import { useContext } from "react";
import { UserContext } from '../contexts/UserContext.jsx';

export default function AccountNav() {
    const { user } = useContext(UserContext);
    const { pathname } = useLocation();
    let subpage = pathname.split('/')?.[2];
    if (subpage === undefined) {
        subpage = 'profile';
    }

    function linkClasses(type = null) {
        let classes = 'flex items-center gap-2 px-6 py-2.5 rounded-full transition-all duration-300 text-sm font-black uppercase tracking-widest ';
        if (type === subpage) {
            return classes + 'bg-primary-600 text-white shadow-lg shadow-primary-500/30 active:scale-95';
        } else {
            return classes + 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 active:scale-95';
        }
    }

    return (
        <nav className="w-full flex justify-center mt-4 mb-12 gap-3 flex-wrap animate-fadeIn">
            <Link className={linkClasses('profile')} to={'/account'}>
                <span className="text-lg">👤</span>
                Profil
            </Link>
            <Link className={linkClasses('bookings')} to={'/account/bookings'}>
                <span className="text-lg">📅</span>
                Rezervasyonlar
            </Link>
            <Link className={linkClasses('wishlist')} to={'/account/wishlist'}>
                <span className="text-lg">❤️</span>
                Favoriler
            </Link>
            <Link className={linkClasses('places')} to={'/account/places'}>
                <span className="text-lg">🏠</span>
                İlanlarım
            </Link>
            {!!user && user.role?.toLowerCase() !== 'admin' && (
                <Link className={linkClasses('messages')} to={'/account/messages'}>
                    <span className="text-lg">💬</span>
                    Mesajlar
                </Link>
            )}
        </nav>
    );
}
