import { Link, useLocation, useNavigate } from "react-router-dom";
import { useContext, useEffect, useRef, useState } from "react";
import axios from "axios";
import { UserContext } from '../contexts/UserContext.jsx';
import { useTheme } from '../contexts/ThemeContext.jsx';
import { useSearch } from '../contexts/SearchContext.jsx';
import FilterDrawer from './FilterDrawer.jsx';
import NotificationsWidget from './NotificationsWidget.jsx';
import LanguageSwitcher from './LanguageSwitcher.jsx';
import { useTranslation } from 'react-i18next';
import {
    Search, Sun, Moon, Heart, Menu, User, Settings,
    Home, Calendar, MessageCircle, LogOut, Shield,
    X, ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Header() {
    const { user, setUser } = useContext(UserContext);
    const { isDark, toggleTheme } = useTheme();
    const { filterCity, setFilterCity, clearFilters, activeCount } = useSearch();
    const { t } = useTranslation();
    const location = useLocation();
    const navigate = useNavigate();
    const isHomePage = location.pathname === '/';

    const [quickSearch, setQuickSearch] = useState('');
    const [locations, setLocations] = useState({});
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const dropdownRef = useRef(null);

    useEffect(() => {
        axios.get('/locations').then(res => setLocations(res.data)).catch(() => { });
    }, []);

    useEffect(() => {
        setQuickSearch(filterCity || '');
    }, [filterCity]);

    useEffect(() => {
        function handleClick(e) {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                setDropdownOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, []);

    function handleQuickSearch(e) {
        e.preventDefault();
        if (!isHomePage) navigate('/');
        setFilterCity(quickSearch);
    }

    async function logout() {
        await axios.post('/logout');
        setUser(null);
        setDropdownOpen(false);
        navigate('/');
    }

    // Role checks — DB stores UPPERCASE, normalise here
    const isAdmin = user?.role?.toUpperCase() === 'ADMIN';
    const isHost  = user?.isHost === true && !isAdmin;

    // ADMIN menu — no booking, no wishlist, no chat
    const adminMenuItems = [
        { to: '/admin',   icon: Shield,   label: t('nav.adminDashboard'), highlight: true },
        { to: '/account', icon: Settings, label: t('nav.accountSettings') },
    ];

    // HOST menu — shows host-specific pages
    const hostMenuItems = [
        { to: '/account',               icon: Settings,       label: t('nav.profileAndSettings') },
        { to: `/user/${user?.id || user?._id}`, icon: User,   label: t('nav.myPublicProfile'), highlight: true },
        { to: '/account/places',        icon: Home,           label: t('nav.myListings') },
        { to: '/account/host-bookings', icon: Calendar,       label: t('nav.incomingBookings') },
        { to: '/account/bookings',      icon: Calendar,       label: t('nav.myTrips') },
        { to: '/account/messages',      icon: MessageCircle,  label: t('nav.messages') },
        { to: '/account/wishlist',      icon: Heart,          label: t('nav.wishlist') },
    ];

    // GUEST menu — no listing management
    const guestMenuItems = [
        { to: '/account',               icon: Settings,       label: t('nav.profileAndSettings') },
        { to: `/user/${user?.id || user?._id}`, icon: User,   label: t('nav.myProfile'), highlight: true },
        { to: '/account/bookings',      icon: Calendar,       label: t('nav.myTrips') },
        { to: '/account/wishlist',      icon: Heart,          label: t('nav.wishlist') },
        { to: '/account/messages',      icon: MessageCircle,  label: t('nav.messages') },
    ];

    const menuItems = isAdmin ? adminMenuItems : isHost ? hostMenuItems : guestMenuItems;

    return (
        <header className="sticky top-0 z-50 w-full backdrop-blur-xl border-b transition-all duration-300"
            style={{ background: 'var(--glass-bg)', borderColor: 'var(--border)' }}>
            <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between py-3 gap-4 md:gap-8">

                {/* Logo */}
                <Link to="/" className="flex items-center gap-2.5 group flex-shrink-0">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center shadow-primary bg-gradient-to-br from-primary-500 to-primary-700 p-2 group-hover:scale-105 group-hover:rotate-[-3deg] transition-all duration-300">
                        <img src="/logo.svg" alt="DwellGo" className="w-full h-full object-contain brightness-0 invert" />
                    </div>
                    <span className="font-heading font-extrabold text-xl tracking-tight hidden md:block" style={{ color: 'var(--on-surface)' }}>
                        Dwell<span className="text-primary-600 dark:text-primary-400">Go</span>
                    </span>
                </Link>

                {/* Search Bar + Filter Button */}
                <div className="flex-1 max-w-lg hidden sm:flex items-center gap-2">
                    <form onSubmit={handleQuickSearch}
                        className="flex-1 flex items-center rounded-full overflow-hidden transition-all duration-200 border"
                        style={{ background: 'var(--surface-2)', borderColor: 'var(--border)' }}>
                        <div className="flex items-center flex-1 px-4 py-2.5 gap-2.5">
                            <Search size={15} className="text-muted flex-shrink-0" />
                            <input
                                type="text"
                                className="flex-1 bg-transparent border-none outline-none text-sm font-medium placeholder:text-muted focus:ring-0 focus:outline-none"
                                style={{ margin: 0, padding: 0, color: 'var(--on-surface)', boxShadow: 'none' }}
                                placeholder={t('common.searchPlaceholder')}
                                value={quickSearch}
                                onChange={e => setQuickSearch(e.target.value)}
                            />
                            {activeCount > 0 && (
                                <button type="button" onClick={() => { clearFilters(); setQuickSearch(''); }}
                                    className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full text-primary-600 bg-primary-100 dark:bg-primary-900/30 dark:text-primary-400 hover:opacity-80 transition-opacity">
                                    <X size={11} />
                                    {activeCount}
                                </button>
                            )}
                        </div>
                    </form>
                    <FilterDrawer locations={locations} />
                </div>

                {/* Right Actions */}
                <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
                    {/* Language Switcher */}
                    <LanguageSwitcher />

                    {/* Theme Toggle */}
                    <button onClick={toggleTheme}
                        className="w-9 h-9 flex items-center justify-center rounded-full transition-all duration-200 hover:bg-[var(--surface-2)]"
                        style={{ color: 'var(--on-surface-2)' }}
                        title={isDark ? t('common.lightMode') : t('common.darkMode')}>
                        {isDark ? <Sun size={17} /> : <Moon size={17} />}
                    </button>

                    {/* Wishlist */}
                    {user && !isAdmin && (
                        <Link to="/account/wishlist"
                            className="w-9 h-9 hidden sm:flex items-center justify-center rounded-full transition-all duration-200 hover:bg-[var(--surface-2)]"
                            style={{ color: 'var(--on-surface-2)' }}
                            title={t('nav.wishlist')}>
                            <Heart size={17} />
                        </Link>
                    )}

                    {/* Notifications */}
                    {user && !isAdmin && <NotificationsWidget />}

                    {/* User Menu / Login */}
                    {user ? (
                        <div className="relative" ref={dropdownRef}>
                            <button onClick={() => setDropdownOpen(p => !p)}
                                className="flex items-center gap-2.5 rounded-full pl-3 pr-1 py-1 border transition-all duration-200 hover:shadow-card"
                                style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
                                <Menu size={15} style={{ color: 'var(--on-surface-2)' }} />
                                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center font-bold text-xs text-white shadow-sm uppercase">
                                    {user.name?.charAt(0) || '?'}
                                </div>
                            </button>

                            <AnimatePresence>
                                {dropdownOpen && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -8, scale: 0.97 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{ opacity: 0, y: -8, scale: 0.97 }}
                                        transition={{ duration: 0.18, ease: 'easeOut' }}
                                        className="absolute right-0 top-full mt-2 w-64 rounded-2xl shadow-2xl z-50 overflow-hidden border"
                                        style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>

                                        {/* Profile header */}
                                        <div className="px-5 py-4 border-b" style={{ background: 'var(--surface-2)', borderColor: 'var(--border)' }}>
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center font-bold text-base text-white uppercase">
                                                    {user.name?.charAt(0)}
                                                </div>
                                                <div className="overflow-hidden">
                                                    <p className="font-heading font-bold text-sm truncate" style={{ color: 'var(--on-surface)' }}>{user.name}</p>
                                                    <p className="text-xs truncate" style={{ color: 'var(--on-surface-2)' }}>{user.email}</p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Nav items */}
                                        <div className="p-2">
                                            {menuItems.map(({ to, icon: Icon, label, highlight }) => (
                                                <Link key={to} to={to} onClick={() => setDropdownOpen(false)}
                                                    className="flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 group"
                                                    style={{ color: highlight ? 'var(--primary-600)' : 'var(--on-surface-2)' }}
                                                    onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-2)'}
                                                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                                                    <div className="flex items-center gap-3">
                                                        <Icon size={15} />
                                                        {label}
                                                    </div>
                                                    <ChevronRight size={13} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                                                </Link>
                                            ))}
                                        </div>

                                        {/* Logout */}
                                        <div className="p-2 border-t" style={{ borderColor: 'var(--border)' }}>
                                            <button onClick={logout}
                                                className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium text-error-500 transition-all duration-150"
                                                onMouseEnter={e => e.currentTarget.style.background = 'var(--error-50)'}
                                                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                                                <LogOut size={15} />
                                                {t('common.logout')}
                                            </button>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    ) : (
                        <div className="flex items-center gap-2">
                            <Link to="/login"
                                className="text-sm font-semibold px-4 py-2 rounded-full transition-all hover:bg-[var(--surface-2)]"
                                style={{ color: 'var(--on-surface)' }}>
                                {t('common.login')}
                            </Link>
                            <Link to="/register"
                                className="text-sm font-semibold px-5 py-2 rounded-full bg-primary-600 text-white shadow-primary hover:bg-primary-700 hover:shadow-primary-lg active:scale-95 transition-all duration-200">
                                {t('common.register')}
                            </Link>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
}
