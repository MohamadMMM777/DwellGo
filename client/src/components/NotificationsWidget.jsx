import { useState, useEffect, useRef, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { UserContext } from '../contexts/UserContext.jsx';
import {
    Bell, BellDot, CheckCheck, Calendar, MessageCircle,
    Info, Star, CheckCircle2, XCircle, Clock, Home, X
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { tr } from 'date-fns/locale';
import { motion, AnimatePresence } from 'framer-motion';

// ── Config per notification type ─────────────────────────────────────────────

const TYPE_CONFIG = {
    BOOKING_NEW: {
        icon: Calendar,
        color: '#6366f1',
        bg: 'rgba(99,102,241,0.12)',
        label: 'Yeni Rezervasyon',
    },
    BOOKING_APPROVED: {
        icon: CheckCircle2,
        color: '#10b981',
        bg: 'rgba(16,185,129,0.12)',
        label: 'Rezervasyon Onaylandı',
    },
    BOOKING_CONFIRMED: {
        icon: CheckCircle2,
        color: '#10b981',
        bg: 'rgba(16,185,129,0.12)',
        label: 'Ödeme Onaylandı',
    },
    BOOKING_CANCELLED: {
        icon: XCircle,
        color: '#ef4444',
        bg: 'rgba(239,68,68,0.12)',
        label: 'Rezervasyon İptal',
    },
    BOOKING_REJECTED: {
        icon: XCircle,
        color: '#ef4444',
        bg: 'rgba(239,68,68,0.12)',
        label: 'Rezervasyon Reddedildi',
    },
    BOOKING_COMPLETED: {
        icon: CheckCircle2,
        color: '#94a3b8',
        bg: 'rgba(148,163,184,0.12)',
        label: 'Konaklama Tamamlandı',
    },
    MESSAGE_NEW: {
        icon: MessageCircle,
        color: '#3b82f6',
        bg: 'rgba(59,130,246,0.12)',
        label: 'Yeni Mesaj',
    },
    REVIEW_NEW: {
        icon: Star,
        color: '#f59e0b',
        bg: 'rgba(245,158,11,0.12)',
        label: 'Yeni Yorum',
    },
    SYSTEM: {
        icon: Info,
        color: '#64748b',
        bg: 'rgba(100,116,139,0.12)',
        label: 'Sistem',
    },
};

const DEFAULT_CFG = TYPE_CONFIG.SYSTEM;

// ── Navigation helper ─────────────────────────────────────────────────────────

function getDestination(type, isHost) {
    switch (type) {
        case 'BOOKING_NEW':
            // Only hosts receive this — go to incoming bookings
            return '/account/host-bookings';

        case 'BOOKING_APPROVED':
        case 'BOOKING_CONFIRMED':
        case 'BOOKING_CANCELLED':
        case 'BOOKING_REJECTED':
        case 'BOOKING_COMPLETED':
            // Guests (and hosts acting as guests) go to their own trips
            return isHost ? '/account/host-bookings' : '/account/bookings';

        case 'MESSAGE_NEW':
            return '/account/messages';

        case 'REVIEW_NEW':
            return isHost ? '/account/reviews-about-me' : '/account/my-reviews';

        default:
            return null; // SYSTEM — no navigation
    }
}

// ── Component ────────────────────────────────────────────────────────────────

export default function NotificationsWidget() {
    const { user } = useContext(UserContext);
    const navigate = useNavigate();
    const [notifications, setNotifications] = useState([]);
    const [open, setOpen] = useState(false);
    const dropdownRef = useRef(null);

    const isHost = user?.isHost === true && user?.role?.toUpperCase() !== 'ADMIN';

    // ── Data fetching ──────────────────────────────────────────────────────────

    const fetchNotifications = async () => {
        try {
            const { data, status } = await axios.get('/notifications', {
                validateStatus: s => s < 500,
            });
            if (status === 200 && Array.isArray(data)) setNotifications(data);
        } catch { /* network error — ignore */ }
    };

    useEffect(() => {
        fetchNotifications();
        const interval = setInterval(fetchNotifications, 20000);
        return () => clearInterval(interval);
    }, []);

    // Close on outside click
    useEffect(() => {
        function handleClickOutside(e) {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                setOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // ── Actions ────────────────────────────────────────────────────────────────

    const markAsRead = async (id) => {
        try {
            await axios.put(`/notifications/${id}/read`, {}, { validateStatus: s => s < 500 });
            setNotifications(prev => prev.map(n =>
                (n._id === id || n.id === id) ? { ...n, isRead: true } : n
            ));
        } catch { }
    };

    const markAllAsRead = async () => {
        try {
            await axios.put('/notifications/read-all', {}, { validateStatus: s => s < 500 });
            setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
        } catch { }
    };

    const handleNotifClick = async (notif) => {
        // Mark as read
        if (!notif.isRead) {
            await markAsRead(notif._id || notif.id);
        }
        // Navigate to destination
        const dest = getDestination(notif.type, isHost);
        if (dest) {
            setOpen(false);
            navigate(dest);
        }
    };

    // ── Derived values ─────────────────────────────────────────────────────────

    const unreadCount = notifications.filter(n => !n.isRead).length;
    const recent = notifications.slice(0, 20); // cap at 20

    // ── Render ─────────────────────────────────────────────────────────────────

    return (
        <div className="relative hidden sm:block" ref={dropdownRef}>

            {/* Bell button */}
            <button
                onClick={() => setOpen(p => !p)}
                className="relative w-9 h-9 flex items-center justify-center rounded-full transition-all duration-200"
                style={{ color: open ? 'var(--primary-600)' : 'var(--on-surface-2)', background: open ? 'var(--primary-50)' : 'transparent' }}
                title="Bildirimler">
                {unreadCount > 0
                    ? <BellDot size={17} style={{ color: 'var(--primary-600)' }} />
                    : <Bell size={17} />}
                {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center rounded-full text-[10px] font-black text-white px-1"
                        style={{ background: '#ef4444', lineHeight: 1 }}>
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {/* Dropdown */}
            <AnimatePresence>
                {open && (
                    <motion.div
                        initial={{ opacity: 0, y: -8, scale: 0.96 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -8, scale: 0.96 }}
                        transition={{ duration: 0.15, ease: 'easeOut' }}
                        className="absolute right-0 top-full mt-2.5 w-[360px] rounded-2xl shadow-2xl z-50 overflow-hidden border"
                        style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>

                        {/* Header */}
                        <div className="flex items-center justify-between px-4 py-3.5 border-b"
                            style={{ borderColor: 'var(--border)', background: 'var(--surface-2)' }}>
                            <div className="flex items-center gap-2.5">
                                <div className="w-7 h-7 rounded-lg flex items-center justify-center"
                                    style={{ background: 'rgba(99,102,241,0.12)' }}>
                                    <Bell size={13} style={{ color: '#6366f1' }} />
                                </div>
                                <span className="font-heading font-bold text-sm" style={{ color: 'var(--on-surface)' }}>
                                    Bildirimler
                                </span>
                                {unreadCount > 0 && (
                                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-full"
                                        style={{ background: 'rgba(99,102,241,0.15)', color: '#818cf8' }}>
                                        {unreadCount} yeni
                                    </span>
                                )}
                            </div>
                            <div className="flex items-center gap-1">
                                {unreadCount > 0 && (
                                    <button
                                        onClick={markAllAsRead}
                                        className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg transition-colors"
                                        style={{ color: 'var(--primary-600)', background: 'var(--primary-50)' }}
                                        title="Tümünü okundu işaretle">
                                        <CheckCheck size={11} />
                                        Tümü
                                    </button>
                                )}
                                <button
                                    onClick={() => setOpen(false)}
                                    className="w-7 h-7 flex items-center justify-center rounded-lg transition-colors"
                                    style={{ color: 'var(--on-surface-2)' }}
                                    onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-2)'}
                                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                                    <X size={13} />
                                </button>
                            </div>
                        </div>

                        {/* Notification list */}
                        <div className="overflow-y-auto" style={{ maxHeight: '420px' }}>
                            {recent.length === 0 ? (
                                /* Empty state */
                                <div className="py-14 text-center px-6">
                                    <div className="w-14 h-14 rounded-2xl mx-auto mb-4 flex items-center justify-center"
                                        style={{ background: 'var(--surface-2)' }}>
                                        <Bell size={24} style={{ color: 'var(--on-surface-2)', opacity: 0.4 }} />
                                    </div>
                                    <p className="font-semibold text-sm mb-1" style={{ color: 'var(--on-surface)' }}>
                                        Bildirim yok
                                    </p>
                                    <p className="text-xs" style={{ color: 'var(--on-surface-2)' }}>
                                        Yeni bir etkinlik olduğunda burada görünür
                                    </p>
                                </div>
                            ) : (
                                recent.map((notif, idx) => {
                                    const cfg = TYPE_CONFIG[notif.type] || DEFAULT_CFG;
                                    const Icon = cfg.icon;
                                    const dest = getDestination(notif.type, isHost);
                                    const isClickable = !!dest;
                                    const timeStr = (() => {
                                        try {
                                            return formatDistanceToNow(new Date(notif.createdAt), {
                                                addSuffix: true,
                                                locale: tr
                                            });
                                        } catch { return ''; }
                                    })();

                                    return (
                                        <div
                                            key={notif._id || notif.id}
                                            onClick={() => handleNotifClick(notif)}
                                            className="flex gap-3 px-4 py-3.5 transition-all border-b last:border-b-0"
                                            style={{
                                                borderColor: 'var(--border)',
                                                cursor: isClickable ? 'pointer' : 'default',
                                                background: notif.isRead ? 'transparent' : 'rgba(99,102,241,0.04)',
                                                borderLeft: notif.isRead ? 'none' : '3px solid #6366f1',
                                            }}
                                            onMouseEnter={e => { if (isClickable) e.currentTarget.style.background = 'var(--surface-2)'; }}
                                            onMouseLeave={e => { e.currentTarget.style.background = notif.isRead ? 'transparent' : 'rgba(99,102,241,0.04)'; }}>

                                            {/* Icon */}
                                            <div className="flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center mt-0.5"
                                                style={{ background: cfg.bg }}>
                                                <Icon size={15} style={{ color: cfg.color }} />
                                            </div>

                                            {/* Content */}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-start justify-between gap-2 mb-0.5">
                                                    <p className="text-xs font-bold leading-snug"
                                                        style={{ color: 'var(--on-surface)' }}>
                                                        {cfg.label}
                                                    </p>
                                                    {!notif.isRead && (
                                                        <span className="flex-shrink-0 w-2 h-2 rounded-full mt-1"
                                                            style={{ background: '#6366f1' }} />
                                                    )}
                                                </div>
                                                <p className="text-xs leading-relaxed"
                                                    style={{ color: 'var(--on-surface-2)' }}>
                                                    {notif.message}
                                                </p>
                                                {timeStr && (
                                                    <p className="text-[10px] mt-1.5"
                                                        style={{ color: 'var(--on-surface-2)', opacity: 0.7 }}>
                                                        {timeStr}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>

                        {/* Footer */}
                        {recent.length > 0 && (
                            <div className="px-4 py-2.5 border-t text-center"
                                style={{ borderColor: 'var(--border)', background: 'var(--surface-2)' }}>
                                <p className="text-xs" style={{ color: 'var(--on-surface-2)' }}>
                                    Son {recent.length} bildirim gösteriliyor
                                </p>
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
