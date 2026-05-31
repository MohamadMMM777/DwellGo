import { Link, useParams, useNavigate } from "react-router-dom";
import { UserContext } from '../contexts/UserContext.jsx';
import { useContext, useEffect, useState } from "react";
import axios from "axios";
import BookingWidget from '../components/BookingWidget.jsx';
import PlaceGallery from '../components/PlaceGallery.jsx';
import AddressLink from '../components/AddressLink.jsx';
import ReviewSection from '../components/ReviewSection.jsx';
import ContactHostWidget from '../components/ContactHostWidget.jsx';
import Map from '../components/Map.jsx';
import ErrorBoundary from '../components/ErrorBoundary.jsx';
import { toast } from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { useConfirm } from '../contexts/ConfirmContext.jsx';
import { Heart, Share2, Shield, Trash2, ArrowLeft, MapPin, Sparkles, Building2, Home, Castle, Sofa, Building, Calendar, User, Eye, AlertTriangle } from 'lucide-react';

const PROPERTY_ICONS = { apartment: Building2, house: Home, villa: Castle, studio: Sofa, building: Building };
const PROPERTY_LABELS = { apartment: 'Daire', house: 'Ev', villa: 'Villa', studio: 'Stüdyo', building: 'Bina' };

export default function PlacePage() {
    const { user, setUser } = useContext(UserContext);
    const { id } = useParams();
    const navigate = useNavigate();
    const { t } = useTranslation();
    const confirm = useConfirm();
    const [place, setPlace] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const [position, setPosition] = useState(null);
    const [isWishlisted, setIsWishlisted] = useState(false);
    const isAdmin = user?.role?.toLowerCase() === 'admin';
    const [adminBookings, setAdminBookings] = useState(null);
    const [loadingBookings, setLoadingBookings] = useState(false);

    async function handleAdminDelete() {
        const confirmed = await confirm({
            title: t('place.deleteConfirmTitle'),
            message: place?.title
                ? t('place.deleteConfirmNamed', { title: place.title })
                : t('place.deleteConfirmMessage'),
            confirmLabel: t('common.delete'),
            cancelLabel: t('common.cancel'),
            danger: true,
        });
        if (!confirmed) return;
        try {
            await axios.delete('/admin/places/' + id);
            toast.success(t('place.deleteSuccess'));
            navigate('/admin');
        } catch (err) {
            const msg = err.response?.data?.error;
            toast.error(msg || t('place.deleteFailed'));
        }
    }

    useEffect(() => {
        if (!id) return;
        setLoading(true); setError(false);
        axios.get(`/places/${id}`).then(res => {
            setPlace(res.data);
            if (res.data.lat) setPosition({ lat: res.data.lat, lng: res.data.lng });
            if (user?.wishlistIds) setIsWishlisted(user.wishlistIds.includes(id));
            setLoading(false);
        }).catch(() => { setError(true); setLoading(false); });
    }, [id, user]);

    // Fetch bookings for admin view
    useEffect(() => {
        if (!isAdmin || !place || !id) return;
        setLoadingBookings(true);
        axios.get(`/admin/places/${id}/bookings`)
            .then(res => setAdminBookings(res.data))
            .catch(() => setAdminBookings(null))
            .finally(() => setLoadingBookings(false));
    }, [isAdmin, place, id]);

    async function toggleWishlist() {
        if (!user) { toast.error(t('place.wishlistLoginRequired')); return; }
        try {
            const { data } = await axios.post('/wishlist/toggle', { placeId: id });
            const isAdded = data.status === 'added';
            setIsWishlisted(isAdded);
            const newWishlist = isAdded ? [...(user.wishlistIds || []), id] : (user.wishlistIds || []).filter(wid => wid !== id);
            setUser({ ...user, wishlistIds: newWishlist });
            toast.success(isAdded ? t('place.wishlistAdded') : t('place.wishlistRemoved'));
        } catch { toast.error(t('place.wishlistFailed')); }
    }

    if (loading) return (
        <div className="flex flex-col items-center justify-center min-h-[70vh] gap-4">
            <div className="w-12 h-12 rounded-full border-2 border-primary-600 border-t-transparent animate-spin" />
            <p className="text-sm" style={{ color: 'var(--on-surface-2)' }}>{t('place.loading')}</p>
        </div>
    );

    if (error || !place) return (
        <div className="flex flex-col items-center justify-center min-h-[70vh] gap-6 text-center">
            <div className="w-20 h-20 rounded-2xl opacity-20 flex items-center justify-center" style={{ background: 'var(--surface-2)' }}>
                <Building2 size={36} style={{ color: 'var(--on-surface-2)' }} />
            </div>
            <div>
                <h2 className="font-heading font-bold text-2xl mb-2" style={{ color: 'var(--on-surface)' }}>{t('place.notFoundTitle')}</h2>
                <p className="text-sm mb-6" style={{ color: 'var(--on-surface-2)' }}>{t('place.notFoundMessage')}</p>
                <Link to="/" className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-primary-600 hover:bg-primary-700 transition-colors">
                    {t('common.goHome')}
                </Link>
            </div>
        </div>
    );

    const TypeIcon = PROPERTY_ICONS[place.propertyType] || Building2;
    const typeLabel = place.propertyType ? t(`place.propType${place.propertyType.charAt(0).toUpperCase()}${place.propertyType.slice(1)}`) : null;

    return (
        <div className="mt-6 max-w-6xl mx-auto">

            {/* Title */}
            <div className="mb-5">
                <h1 className="font-heading font-bold text-2xl md:text-3xl mb-3" style={{ color: 'var(--on-surface)' }}>
                    {place.title}
                </h1>
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <AddressLink>{place.address}</AddressLink>
                    {!isAdmin && (
                        <div className="flex items-center gap-2">
                            <button className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium border transition-colors"
                                style={{ borderColor: 'var(--border)', color: 'var(--on-surface-2)' }}>
                                <Share2 size={13} /> {t('place.share')}
                            </button>
                            <button onClick={toggleWishlist}
                                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium border transition-colors"
                                style={{
                                    borderColor: isWishlisted ? '#fca5a5' : 'var(--border)',
                                    color: isWishlisted ? '#ef4444' : 'var(--on-surface-2)',
                                    background: isWishlisted ? '#fef2f2' : 'transparent',
                                }}>
                                <Heart size={13} fill={isWishlisted ? 'currentColor' : 'none'} />
                                {isWishlisted ? t('place.saved') : t('place.save')}
                            </button>
                        </div>
                    )}
                </div>
            </div>

            <PlaceGallery place={place} />

            <ErrorBoundary>
                <div className="mt-10 grid gap-10 grid-cols-1 md:grid-cols-[2fr_1fr]">
                    <div className="space-y-8">
                        {/* Host & stats */}
                        <div className="pb-8 border-b" style={{ borderColor: 'var(--border)' }}>
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h2 className="font-heading font-semibold text-xl mb-1" style={{ color: 'var(--on-surface)' }}>
                                        <Link to={`/user/${place.owner?.id || place.owner?._id || place.owner}`}
                                            className="hover:text-primary-600 transition-colors">
                                            {t('place.hostLabel')}: {place.ownerName || 'Premium Host'}
                                        </Link>
                                    </h2>
                                    <div className="flex flex-wrap gap-2 text-sm" style={{ color: 'var(--on-surface-2)' }}>
                                        {place.capacity?.maxGuests && <span>{t('place.maxGuests', { count: place.capacity.maxGuests })}</span>}
                                        {place.capacity?.bedrooms && <><span>·</span><span>{t('place.bedrooms', { count: place.capacity.bedrooms })}</span></>}
                                        {place.capacity?.beds && <><span>·</span><span>{t('place.beds', { count: place.capacity.beds })}</span></>}
                                        {place.capacity?.bathrooms && <><span>·</span><span>{t('place.bathrooms', { count: place.capacity.bathrooms })}</span></>}
                                    </div>
                                </div>
                                <Link to={`/user/${place.owner?.id || place.owner?._id || place.owner}`}
                                    className="w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg text-white bg-gradient-to-br from-primary-500 to-primary-700 hover:scale-105 transition-transform">
                                    {(place.ownerName || 'P').charAt(0)}
                                </Link>
                            </div>
                            {typeLabel && (
                                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-semibold badge badge-primary">
                                    <TypeIcon size={13} /> {typeLabel}
                                </span>
                            )}
                        </div>

                        {/* Description */}
                        <div>
                            <h3 className="font-heading font-semibold text-lg mb-3" style={{ color: 'var(--on-surface)' }}>{t('place.descriptionTitle')}</h3>
                            <p className="text-sm leading-relaxed whitespace-pre-line" style={{ color: 'var(--on-surface-2)' }}>{place.description}</p>
                        </div>

                        {/* Perks */}
                        <div className="pt-8 border-t" style={{ borderColor: 'var(--border)' }}>
                            <h3 className="font-heading font-semibold text-lg mb-4" style={{ color: 'var(--on-surface)' }}>{t('place.amenitiesTitle')}</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {place.perks?.length > 0 ? place.perks.map(perk => (
                                    <div key={perk} className="flex items-center gap-3 p-3 rounded-xl border"
                                        style={{ borderColor: 'var(--border)', background: 'var(--surface-2)' }}>
                                        <Sparkles size={14} style={{ color: 'var(--primary-600)', flexShrink: 0 }} />
                                        <span className="text-sm font-medium capitalize" style={{ color: 'var(--on-surface)' }}>{perk.replace(/-/g, ' ')}</span>
                                    </div>
                                )) : (
                                    <p className="text-sm italic" style={{ color: 'var(--on-surface-2)' }}>{t('place.amenityPlaceholder')}</p>
                                )}
                            </div>
                        </div>

                        {/* Map */}
                        <div className="pt-8 border-t" style={{ borderColor: 'var(--border)' }}>
                            <h3 className="font-heading font-semibold text-lg mb-4" style={{ color: 'var(--on-surface)' }}>{t('place.whereToStay')}</h3>
                            <div className="h-80 w-full rounded-2xl overflow-hidden">
                                <Map
                                    center={place.lat && place.lng ? [place.lat, place.lng] : [39.9334, 32.8597]}
                                    zoom={15}
                                    position={place.lat && place.lng ? { lat: place.lat, lng: place.lng } : null}
                                />
                            </div>
                            <div className="mt-4 flex items-start gap-2">
                                <MapPin size={14} style={{ color: 'var(--primary-600)', flexShrink: 0, marginTop: 2 }} />
                                <div>
                                    <p className="font-medium text-sm" style={{ color: 'var(--on-surface)' }}>{place.address}</p>
                                    <p className="text-xs" style={{ color: 'var(--on-surface-2)' }}>{place.location?.city || ''}{place.location?.country ? `, ${place.location.country}` : ', Türkiye'}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Booking column / Admin panel */}
                    <div className="relative">
                        <div className="sticky top-24 space-y-4">
                            {!isAdmin ? (
                                <>
                                    <ErrorBoundary><BookingWidget place={place} /></ErrorBoundary>
                                    <ErrorBoundary><ContactHostWidget place={place} /></ErrorBoundary>
                                </>
                            ) : (
                                <div className="rounded-2xl overflow-hidden border" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
                                    {/* Admin header */}
                                    <div className="px-5 py-4 flex items-center gap-3 border-b" style={{ borderColor: 'var(--border)', background: 'var(--surface-2)' }}>
                                        <div className="w-9 h-9 rounded-xl bg-primary-600 flex items-center justify-center">
                                            <Shield size={15} className="text-white" />
                                        </div>
                                        <div>
                                            <h3 className="font-heading font-bold text-sm" style={{ color: 'var(--on-surface)' }}>{t('admin.title')}</h3>
                                            <p className="text-xs" style={{ color: 'var(--on-surface-2)' }}>{t('admin.info')}</p>
                                        </div>
                                    </div>

                                    {/* Place info */}
                                    <div className="px-5 py-4 border-b space-y-2" style={{ borderColor: 'var(--border)' }}>
                                        {place.shortId && (
                                            <div className="flex justify-between items-center">
                                                <span className="text-xs" style={{ color: 'var(--on-surface-2)' }}>{t('admin.listingCode')}</span>
                                                <span className="font-mono text-xs px-2 py-0.5 rounded-lg font-bold" style={{ background: 'rgba(99,102,241,0.12)', color: '#818cf8' }}>#{place.shortId}</span>
                                            </div>
                                        )}
                                        <div className="flex justify-between items-center">
                                            <span className="text-xs" style={{ color: 'var(--on-surface-2)' }}>{t('admin.host')}</span>
                                            <span className="text-xs font-semibold" style={{ color: 'var(--on-surface)' }}>{place.ownerName || '-'}</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-xs" style={{ color: 'var(--on-surface-2)' }}>{t('admin.status')}</span>
                                            <span className="text-xs px-2 py-0.5 rounded-lg font-semibold" style={{ background: 'rgba(16,185,129,0.12)', color: '#10b981' }}>{t('admin.published')}</span>
                                        </div>
                                    </div>

                                    {/* Delete button */}
                                    <div className="px-5 py-4">
                                        {(() => {
                                            const activeCount = adminBookings?.bookings?.filter(b => ['PENDING','APPROVED','CONFIRMED'].includes(b.status)).length || 0;
                                            const hasActive = activeCount > 0;
                                            return (
                                                <>
                                                    <button onClick={handleAdminDelete} disabled={hasActive}
                                                        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all"
                                                        style={{
                                                            background: hasActive ? 'var(--surface-2)' : 'rgba(239,68,68,0.1)',
                                                            color: hasActive ? 'var(--on-surface-2)' : '#ef4444',
                                                            border: `1px solid ${hasActive ? 'var(--border)' : 'rgba(239,68,68,0.25)'}`,
                                                            cursor: hasActive ? 'not-allowed' : 'pointer',
                                                            opacity: hasActive ? 0.6 : 1,
                                                        }}>
                                                        <Trash2 size={14} /> {t('admin.deleteListing')}
                                                    </button>
                                                    {hasActive && (
                                                        <div className="flex items-start gap-2 mt-3 p-2.5 rounded-xl" style={{ background: 'rgba(245,158,11,0.08)' }}>
                                                            <AlertTriangle size={13} style={{ color: '#f59e0b', flexShrink: 0, marginTop: 1 }} />
                                                            <p className="text-xs" style={{ color: '#f59e0b' }}>
                                                                {t('admin.activeBookingsWarning', { count: activeCount })}
                                                            </p>
                                                        </div>
                                                    )}
                                                </>
                                            );
                                        })()}
                                    </div>

                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Rules & Extra Info */}
                <div className="mt-10 pt-10 border-t" style={{ borderColor: 'var(--border)' }}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div>
                            <h3 className="font-heading font-semibold text-lg mb-4" style={{ color: 'var(--on-surface)' }}>{t('place.rulesTitle')}</h3>
                            <div className="space-y-2">
                                {[
                                    { label: t('place.checkInTime'), value: (place.checkIn !== undefined && place.checkIn !== null) ? t('place.checkInAfter', { hour: place.checkIn }) : t('place.checkInAfter', { hour: 14 }) },
                                    { label: t('place.checkOutTime'), value: (place.checkOut !== undefined && place.checkOut !== null) ? t('place.checkOutBefore', { hour: place.checkOut }) : t('place.checkOutBefore', { hour: 11 }) },
                                ].map(({ label, value }) => (
                                    <div key={label} className="flex justify-between items-center p-3.5 rounded-xl"
                                        style={{ background: 'var(--surface-2)' }}>
                                        <span className="text-sm" style={{ color: 'var(--on-surface-2)' }}>{label}</span>
                                        <span className="text-sm font-semibold" style={{ color: 'var(--on-surface)' }}>{value}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div>
                            <h3 className="font-heading font-semibold text-lg mb-4" style={{ color: 'var(--on-surface)' }}>{t('place.extraInfoTitle')}</h3>
                            <p className="text-sm leading-relaxed whitespace-pre-line italic p-4 rounded-xl border"
                                style={{ color: 'var(--on-surface-2)', background: 'var(--surface-2)', borderColor: 'var(--border)' }}>
                                {place.extraInfo || t('place.noExtraInfo')}
                            </p>
                        </div>
                    </div>
                </div>

                {/* ── Admin Bookings Table (full-width, admin only) ────────────── */}
                {isAdmin && (
                    <div className="mt-10 pt-10 border-t" style={{ borderColor: 'var(--border)' }}>
                        {/* Section header */}
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-xl bg-primary-600 flex items-center justify-center">
                                    <Calendar size={16} className="text-white" />
                                </div>
                                <div>
                                    <h3 className="font-heading font-bold text-xl" style={{ color: 'var(--on-surface)' }}>{t('admin.bookingsTitle')}</h3>
                                    <p className="text-xs" style={{ color: 'var(--on-surface-2)' }}>{t('admin.allBookings')}</p>
                                </div>
                            </div>
                            {adminBookings?.bookings?.length > 0 && (
                                <span className="text-sm font-bold px-3 py-1 rounded-xl" style={{ background: 'rgba(59,130,246,0.1)', color: '#60a5fa' }}>
                                    {t('admin.totalLabel', { count: adminBookings.bookings.length })}
                                </span>
                            )}
                        </div>

                        {loadingBookings ? (
                            <div className="flex justify-center py-12">
                                <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
                            </div>
                        ) : !adminBookings?.bookings?.length ? (
                            <div className="flex flex-col items-center justify-center py-16 rounded-2xl border" style={{ background: 'var(--surface-2)', borderColor: 'var(--border)' }}>
                                <Calendar size={32} style={{ color: 'var(--on-surface-2)', opacity: 0.4, marginBottom: 12 }} />
                                <p className="text-sm font-medium" style={{ color: 'var(--on-surface-2)' }}>{t('admin.noBookingsForPlace')}</p>
                            </div>
                        ) : (() => {
                            const upcoming = adminBookings.bookings.filter(b => b.isUpcoming);
                            const past = adminBookings.bookings.filter(b => !b.isUpcoming);
                            const statusMap = {
                                PENDING:   { bg: 'rgba(234,179,8,0.12)',   color: '#eab308', label: t('admin.statusAwaiting') },
                                APPROVED:  { bg: 'rgba(59,130,246,0.12)',  color: '#60a5fa', label: t('admin.statusApproved') },
                                CONFIRMED: { bg: 'rgba(16,185,129,0.12)',  color: '#10b981', label: t('admin.statusPaid') },
                                COMPLETED: { bg: 'rgba(100,116,139,0.12)', color: '#94a3b8', label: t('admin.statusDone') },
                                CANCELLED: { bg: 'rgba(239,68,68,0.12)',   color: '#ef4444', label: t('admin.statusCancelled') },
                            };

                            const BookingTable = ({ bookings, accentColor, label }) => (
                                <div className="mb-8">
                                    {/* Sub-section label */}
                                    <div className="flex items-center gap-3 mb-3">
                                        <span className="text-xs font-bold uppercase tracking-widest" style={{ color: accentColor }}>{label}</span>
                                        <span className="text-xs font-semibold px-2 py-0.5 rounded-lg" style={{ background: accentColor + '20', color: accentColor }}>{bookings.length}</span>
                                        <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />
                                    </div>

                                    {/* Table */}
                                    <div className="rounded-2xl overflow-hidden border" style={{ borderColor: 'var(--border)' }}>
                                        {/* Table header */}
                                        <div className="grid text-xs font-bold uppercase tracking-wider px-5 py-3"
                                            style={{
                                                gridTemplateColumns: '90px 1fr 160px 70px 100px 110px',
                                                background: 'var(--surface-2)',
                                                color: 'var(--on-surface-2)',
                                                borderBottom: '1px solid var(--border)'
                                            }}>
                                            <span>{t('admin.bookingNumber')}</span>
                                            <span>{t('admin.guest')}</span>
                                            <span>{t('admin.dates')}</span>
                                            <span>{t('admin.persons')}</span>
                                            <span>{t('admin.amount')}</span>
                                            <span>{t('admin.statusCol')}</span>
                                        </div>

                                        {/* Rows */}
                                        {bookings.map((b, idx) => {
                                            const sc = statusMap[b.status] || statusMap.PENDING;
                                            const checkIn = new Date(b.checkIn);
                                            const checkOut = new Date(b.checkOut);
                                            const nights = Math.round((checkOut - checkIn) / (1000 * 60 * 60 * 24));
                                            return (
                                                <div key={b.id || b._id}
                                                    className="grid items-center px-5 py-4 transition-colors"
                                                    style={{
                                                        gridTemplateColumns: '90px 1fr 160px 70px 100px 110px',
                                                        borderBottom: idx < bookings.length - 1 ? '1px solid var(--border)' : 'none',
                                                        background: 'var(--surface)',
                                                    }}
                                                    onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-2)'}
                                                    onMouseLeave={e => e.currentTarget.style.background = 'var(--surface)'}>

                                                    {/* Booking ID */}
                                                    <span className="font-mono text-xs font-bold" style={{ color: '#818cf8' }}>
                                                        #{b.shortId || '—'}
                                                    </span>

                                                    {/* Guest */}
                                                    <div className="flex items-center gap-2 min-w-0">
                                                        <div className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                                                            style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
                                                            {(b.guestName || b.name || 'M').charAt(0).toUpperCase()}
                                                        </div>
                                                        <div className="min-w-0">
                                                            <p className="text-sm font-semibold truncate" style={{ color: 'var(--on-surface)' }}>{b.guestName || b.name || 'Misafir'}</p>
                                                            {b.guestEmail && <p className="text-xs truncate" style={{ color: 'var(--on-surface-2)' }}>{b.guestEmail}</p>}
                                                        </div>
                                                    </div>

                                                    {/* Dates */}
                                                    <div>
                                                        <p className="text-sm" style={{ color: 'var(--on-surface)' }}>
                                                            {checkIn.toLocaleDateString('tr-TR', { day: '2-digit', month: 'short', year: 'numeric' })}
                                                        </p>
                                                        <p className="text-xs" style={{ color: 'var(--on-surface-2)' }}>
                                                            → {checkOut.toLocaleDateString('tr-TR', { day: '2-digit', month: 'short', year: 'numeric' })}
                                                            <span className="ml-1.5 font-medium">({t('booking.nights', { count: nights })})</span>
                                                        </p>
                                                    </div>

                                                    {/* Guests count */}
                                                    <div className="flex items-center gap-1">
                                                        <User size={12} style={{ color: 'var(--on-surface-2)' }} />
                                                        <span className="text-sm font-medium" style={{ color: 'var(--on-surface)' }}>{b.guestsCount || 1}</span>
                                                    </div>

                                                    {/* Price */}
                                                    <span className="text-sm font-bold" style={{ color: '#10b981' }}>
                                                        ₺{(b.totalPrice || 0).toLocaleString('tr-TR')}
                                                    </span>

                                                    {/* Status */}
                                                    <span className="inline-flex items-center justify-center text-xs font-semibold px-3 py-1 rounded-xl w-fit"
                                                        style={{ background: sc.bg, color: sc.color }}>
                                                        {sc.label}
                                                    </span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            );

                            return (
                                <div>
                                    {upcoming.length > 0 && (
                                        <BookingTable bookings={upcoming} accentColor="#10b981" label={t('admin.upcomingBookings')} />
                                    )}
                                    {past.length > 0 && (
                                        <BookingTable bookings={past} accentColor="#94a3b8" label={t('admin.pastBookings')} />
                                    )}
                                </div>
                            );
                        })()}
                    </div>
                )}

                <ErrorBoundary>
                    <ReviewSection placeId={place.id || place._id} ownerId={place.owner} />
                </ErrorBoundary>
            </ErrorBoundary>
        </div>
    );
}
