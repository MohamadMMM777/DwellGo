import { useEffect, useState } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import PlaceImg from '../components/PlaceImg.jsx';
import BookingDates from '../components/BookingDates.jsx';
import { Luggage, CreditCard, ArrowRight, XCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { useConfirm } from '../contexts/ConfirmContext.jsx';

function OwnerAvatar({ owner, hostLabel }) {
    if (!owner) return null;
    return (
        <Link to={`/user/${owner._id || owner.id}`} onClick={e => e.stopPropagation()}
            className="flex items-center gap-2 mt-3 px-3 py-2 rounded-xl border transition-opacity hover:opacity-80"
            style={{ background: 'var(--surface-2)', borderColor: 'var(--border)' }}>
            <div className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold text-white bg-gradient-to-br from-primary-500 to-primary-700 flex-shrink-0">
                {owner.name?.charAt(0)?.toUpperCase() || '?'}
            </div>
            <div>
                <p className="text-xs font-semibold" style={{ color: 'var(--on-surface)' }}>{owner.name}</p>
                <p className="text-[10px]" style={{ color: 'var(--on-surface-2)' }}>{hostLabel}</p>
            </div>
            <ArrowRight size={10} className="ml-auto" style={{ color: 'var(--on-surface-2)' }} />
        </Link>
    );
}

export default function GuestBookingsPage() {
    const { t } = useTranslation();
    const confirm = useConfirm();
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [cancelling, setCancelling] = useState(null);
    const navigate = useNavigate();

    const STATUS_STYLES = {
        PENDING:   { label: t('booking.statusPending'), color: 'bg-yellow-100 text-yellow-700' },
        APPROVED:  { label: t('booking.statusApprovedGuest'), color: 'bg-blue-100 text-blue-700' },
        CONFIRMED: { label: t('booking.statusConfirmed'), color: 'bg-green-100 text-green-700' },
        CANCELLED: { label: t('booking.statusCancelled'), color: 'bg-red-100 text-red-600' },
        COMPLETED: { label: t('booking.statusCompleted'), color: 'bg-gray-100 text-gray-600' },
    };

    const fetchBookings = () => {
        axios.get('/bookings/guest')
            .then(({ data }) => setBookings(Array.isArray(data) ? data : []))
            .catch(() => toast.error(t('booking.loadFailed')))
            .finally(() => setLoading(false));
    };

    useEffect(() => { fetchBookings(); }, []);

    const handleCancel = async (bookingId) => {
        const ok = await confirm({
            title: t('booking.cancelConfirmTitle'),
            message: t('booking.cancelConfirmMessage'),
            confirmLabel: t('booking.cancelButton'),
            cancelLabel: t('common.back'),
            danger: true,
        });
        if (!ok) return;
        setCancelling(bookingId);
        try {
            await axios.post(`/bookings/${bookingId}/cancel`);
            toast.success(t('booking.cancelSuccess'));
            fetchBookings();
        } catch (err) {
            toast.error(err.response?.data?.error || t('booking.cancelFailed'));
        } finally {
            setCancelling(null);
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
                {t('booking.myTripsTitle')}
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
                                <Link to={`/account/bookings/${booking._id}`} className="w-40 shrink-0">
                                    <PlaceImg place={booking.place} className="w-full h-full object-cover" />
                                </Link>
                                <div className="py-4 pr-4 flex-1 min-w-0">
                                    <div className="flex items-start justify-between gap-2">
                                        <Link to={`/account/bookings/${booking._id}`}>
                                            <h2 className="font-heading font-semibold hover:text-primary-600 transition-colors truncate" style={{ color: 'var(--on-surface)' }}>
                                                {booking.place?.title}
                                            </h2>
                                        </Link>
                                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ${statusInfo.color}`}>
                                            {statusInfo.label}
                                        </span>
                                    </div>
                                    <div className="mt-2">
                                        <BookingDates booking={booking} />
                                        <div className="flex items-center gap-1.5 mt-2">
                                            <CreditCard size={13} style={{ color: 'var(--primary-500)' }} />
                                            <span className="font-bold text-sm" style={{ color: 'var(--primary-600)' }}>
                                                {t('booking.total')}: ₺{booking.totalPrice?.toFixed(2)}
                                            </span>
                                            {booking.paymentStatus === 'PAID' && (
                                                <span className="text-xs text-green-600 font-medium ml-1">· {t('booking.paid')}</span>
                                            )}
                                        </div>
                                        <OwnerAvatar owner={booking.place?.owner} hostLabel={t('booking.hostLabel')} />

                                        {/* Action Buttons */}
                                        <div className="flex gap-2 mt-3">
                                            {/* PAY button for APPROVED bookings */}
                                            {booking.status === 'APPROVED' && (
                                                <button
                                                    onClick={() => navigate(`/account/bookings/${booking._id}/pay`)}
                                                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary-600 text-white text-xs font-semibold hover:bg-primary-700 transition">
                                                    <CreditCard size={13} />
                                                    {t('booking.completePayment')}
                                                </button>
                                            )}

                                            {/* CANCEL button for PENDING and APPROVED */}
                                            {['PENDING', 'APPROVED'].includes(booking.status) && (
                                                <button
                                                    onClick={() => handleCancel(booking._id)}
                                                    disabled={cancelling === booking._id}
                                                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-semibold transition disabled:opacity-50"
                                                    style={{ borderColor: 'var(--border)', color: 'var(--on-surface-2)' }}>
                                                    <XCircle size={13} />
                                                    {cancelling === booking._id ? t('booking.cancelling') : t('booking.cancelButton')}
                                                </button>
                                            )}

                                            {/* REVIEW button for COMPLETED */}
                                            {booking.status === 'COMPLETED' && (
                                                <Link
                                                    to={`/place/${booking.place?._id}`}
                                                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-semibold transition hover:bg-[var(--surface-2)]"
                                                    style={{ borderColor: 'var(--border)', color: 'var(--on-surface)' }}>
                                                    {t('booking.leaveReview')}
                                                </Link>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            ) : (
                <div className="text-center py-16 rounded-2xl border" style={{ borderColor: 'var(--border)' }}>
                    <Luggage size={36} className="mx-auto mb-3 opacity-20" style={{ color: 'var(--on-surface-2)' }} />
                    <p className="font-medium text-sm" style={{ color: 'var(--on-surface)' }}>{t('booking.noBookingsYet')}</p>
                    <Link to="/" className="mt-3 inline-block text-sm font-semibold text-primary-600 hover:text-primary-700 transition-colors">
                        {t('booking.exploreListings')} →
                    </Link>
                </div>
            )}
        </div>
    );
}
