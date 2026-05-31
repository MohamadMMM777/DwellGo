import { useEffect, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import PlaceImg from '../components/PlaceImg.jsx';
import BookingDates from '../components/BookingDates.jsx';
import { Home, TrendingUp, User, Phone, CheckCircle, XCircle, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { useConfirm } from '../contexts/ConfirmContext.jsx';

function GuestAvatar({ booking, guestLabel }) {
    const guest = booking.user;
    const guestId = guest?._id || guest?.id;
    const guestName = guest?.name || booking.name || '?';
    return (
        <Link to={guestId ? `/user/${guestId}` : '#'} onClick={e => e.stopPropagation()}
            className="flex items-center gap-2 mt-3 px-3 py-2 rounded-xl border transition-opacity hover:opacity-80"
            style={{ background: 'var(--surface-2)', borderColor: 'var(--border)' }}>
            <div className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold text-white bg-gradient-to-br from-primary-500 to-primary-700 flex-shrink-0">
                {guestName.charAt(0).toUpperCase()}
            </div>
            <div>
                <p className="text-xs font-semibold" style={{ color: 'var(--on-surface)' }}>{guestName}</p>
                <p className="text-[10px]" style={{ color: 'var(--on-surface-2)' }}>{guestLabel}</p>
            </div>
            <ArrowRight size={10} className="ml-auto" style={{ color: 'var(--on-surface-2)' }} />
        </Link>
    );
}

export default function HostBookingsPage() {
    const { t } = useTranslation();
    const confirm = useConfirm();
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [acting, setActing] = useState(null);

    const STATUS_STYLES = {
        PENDING:   { label: t('booking.statusAwaitingDecision'), color: 'bg-yellow-100 text-yellow-700' },
        APPROVED:  { label: t('admin.statusApproved'), color: 'bg-blue-100 text-blue-700' },
        CONFIRMED: { label: t('admin.statusPaid'), color: 'bg-green-100 text-green-700' },
        CANCELLED: { label: t('admin.statusCancelled'), color: 'bg-red-100 text-red-600' },
        COMPLETED: { label: t('admin.statusDone'), color: 'bg-gray-100 text-gray-600' },
    };

    const fetchBookings = () => {
        axios.get('/bookings/host')
            .then(({ data }) => setBookings(Array.isArray(data) ? data : []))
            .catch(() => toast.error(t('booking.loadFailed')))
            .finally(() => setLoading(false));
    };

    useEffect(() => { fetchBookings(); }, []);

    const handleApprove = async (bookingId) => {
        setActing(bookingId + '_approve');
        try {
            await axios.post(`/bookings/${bookingId}/approve`);
            toast.success(t('booking.approveSuccess'));
            fetchBookings();
        } catch (err) {
            toast.error(err.response?.data?.error || t('booking.approveFailed'));
        } finally {
            setActing(null);
        }
    };

    const handleReject = async (bookingId) => {
        const reason = await confirm({
            title: t('booking.rejectReasonTitle'),
            message: t('booking.rejectReasonMessage'),
            input: true,
            inputPlaceholder: t('booking.rejectReasonPlaceholder'),
            inputMultiline: true,
            confirmLabel: t('booking.reject'),
            cancelLabel: t('common.cancel'),
        });
        if (reason === null) return;
        setActing(bookingId + '_reject');
        try {
            await axios.post(`/bookings/${bookingId}/reject`, { reason });
            toast.success(t('booking.rejectSuccess'));
            fetchBookings();
        } catch (err) {
            toast.error(err.response?.data?.error || t('booking.rejectFailed'));
        } finally {
            setActing(null);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center py-16">
                <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
            </div>
        );
    }

    return (
        <div>
            <h1 className="font-heading font-bold text-xl mb-6" style={{ color: 'var(--on-surface)' }}>
                {t('booking.incomingTitle')}
            </h1>

            {bookings.length > 0 ? (
                <div className="flex flex-col gap-4">
                    {bookings.map((booking, i) => {
                        const statusInfo = STATUS_STYLES[booking.status] || { label: booking.status, color: 'bg-gray-100 text-gray-600' };
                        return (
                            <motion.div key={booking._id}
                                initial={{ opacity: 0, y: 12 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.05 }}
                                className="flex gap-4 rounded-2xl overflow-hidden border"
                                style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
                                <div className="w-40 shrink-0">
                                    <PlaceImg place={booking.place} className="w-full h-full object-cover" />
                                </div>
                                <div className="py-4 pr-4 flex-1 min-w-0">
                                    <div className="flex items-start justify-between gap-2">
                                        <h2 className="font-heading font-semibold truncate" style={{ color: 'var(--on-surface)' }}>
                                            {booking.place?.title}
                                        </h2>
                                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ${statusInfo.color}`}>
                                            {statusInfo.label}
                                        </span>
                                    </div>
                                    <div className="mt-2">
                                        <BookingDates booking={booking} />

                                        {/* Guest Info */}
                                        <div className="mt-3 p-3 rounded-xl border text-sm"
                                            style={{ background: 'var(--surface-2)', borderColor: 'var(--border)' }}>
                                            <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--on-surface-2)' }}>
                                                {t('admin.guestInfo')}
                                            </p>
                                            <div className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--on-surface)' }}>
                                                <User size={11} /> {booking.name}
                                            </div>
                                            <div className="flex items-center gap-1.5 text-xs mt-1" style={{ color: 'var(--on-surface)' }}>
                                                <Phone size={11} /> {booking.phone}
                                            </div>
                                        </div>
                                        <GuestAvatar booking={booking} guestLabel={t('booking.guestLabel')} />

                                        {/* Revenue */}
                                        <div className="flex items-center gap-1.5 mt-3">
                                            <TrendingUp size={13} style={{ color: 'var(--success-600)' }} />
                                            <span className="font-bold text-sm" style={{ color: 'var(--success-600)' }}>
                                                ₺{booking.totalPrice?.toFixed(2)}
                                                {booking.paymentStatus === 'PAID' && <span className="ml-1 text-xs font-medium">· {t('booking.paid')} ✓</span>}
                                            </span>
                                        </div>

                                        {/* Action Buttons — only for PENDING */}
                                        {booking.status === 'PENDING' && (
                                            <div className="flex gap-2 mt-3">
                                                <button
                                                    onClick={() => handleApprove(booking._id)}
                                                    disabled={!!acting}
                                                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-green-600 text-white text-xs font-semibold hover:bg-green-700 transition disabled:opacity-50">
                                                    <CheckCircle size={13} />
                                                    {acting === booking._id + '_approve' ? t('booking.approving') : t('booking.approve')}
                                                </button>
                                                <button
                                                    onClick={() => handleReject(booking._id)}
                                                    disabled={!!acting}
                                                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-red-100 text-red-600 text-xs font-semibold hover:bg-red-200 transition disabled:opacity-50">
                                                    <XCircle size={13} />
                                                    {acting === booking._id + '_reject' ? t('booking.rejecting') : t('booking.reject')}
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            ) : (
                <div className="text-center py-16 rounded-2xl border" style={{ borderColor: 'var(--border)' }}>
                    <Home size={36} className="mx-auto mb-3 opacity-20" style={{ color: 'var(--on-surface-2)' }} />
                    <p className="font-medium text-sm" style={{ color: 'var(--on-surface)' }}>{t('booking.noIncomingBookings')}</p>
                    <Link to="/account/places" className="mt-3 inline-block text-sm font-semibold text-primary-600 hover:text-primary-700 transition-colors">
                        {t('booking.manageListings')} →
                    </Link>
                </div>
            )}
        </div>
    );
}
