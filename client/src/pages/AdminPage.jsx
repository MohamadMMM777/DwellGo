import { useContext, useEffect, useState, useRef } from "react";
import { Navigate, Link } from "react-router-dom";
import axios from "axios";
import { UserContext } from '../contexts/UserContext.jsx';
import { toast } from "react-hot-toast";
import { useTranslation } from 'react-i18next';
import { useConfirm } from '../contexts/ConfirmContext.jsx';
import { BarChart3, Users, Home, Calendar, MessageCircle, Settings, Shield, ArrowLeft, Trash2, Star, Lock, TrendingUp, UserCheck, Search, X, Eye, ChevronRight } from 'lucide-react';

export default function AdminPage() {
    const { user, ready } = useContext(UserContext);
    const { t } = useTranslation();
    const confirm = useConfirm();
    const [activeTab, setActiveTab] = useState('overview');
    const [users, setUsers] = useState([]);
    const [places, setPlaces] = useState([]);
    const [bookings, setBookings] = useState([]);
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState(null);
    const [oldPassword, setOldPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [passwordLoading, setPasswordLoading] = useState(false);

    // Search state
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState(null);
    const [searching, setSearching] = useState(false);
    const searchTimeout = useRef(null);

    // Place bookings modal
    const [placeBookingsModal, setPlaceBookingsModal] = useState(null); // { place, bookings }
    const [loadingPlaceBookings, setLoadingPlaceBookings] = useState(false);

    useEffect(() => {
        if (!ready || !user || user.role?.toUpperCase() !== 'ADMIN') return;
        fetchAllData();
    }, [ready, user]);

    async function fetchAllData() {
        setLoading(true);
        const safe = (promise) => promise.catch(() => ({ data: null }));
        const [usersRes, placesRes, bookingsRes, reviewsRes, statsRes] = await Promise.all([
            safe(axios.get('/admin/users')),
            safe(axios.get('/admin/places')),
            safe(axios.get('/admin/bookings')),
            safe(axios.get('/admin/reviews')),
            safe(axios.get('/admin/stats')),
        ]);
        if (usersRes.data)    setUsers(usersRes.data.users || usersRes.data);
        if (placesRes.data)   setPlaces(placesRes.data.places || placesRes.data);
        if (bookingsRes.data) setBookings(bookingsRes.data.bookings || bookingsRes.data);
        if (reviewsRes.data)  setReviews(Array.isArray(reviewsRes.data) ? reviewsRes.data : (reviewsRes.data.reviews || []));
        if (statsRes.data)    setStats(statsRes.data);
        setLoading(false);
    }

    // Search handler — debounced
    function handleSearch(q, type) {
        setSearchQuery(q);
        if (searchTimeout.current) clearTimeout(searchTimeout.current);
        if (!q.trim()) { setSearchResults(null); return; }
        searchTimeout.current = setTimeout(async () => {
            setSearching(true);
            try {
                const res = await axios.get(`/admin/search?type=${type}&q=${encodeURIComponent(q)}`);
                setSearchResults({ type, items: res.data.results });
            } catch { toast.error(t('admin.searchFailed')); }
            finally { setSearching(false); }
        }, 400);
    }

    // View place bookings
    async function viewPlaceBookings(placeId) {
        setLoadingPlaceBookings(true);
        try {
            const res = await axios.get(`/admin/places/${placeId}/bookings`);
            setPlaceBookingsModal(res.data);
        } catch { toast.error(t('admin.loadBookingsFailed')); }
        finally { setLoadingPlaceBookings(false); }
    }

    if (!ready) return (
        <div className="flex items-center justify-center min-h-screen" style={{ background: '#0f172a' }}>
            <div className="w-10 h-10 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
        </div>
    );
    if (!user || user.role?.toUpperCase() !== 'ADMIN') return <Navigate to="/" />;

    const regularUsers = users.filter(u => u.role?.toUpperCase() !== 'ADMIN');

    async function deleteUser(userId) {
        const confirmed = await confirm({
            title: t('common.delete'),
            message: t('admin.deleteUserConfirm'),
            confirmLabel: t('common.delete'),
            cancelLabel: t('common.cancel'),
            danger: true,
        });
        if (!confirmed) return;
        try {
            await axios.delete('/admin/users/' + userId);
            setUsers(prev => prev.filter(u => u._id !== userId && u.id !== userId));
            toast.success(t('admin.userDeleted'));
        } catch { toast.error(t('admin.deleteFailed')); }
    }

    async function deletePlace(placeId) {
        const confirmed = await confirm({
            title: t('common.delete'),
            message: t('admin.deletePlaceConfirm'),
            confirmLabel: t('common.delete'),
            cancelLabel: t('common.cancel'),
            danger: true,
        });
        if (!confirmed) return;
        try {
            await axios.delete('/admin/places/' + placeId);
            setPlaces(prev => prev.filter(p => p._id !== placeId && p.id !== placeId));
            toast.success(t('admin.placeDeleted'));
        } catch (err) {
            const msg = err.response?.data?.error;
            toast.error(msg || t('admin.deleteFailed'));
        }
    }

    async function deleteReview(reviewId) {
        const confirmed = await confirm({
            title: t('common.delete'),
            message: t('admin.deleteReviewConfirm'),
            confirmLabel: t('common.delete'),
            cancelLabel: t('common.cancel'),
            danger: true,
        });
        if (!confirmed) return;
        try {
            await axios.delete('/admin/reviews/' + reviewId);
            setReviews(prev => prev.filter(r => r._id !== reviewId));
            toast.success(t('admin.reviewDeleted'));
        } catch { toast.error(t('admin.reviewDeleteFailed')); }
    }

    async function handlePasswordChange(e) {
        e.preventDefault();
        if (!oldPassword.trim()) return toast.error(t('admin.oldPasswordRequired'));
        if (newPassword.length < 6) return toast.error(t('admin.passwordTooShort'));
        if (oldPassword === newPassword) return toast.error(t('admin.passwordSameAsOld'));
        setPasswordLoading(true);
        try {
            await axios.put('/profile', { oldPassword, password: newPassword });
            toast.success(t('admin.passwordUpdated'));
            setOldPassword('');
            setNewPassword('');
        } catch (err) {
            const msg = err.response?.data?.error;
            toast.error(msg || t('common.error'));
        }
        finally { setPasswordLoading(false); }
    }

    const tabs = [
        { id: 'overview', Icon: BarChart3, label: 'Genel Bakış' },
        { id: 'users', Icon: Users, label: `Kullanıcılar (${regularUsers.length})` },
        { id: 'places', Icon: Home, label: `İlanlar (${places.length})` },
        { id: 'bookings', Icon: Calendar, label: `Rezervasyonlar (${bookings.length})` },
        { id: 'reviews', Icon: MessageCircle, label: `Yorumlar (${reviews.length})` },
        { id: 'settings', Icon: Settings, label: 'Ayarlar' },
    ];

    const totalHosts = users.filter(u => u.isHost === true).length;
    const totalGuests = users.filter(u => u.isHost === false).length;
    const totalRevenue = bookings
        .filter(b => b.status === 'CONFIRMED' || b.status === 'COMPLETED')
        .reduce((sum, b) => sum + (b.totalPrice || b.price || 0), 0);

    const statCards = [
        { label: 'Toplam Kullanıcı', value: regularUsers.length, Icon: Users, color: '#3b82f6' },
        { label: 'Ev Sahipleri', value: stats?.totalHosts ?? totalHosts, Icon: UserCheck, color: '#f97316' },
        { label: 'Misafirler', value: stats?.totalGuests ?? totalGuests, Icon: Users, color: '#ec4899' },
        { label: 'İlanlar', value: places.length, Icon: Home, color: '#f59e0b' },
        { label: 'Rezervasyonlar', value: bookings.length, Icon: Calendar, color: '#10b981' },
        { label: 'Gelir (₺)', value: (stats?.totalRevenue ?? totalRevenue).toFixed(0), Icon: TrendingUp, color: '#06b6d4' },
        { label: 'Yorumlar', value: reviews.length, Icon: MessageCircle, color: '#8b5cf6' },
    ];

    const statusColors = {
        PENDING:   { bg: 'rgba(234,179,8,0.15)',  color: '#eab308', label: 'Bekliyor' },
        APPROVED:  { bg: 'rgba(59,130,246,0.15)', color: '#60a5fa', label: 'Onaylandı' },
        CONFIRMED: { bg: 'rgba(16,185,129,0.15)', color: '#10b981', label: 'Ödendi' },
        COMPLETED: { bg: 'rgba(100,116,139,0.15)',color: '#94a3b8', label: 'Tamamlandı' },
        CANCELLED: { bg: 'rgba(239,68,68,0.15)',  color: '#ef4444', label: 'İptal' },
    };

    return (
        <div style={{ minHeight: '100vh', background: '#0f172a', color: '#e2e8f0' }}>

        {/* ── Place Bookings Modal ─────────────────────────────────────────── */}
        {placeBookingsModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
                style={{ background: 'rgba(0,0,0,0.7)' }}
                onClick={() => setPlaceBookingsModal(null)}>
                <div className="w-full max-w-3xl max-h-[85vh] overflow-y-auto rounded-2xl"
                    style={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.08)' }}
                    onClick={e => e.stopPropagation()}>
                    {/* Modal header */}
                    <div className="flex items-center justify-between px-6 py-4 border-b sticky top-0"
                        style={{ background: '#1e293b', borderColor: 'rgba(255,255,255,0.08)' }}>
                        <div>
                            <h2 className="font-bold text-white text-lg">{placeBookingsModal.place?.title}</h2>
                            <p className="text-xs" style={{ color: '#64748b' }}>
                                İlan Kodu: <span className="font-mono text-primary-400">#{placeBookingsModal.place?.shortId}</span>
                                {' · '}{placeBookingsModal.bookings?.length} rezervasyon
                            </p>
                        </div>
                        <button onClick={() => setPlaceBookingsModal(null)}
                            className="p-2 rounded-lg hover:bg-white/10 transition-colors">
                            <X size={16} style={{ color: '#94a3b8' }} />
                        </button>
                    </div>
                    {/* Bookings list */}
                    <div className="divide-y" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
                        {placeBookingsModal.bookings?.length === 0 && (
                            <p className="py-12 text-center text-sm" style={{ color: '#475569' }}>Bu ilana ait rezervasyon bulunmuyor.</p>
                        )}
                        {placeBookingsModal.bookings?.map(b => {
                            const sc = statusColors[b.status] || statusColors.PENDING;
                            const cin = new Date(b.checkIn);
                            const cout = new Date(b.checkOut);
                            const isUpcoming = b.isUpcoming;
                            return (
                                <div key={b.id} className="px-6 py-4">
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="text-sm font-semibold text-white">{b.guestName}</span>
                                                <span className="text-xs px-1.5 py-0.5 rounded font-mono"
                                                    style={{ background: 'rgba(99,102,241,0.15)', color: '#818cf8' }}>
                                                    #{b.shortId}
                                                </span>
                                                {isUpcoming && (
                                                    <span className="text-xs px-1.5 py-0.5 rounded"
                                                        style={{ background: 'rgba(16,185,129,0.15)', color: '#10b981' }}>
                                                        Yaklaşan
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-xs mb-2" style={{ color: '#64748b' }}>{b.guestEmail}</p>
                                            <div className="flex flex-wrap gap-3 text-xs" style={{ color: '#94a3b8' }}>
                                                <span>📅 {cin.toLocaleDateString('tr-TR')} — {cout.toLocaleDateString('tr-TR')}</span>
                                                <span>👥 {b.guestsCount} misafir</span>
                                                <span className="font-bold" style={{ color: '#10b981' }}>₺{(b.totalPrice || 0).toLocaleString('tr-TR')}</span>
                                            </div>
                                        </div>
                                        <span className="text-xs px-2 py-1 rounded-lg font-semibold whitespace-nowrap"
                                            style={{ background: sc.bg, color: sc.color }}>
                                            {sc.label}
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        )}

            {/* Header */}
            <div style={{ background: 'rgba(15,23,42,0.95)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}
                className="sticky top-0 z-10 backdrop-blur-md px-6 py-4">
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-primary-600 flex items-center justify-center">
                            <Shield size={18} className="text-white" />
                        </div>
                        <div>
                            <h1 className="font-heading font-bold text-lg text-white">DwellGo Yönetim</h1>
                            <p className="text-xs" style={{ color: '#64748b' }}>Sistem Çevrimiçi · {user.name}</p>
                        </div>
                    </div>
                    <Link to="/"
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-colors"
                        style={{ background: 'rgba(255,255,255,0.05)', color: '#94a3b8', border: '1px solid rgba(255,255,255,0.05)' }}>
                        <ArrowLeft size={13} /> Siteye Dön
                    </Link>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-6 py-8">
                {/* Tabs */}
                <div className="flex gap-1 mb-8 p-1 rounded-2xl overflow-x-auto"
                    style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
                    {tabs.map(({ id, Icon, label }) => (
                        <button key={id} onClick={() => setActiveTab(id)}
                            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex-1 justify-center"
                            style={{
                                background: activeTab === id ? '#2563eb' : 'transparent',
                                color: activeTab === id ? '#fff' : '#64748b',
                            }}>
                            <Icon size={13} />
                            <span className="hidden sm:inline">{label}</span>
                        </button>
                    ))}
                </div>

                {/* ── Search Bar (shown in users/places/bookings tabs) ─── */}
                {['users','places','bookings'].includes(activeTab) && (
                    <div className="mb-6">
                        <div className="relative flex items-center gap-2 px-4 py-3 rounded-2xl border"
                            style={{ background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.08)' }}>
                            <Search size={15} style={{ color: '#475569', flexShrink: 0 }} />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={e => handleSearch(e.target.value, activeTab === 'users' ? 'user' : activeTab === 'places' ? 'place' : 'booking')}
                                placeholder={
                                    activeTab === 'users' ? 'Kullanıcı no, ad veya e-posta ile ara...' :
                                    activeTab === 'places' ? 'İlan no, başlık veya şehir ile ara...' :
                                    'Rezervasyon no veya misafir adı ile ara...'
                                }
                                className="flex-1 bg-transparent border-none text-sm text-white placeholder-slate-500 focus:outline-none"
                            />
                            {searchQuery && (
                                <button onClick={() => { setSearchQuery(''); setSearchResults(null); }}
                                    className="p-1 rounded-lg hover:bg-white/10">
                                    <X size={13} style={{ color: '#64748b' }} />
                                </button>
                            )}
                            {searching && <div className="w-4 h-4 border border-primary-500 border-t-transparent rounded-full animate-spin" />}
                        </div>
                        {/* Search results */}
                        {searchResults && (
                            <div className="mt-2 rounded-2xl overflow-hidden border"
                                style={{ background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.08)' }}>
                                <p className="px-4 py-2 text-xs border-b" style={{ color: '#64748b', borderColor: 'rgba(255,255,255,0.05)' }}>
                                    Arama Sonuçları — {searchResults.items.length} sonuç
                                </p>
                                {searchResults.items.length === 0 && (
                                    <p className="px-4 py-6 text-center text-xs" style={{ color: '#475569' }}>Sonuç bulunamadı</p>
                                )}
                                {searchResults.type === 'user' && searchResults.items.map(u => (
                                    <div key={u.id} className="flex items-center justify-between px-4 py-3 border-b group hover:bg-white/5"
                                        style={{ borderColor: 'rgba(255,255,255,0.03)' }}>
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-primary-600 flex items-center justify-center text-xs font-bold text-white">
                                                {(u.name || u.email)?.charAt(0)?.toUpperCase()}
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-white">{u.name || 'İsimsiz'}</p>
                                                <p className="text-xs" style={{ color: '#64748b' }}>{u.email}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <button onClick={() => deleteUser(u._id || u.id)}
                                                className="opacity-0 group-hover:opacity-100 flex items-center gap-1 px-2 py-1 rounded text-xs transition-all"
                                                style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444' }}>
                                                <Trash2 size={10} /> Sil
                                            </button>
                                        </div>
                                    </div>
                                ))}
                                {searchResults.type === 'place' && searchResults.items.map(p => (
                                    <div key={p.id} className="flex items-center justify-between px-4 py-3 border-b group hover:bg-white/5"
                                        style={{ borderColor: 'rgba(255,255,255,0.03)' }}>
                                        <div>
                                            <p className="text-sm font-medium text-white">{p.title}</p>
                                            <p className="text-xs" style={{ color: '#64748b' }}>{p.city} · {p.ownerName} · {p.bookingsCount} rezervasyon</p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button onClick={() => viewPlaceBookings(p.id)}
                                                className="flex items-center gap-1 px-2 py-1 rounded text-xs"
                                                style={{ background: 'rgba(59,130,246,0.1)', color: '#60a5fa' }}>
                                                <Eye size={10} /> Rezervasyonlar
                                            </button>
                                            <button onClick={() => deletePlace(p._id || p.id)}
                                                className="opacity-0 group-hover:opacity-100 flex items-center gap-1 px-2 py-1 rounded text-xs transition-all"
                                                style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444' }}>
                                                <Trash2 size={10} /> Sil
                                            </button>
                                        </div>
                                    </div>
                                ))}
                                {searchResults.type === 'booking' && searchResults.items.map(b => {
                                    const sc = statusColors[b.status] || statusColors.PENDING;
                                    return (
                                        <div key={b.id} className="flex items-center justify-between px-4 py-3 border-b hover:bg-white/5"
                                            style={{ borderColor: 'rgba(255,255,255,0.03)' }}>
                                            <div>
                                                <p className="text-sm font-medium text-white">{b.guestName}</p>
                                                <p className="text-xs" style={{ color: '#64748b' }}>{b.placeTitle}</p>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs px-2 py-1 rounded font-semibold" style={{ background: sc.bg, color: sc.color }}>{sc.label}</span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                )}

                {loading ? (
                    <div className="flex flex-col items-center justify-center py-24 gap-4">
                        <div className="w-10 h-10 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
                        <p className="text-xs" style={{ color: '#64748b' }}>Veriler yükleniyor...</p>
                    </div>
                ) : (
                    <>
                        {/* Overview */}
                        {activeTab === 'overview' && (
                            <div className="space-y-6">
                                <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
                                    {statCards.map(({ label, value, Icon, color }) => (
                                        <div key={label} className="p-5 rounded-2xl"
                                            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
                                            <div className="flex items-center justify-between mb-3">
                                                <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: `${color}20` }}>
                                                    <Icon size={15} style={{ color }} />
                                                </div>
                                            </div>
                                            <div className="text-3xl font-heading font-bold text-white">{value}</div>
                                            <div className="text-xs mt-1" style={{ color: '#64748b' }}>{label}</div>
                                        </div>
                                    ))}
                                </div>

                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    <div className="rounded-2xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
                                        <div className="px-5 py-4 border-b flex items-center justify-between" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
                                            <h3 className="text-sm font-semibold text-white">Son Rezervasyonlar</h3>
                                            <button onClick={() => setActiveTab('bookings')} className="text-xs text-primary-400 hover:text-primary-300">Tümü →</button>
                                        </div>
                                        <div>
                                            {bookings.slice(0, 5).map(b => (
                                                <div key={b._id} className="px-5 py-3 flex items-center justify-between border-b" style={{ borderColor: 'rgba(255,255,255,0.03)' }}>
                                                    <div>
                                                        <p className="text-sm font-medium text-white">{b.user?.name || '-'}</p>
                                                        <p className="text-xs" style={{ color: '#64748b' }}>{b.place?.title || 'İlan silinmiş'}</p>
                                                    </div>
                                                    <span className="text-sm font-bold" style={{ color: '#10b981' }}>₺{b.totalPrice ?? b.price ?? 0}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="rounded-2xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
                                        <div className="px-5 py-4 border-b flex items-center justify-between" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
                                            <h3 className="text-sm font-semibold text-white">Son Yorumlar</h3>
                                            <button onClick={() => setActiveTab('reviews')} className="text-xs text-primary-400 hover:text-primary-300">Tümü →</button>
                                        </div>
                                        <div>
                                            {reviews.slice(0, 5).map(r => (
                                                <div key={r._id} className="px-5 py-3 flex items-start gap-3 border-b" style={{ borderColor: 'rgba(255,255,255,0.03)' }}>
                                                    <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(139,92,246,0.15)' }}>
                                                        <MessageCircle size={13} style={{ color: '#8b5cf6' }} />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center justify-between">
                                                            <p className="text-xs font-semibold text-white">{r.user?.name}</p>
                                                            <div className="flex items-center gap-0.5">
                                                                <Star size={10} fill="#fbbf24" style={{ color: '#fbbf24' }} />
                                                                <span className="text-xs" style={{ color: '#fbbf24' }}>{r.rating}</span>
                                                            </div>
                                                        </div>
                                                        <p className="text-xs line-clamp-1 mt-0.5 italic" style={{ color: '#64748b' }}>"{r.comment}"</p>
                                                    </div>
                                                </div>
                                            ))}
                                            {reviews.length === 0 && <p className="px-5 py-10 text-center text-xs" style={{ color: '#475569' }}>Henüz yorum yok</p>}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Users */}
                        {activeTab === 'users' && (
                            <div className="rounded-2xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
                                <div className="px-6 py-5 border-b" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
                                    <h2 className="font-heading font-bold text-lg text-white">Tüm Kullanıcılar</h2>
                                    <p className="text-xs mt-0.5" style={{ color: '#64748b' }}>
                                        {regularUsers.length} kayıt —
                                        <span style={{ color: '#f97316' }}> {totalHosts} Ev Sahibi</span> /
                                        <span style={{ color: '#ec4899' }}> {totalGuests} Misafir</span>
                                    </p>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                                {['Kullanıcı', 'Tipi', 'E-posta', 'İlanlar', 'Rezervasyon', 'İşlem'].map(h => (
                                                    <th key={h} className="text-left px-6 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: '#475569' }}>{h}</th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {regularUsers.map(u => {
                                                const userPlaces = places.filter(p => p.owner?._id === u._id || p.owner?.id === u._id);
                                                const userBookings = bookings.filter(b => b.user?._id === u._id || b.user?.id === u._id);
                                                return (
                                                    <tr key={u._id} className="group border-b" style={{ borderColor: 'rgba(255,255,255,0.03)' }}>
                                                        <td className="px-6 py-4">
                                                            <div className="flex items-center gap-3">
                                                                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center font-bold text-white text-sm">
                                                                    {(u.name || u.email)?.charAt(0)?.toUpperCase()}
                                                                </div>
                                                                <span className="font-medium text-white">{u.name || 'İsimsiz'}</span>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <span className="text-xs px-2 py-1 rounded-lg font-semibold"
                                                                style={{
                                                                    background: u.isHost ? 'rgba(249,115,22,0.15)' : 'rgba(236,72,153,0.15)',
                                                                    color: u.isHost ? '#f97316' : '#ec4899'
                                                                }}>
                                                                {u.isHost ? '🏠 Ev Sahibi' : '👤 Misafir'}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-4 text-sm" style={{ color: '#94a3b8' }}>{u.email}</td>
                                                        <td className="px-6 py-4 text-center font-bold" style={{ color: '#f97316' }}>{userPlaces.length}</td>
                                                        <td className="px-6 py-4 text-center font-bold" style={{ color: '#60a5fa' }}>{userBookings.length}</td>
                                                        <td className="px-6 py-4">
                                                            <button onClick={() => deleteUser(u._id)}
                                                                className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                                                                style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.2)' }}>
                                                                <Trash2 size={11} /> Sil
                                                            </button>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        {/* Places */}
                        {activeTab === 'places' && (
                            <div className="rounded-2xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
                                <div className="px-6 py-5 border-b flex items-center justify-between" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
                                    <div>
                                        <h2 className="font-heading font-bold text-lg text-white">Tüm İlanlar</h2>
                                        <p className="text-xs mt-0.5" style={{ color: '#64748b' }}>{places.length} ilan</p>
                                    </div>
                                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                                {['İlan', 'Ev Sahibi', 'Fiyat', 'Rezervasyonlar', 'İşlem'].map(h => (
                                                    <th key={h} className="text-left px-6 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: '#475569' }}>{h}</th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {places.map(p => {
                                                const plcBookings = bookings.filter(b => b.place?.id === p.id || b.place?._id === p._id);
                                                return (
                                                    <tr key={p._id || p.id} className="group border-b" style={{ borderColor: 'rgba(255,255,255,0.03)' }}>
                                                        <td className="px-4 py-4">
                                                            <div className="min-w-0">
                                                                <Link to={`/place/${p._id || p.id}`} target="_blank"
                                                                    className="font-medium text-white hover:text-primary-400 transition-colors truncate block max-w-[160px]">
                                                                    {p.title}
                                                                </Link>
                                                                <p className="text-xs" style={{ color: '#64748b' }}>{p.propertyType}</p>
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-4">
                                                            <div>
                                                                <p className="text-sm font-medium text-white">{p.owner?.name || '-'}</p>
                                                                <p className="text-xs" style={{ color: '#64748b' }}>{p.owner?.email || '-'}</p>
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-4 font-bold" style={{ color: '#10b981' }}>₺{(p.price || 0).toLocaleString('tr-TR')}</td>
                                                        <td className="px-4 py-4">
                                                            <button onClick={() => viewPlaceBookings(p._id || p.id)}
                                                                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all"
                                                                style={{ background: 'rgba(59,130,246,0.1)', color: '#60a5fa', border: '1px solid rgba(59,130,246,0.2)' }}>
                                                                <Eye size={10} /> {plcBookings.length}
                                                            </button>
                                                        </td>
                                                        <td className="px-4 py-4">
                                                            <button onClick={() => deletePlace(p._id || p.id)}
                                                                className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                                                                style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.2)' }}>
                                                                <Trash2 size={11} /> Sil
                                                            </button>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        {/* Bookings */}
                        {activeTab === 'bookings' && (
                            <div className="rounded-2xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
                                <div className="px-6 py-5 border-b" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
                                    <h2 className="font-heading font-bold text-lg text-white">Rezervasyon Kayıtları</h2>
                                    <p className="text-xs mt-0.5" style={{ color: '#64748b' }}>{bookings.length} işlem</p>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                                {['Kiracı', 'Ev Sahibi', 'İlan', 'Tarih', 'Tutar', 'Durum'].map(h => (
                                                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: '#475569' }}>{h}</th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {bookings.map(b => {
                                                const cin = b.checkIn ? new Date(b.checkIn) : null;
                                                const cout = b.checkOut ? new Date(b.checkOut) : null;
                                                const bStatusColors = {
                                                    PENDING:   { bg: 'rgba(234,179,8,0.15)',  color: '#eab308' },
                                                    APPROVED:  { bg: 'rgba(59,130,246,0.15)', color: '#60a5fa' },
                                                    CONFIRMED: { bg: 'rgba(16,185,129,0.15)', color: '#10b981' },
                                                    COMPLETED: { bg: 'rgba(100,116,139,0.15)',color: '#94a3b8' },
                                                    CANCELLED: { bg: 'rgba(239,68,68,0.15)',  color: '#ef4444' },
                                                };
                                                const statusLabels = {
                                                    PENDING:'Bekliyor', APPROVED:'Onaylandı',
                                                    CONFIRMED:'Ödendi', COMPLETED:'Tamamlandı', CANCELLED:'İptal'
                                                };
                                                const sc = bStatusColors[b.status] || bStatusColors.PENDING;
                                                // Find place owner
                                                const placeOwner = b.place?.owner || users.find(u => u.id === b.place?.ownerId);
                                                return (
                                                    <tr key={b._id || b.id} className="border-b hover:bg-white/[0.02] transition-colors" style={{ borderColor: 'rgba(255,255,255,0.03)' }}>
                                                        {/* Kiracı (tenant/guest) */}
                                                        <td className="px-4 py-4">
                                                            <div className="flex items-center gap-2">
                                                                <div className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold text-white flex-shrink-0" style={{ background: 'rgba(236,72,153,0.25)' }}>
                                                                    {(b.user?.name || b.name || '?').charAt(0).toUpperCase()}
                                                                </div>
                                                                <div>
                                                                    <p className="font-semibold text-white text-sm">{b.user?.name || b.name || 'Misafir'}</p>
                                                                    <p className="text-xs" style={{ color: '#64748b' }}>{b.user?.email || '—'}</p>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        {/* Ev Sahibi (host) */}
                                                        <td className="px-4 py-4">
                                                            <div>
                                                                <p className="text-sm font-medium text-white">{b.place?.owner?.name || placeOwner?.name || '—'}</p>
                                                                <p className="text-xs" style={{ color: '#64748b' }}>{b.place?.owner?.email || placeOwner?.email || '—'}</p>
                                                            </div>
                                                        </td>
                                                        {/* İlan */}
                                                        <td className="px-4 py-4">
                                                            <Link to={`/place/${b.place?.id || b.place?._id}`}
                                                                className="text-sm font-medium hover:text-primary-400 transition-colors truncate block max-w-[130px]"
                                                                style={{ color: '#94a3b8' }}>
                                                                {b.place?.title || 'Silinmiş'}
                                                            </Link>
                                                            {b.guestsCount && <p className="text-xs" style={{ color: '#475569' }}>{b.guestsCount} misafir</p>}
                                                        </td>
                                                        {/* Tarih */}
                                                        <td className="px-4 py-4">
                                                            <p className="text-xs text-white">{cin?.toLocaleDateString('tr-TR')}</p>
                                                            <p className="text-xs" style={{ color: '#64748b' }}>{cout?.toLocaleDateString('tr-TR')}</p>
                                                        </td>
                                                        {/* Tutar */}
                                                        <td className="px-4 py-4 font-bold text-sm" style={{ color: '#10b981' }}>₺{(b.totalPrice ?? b.price ?? 0).toLocaleString('tr-TR')}</td>
                                                        {/* Durum */}
                                                        <td className="px-4 py-4">
                                                            <span className="text-xs px-2 py-1 rounded-lg font-semibold"
                                                                style={{ background: sc.bg, color: sc.color }}>
                                                                {statusLabels[b.status] || b.status}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        {/* Reviews */}
                        {activeTab === 'reviews' && (
                            <div className="rounded-2xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
                                <div className="px-6 py-5 border-b" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
                                    <h2 className="font-heading font-bold text-lg text-white">Yorum Yönetimi</h2>
                                    <p className="text-xs mt-0.5" style={{ color: '#64748b' }}>{reviews.length} yorum</p>
                                </div>
                                <div>
                                    {reviews.map(r => (
                                        <div key={r._id} className="px-6 py-5 flex items-start gap-4 border-b group" style={{ borderColor: 'rgba(255,255,255,0.03)' }}>
                                            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(139,92,246,0.15)' }}>
                                                <MessageCircle size={15} style={{ color: '#8b5cf6' }} />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between mb-1">
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-semibold text-sm text-white">{r.user?.name}</span>
                                                        <span className="text-xs" style={{ color: '#475569' }}>→ {r.place?.title || 'İlan'}</span>
                                                    </div>
                                                    <div className="flex items-center gap-3">
                                                        <div className="flex items-center gap-0.5">
                                                            {[1,2,3,4,5].map(n => (
                                                                <Star key={n} size={11} fill={n <= r.rating ? '#fbbf24' : 'none'} style={{ color: n <= r.rating ? '#fbbf24' : '#334155' }} />
                                                            ))}
                                                        </div>
                                                        <button onClick={() => deleteReview(r._id)}
                                                            className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs transition-all"
                                                            style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.2)' }}>
                                                            <Trash2 size={10} /> Kaldır
                                                        </button>
                                                    </div>
                                                </div>
                                                <p className="text-sm italic" style={{ color: '#64748b' }}>"{r.comment}"</p>
                                            </div>
                                        </div>
                                    ))}
                                    {reviews.length === 0 && <p className="py-16 text-center text-xs" style={{ color: '#475569' }}>Henüz yorum bulunmuyor.</p>}
                                </div>
                            </div>
                        )}

                        {/* Settings */}
                        {activeTab === 'settings' && (
                            <div className="max-w-lg mx-auto">
                                <div className="rounded-2xl p-8" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
                                    <div className="text-center mb-8">
                                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center font-heading font-bold text-2xl text-white mx-auto mb-4">
                                            {user.name?.charAt(0).toUpperCase()}
                                        </div>
                                        <h2 className="font-heading font-bold text-xl text-white">{user.name}</h2>
                                        <p className="text-xs mt-1" style={{ color: '#64748b' }}>{user.email}</p>
                                        <span className="inline-flex items-center gap-1 mt-2 px-3 py-1 rounded-lg text-xs font-medium" style={{ background: 'rgba(37,99,235,0.15)', color: '#60a5fa', border: '1px solid rgba(37,99,235,0.2)' }}>
                                            <Shield size={10} /> Sistem Yöneticisi
                                        </span>
                                    </div>

                                    <form onSubmit={handlePasswordChange} className="space-y-4">
                                        <div>
                                            <label className="block text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: '#64748b' }}>Mevcut Şifre</label>
                                            <div className="flex items-center gap-2.5 px-4 py-3 rounded-xl border" style={{ background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.08)' }}>
                                                <Lock size={14} style={{ color: '#475569' }} />
                                                <input type="password" value={oldPassword} onChange={e => setOldPassword(e.target.value)}
                                                    placeholder="Mevcut şifrenizi girin"
                                                    required
                                                    className="flex-1 bg-transparent border-none text-sm p-0 m-0 focus:ring-0 focus:outline-none text-white"
                                                    style={{ boxShadow: 'none' }} />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: '#64748b' }}>Yeni Şifre</label>
                                            <div className="flex items-center gap-2.5 px-4 py-3 rounded-xl border" style={{ background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.08)' }}>
                                                <Lock size={14} style={{ color: '#475569' }} />
                                                <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)}
                                                    placeholder="Yeni şifrenizi girin"
                                                    minLength={6} required
                                                    className="flex-1 bg-transparent border-none text-sm p-0 m-0 focus:ring-0 focus:outline-none text-white"
                                                    style={{ boxShadow: 'none' }} />
                                            </div>
                                        </div>
                                        <button type="submit" disabled={passwordLoading}
                                            className="w-full py-3 rounded-xl text-sm font-semibold text-white bg-primary-600 hover:bg-primary-700 transition-colors disabled:opacity-50">
                                            {passwordLoading ? 'Güncelleniyor...' : 'Şifreyi Güncelle'}
                                        </button>
                                    </form>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
