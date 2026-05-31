import { useContext } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { UserContext } from '../contexts/UserContext.jsx';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import {
    User, Home, Plus, Calendar, MessageCircle,
    Star, Star as StarOutline, Shield, LogOut, Crown,
    ChevronRight, BookOpen, Heart
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';

export default function AccountSidebar() {
    const { user, setUser } = useContext(UserContext);
    const { pathname } = useLocation();
    const navigate = useNavigate();
    const { t } = useTranslation();

    async function logout() {
        await axios.post('/logout');
        setUser(null);
        navigate('/');
    }

    async function handleBecomeHost() {
        try {
            await axios.post('/become-host');
            // Full page navigation — same as a manual refresh.
            // This guarantees /profile is re-fetched with isHost:true,
            // avoiding any React state-sync race with RequireHost.
            window.location.href = '/account/places/new';
        } catch (err) {
            toast.error(err.response?.data?.error || t('common.error'));
        }
    }

    function NavItem({ to, icon: Icon, label, exact = false, accent = false }) {
        const isActive = exact
            ? pathname === to || pathname === to + '/'
            : to !== '/account' && pathname.startsWith(to);
        const active = exact
            ? (pathname === '/account' || pathname === '/account/')
            : (!exact && to !== '/account' && pathname.startsWith(to));

        const finalActive = to === '/account' ? (pathname === '/account' || pathname === '/account/') : active;

        return (
            <Link to={to}
                className="flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 group relative"
                style={{
                    background: finalActive ? 'var(--primary-50)' : 'transparent',
                    color: finalActive ? 'var(--primary-700)' : accent ? 'var(--primary-600)' : 'var(--on-surface-2)',
                }}
                onMouseEnter={e => { if (!finalActive) e.currentTarget.style.background = 'var(--surface-2)'; }}
                onMouseLeave={e => { if (!finalActive) e.currentTarget.style.background = 'transparent'; }}>
                {finalActive && (
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-primary-600 rounded-r-full" />
                )}
                <div className="flex items-center gap-3">
                    <Icon size={15} />
                    <span>{label}</span>
                </div>
                {finalActive && <ChevronRight size={13} className="opacity-50" />}
            </Link>
        );
    }

    if (!user) return null;
    // Role checks — DB stores UPPERCASE
    const isAdmin = user.role?.toUpperCase() === 'ADMIN';
    const isHost  = user.isHost === true && !isAdmin;

    const roleLabel = isAdmin ? t('profile.roleAdmin') : isHost ? t('profile.roleHost') : t('profile.roleGuest');
    const roleBg    = isAdmin ? 'var(--warning-100)' : isHost ? 'var(--success-50)' : 'var(--primary-50)';
    const roleColor = isAdmin ? 'var(--warning-600)' : isHost ? 'var(--success-700)' : 'var(--primary-700)';

    return (
        <motion.aside
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="w-60 flex-shrink-0 flex flex-col border-r"
            style={{ background: 'var(--surface)', borderColor: 'var(--border)', minHeight: 'calc(100vh - 65px)' }}>

            {/* User Card */}
            <div className="p-4 border-b" style={{ borderColor: 'var(--border)' }}>
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl flex-shrink-0 flex items-center justify-center font-bold text-sm uppercase text-white bg-gradient-to-br from-primary-500 to-primary-700">
                        {user.name?.charAt(0) || '?'}
                    </div>
                    <div className="min-w-0">
                        <p className="font-heading font-bold text-sm truncate" style={{ color: 'var(--on-surface)' }}>{user.name}</p>
                        <p className="text-xs truncate" style={{ color: 'var(--on-surface-2)' }}>{user.email}</p>
                    </div>
                </div>
                <div className="mt-3">
                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full"
                        style={{ background: roleBg, color: roleColor }}>
                        {isAdmin ? <><Crown size={11} /> {roleLabel}</> : <><User size={11} /> {roleLabel}</>}
                    </span>
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 p-3 flex flex-col gap-0.5 overflow-y-auto">
                <NavItem to="/account" icon={User} label={t('nav.profile')} exact />

                {/* ── GUEST navigation ── */}
                {!isAdmin && !isHost && (
                    <>
                        <p className="text-xs font-semibold uppercase tracking-wider px-3.5 pt-4 pb-1.5" style={{ color: 'var(--on-surface-2)', opacity: 0.6 }}>{t('nav.activity')}</p>
                        <NavItem to="/account/bookings" icon={Calendar} label={t('nav.myTrips')} />
                        <NavItem to="/account/wishlist" icon={Heart} label={t('nav.wishlist')} />
                        <NavItem to="/account/messages" icon={MessageCircle} label={t('nav.messages')} />
                        <NavItem to="/account/my-reviews" icon={Star} label={t('nav.myReviews')} />
                        <p className="text-xs font-semibold uppercase tracking-wider px-3.5 pt-4 pb-1.5" style={{ color: 'var(--on-surface-2)', opacity: 0.6 }}>{t('nav.hosting')}</p>
                        <button onClick={handleBecomeHost}
                            className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 w-full text-left"
                            style={{ color: 'var(--primary-600)', background: 'var(--primary-50)' }}
                            onMouseEnter={e => e.currentTarget.style.opacity = '0.8'}
                            onMouseLeave={e => e.currentTarget.style.opacity = '1'}>
                            <Plus size={15} />
                            <span>{t('nav.becomeHost')}</span>
                        </button>
                    </>
                )}

                {/* ── HOST navigation ── */}
                {isHost && (
                    <>
                        <p className="text-xs font-semibold uppercase tracking-wider px-3.5 pt-4 pb-1.5" style={{ color: 'var(--on-surface-2)', opacity: 0.6 }}>{t('nav.hosting')}</p>
                        <NavItem to="/account/places" icon={Home} label={t('nav.myListings')} />
                        <Link to="/account/places/new"
                            className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-150"
                            style={{ color: 'var(--primary-600)', background: 'var(--primary-50)' }}
                            onMouseEnter={e => e.currentTarget.style.opacity = '0.8'}
                            onMouseLeave={e => e.currentTarget.style.opacity = '1'}>
                            <Plus size={15} />
                            <span>{t('nav.addNewListing')}</span>
                        </Link>
                        <NavItem to="/account/host-bookings" icon={BookOpen} label={t('nav.incomingBookings')} />
                        <NavItem to="/account/reviews-about-me" icon={StarOutline} label={t('nav.reviewsAboutMe')} />

                        <p className="text-xs font-semibold uppercase tracking-wider px-3.5 pt-4 pb-1.5" style={{ color: 'var(--on-surface-2)', opacity: 0.6 }}>{t('nav.travelling')}</p>
                        <NavItem to="/account/bookings" icon={Calendar} label={t('nav.myTrips')} />
                        <NavItem to="/account/wishlist" icon={Heart} label={t('nav.wishlist')} />
                        <NavItem to="/account/messages" icon={MessageCircle} label={t('nav.messages')} />
                        <NavItem to="/account/my-reviews" icon={Star} label={t('nav.reviewsIWrote')} />
                    </>
                )}

                {/* ── ADMIN navigation ── */}
                {isAdmin && (
                    <>
                        <p className="text-xs font-semibold uppercase tracking-wider px-3.5 pt-4 pb-1.5" style={{ color: 'var(--on-surface-2)', opacity: 0.6 }}>{t('nav.administration')}</p>
                        <NavItem to="/admin" icon={Shield} label={t('nav.adminDashboard')} accent />
                    </>
                )}
            </nav>

            {/* Logout */}
            <div className="p-3 border-t" style={{ borderColor: 'var(--border)' }}>
                <button onClick={logout}
                    className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 text-error-500"
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--error-50)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                    <LogOut size={15} />
                    {t('common.logout')}
                </button>
            </div>
        </motion.aside>
    );
}
