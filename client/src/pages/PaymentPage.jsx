import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-hot-toast";
import { CreditCard, Lock, AlertCircle } from "lucide-react";
import { useTranslation } from 'react-i18next';

export default function PaymentPage() {
    const { t } = useTranslation();
    const { id } = useParams();
    const navigate = useNavigate();
    const [booking, setBooking] = useState(null);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(false);
    const [card, setCard] = useState({
        name: "",
        number: "",
        expiry: "",
        cvv: "",
    });

    useEffect(() => {
        if (!id) return;
        axios
            .get(`/bookings/${id}`)
            .then((res) => {
                if (res.data.status !== "APPROVED") {
                    toast.error(t('payment.notReadyForPayment'));
                    navigate("/account/bookings");
                    return;
                }
                setBooking(res.data);
                setLoading(false);
            })
            .catch(() => {
                toast.error(t('payment.bookingNotFound'));
                navigate("/account/bookings");
            });
    }, [id, navigate, t]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setCard((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!card.name.trim()) return toast.error(t('payment.cardholderNameRequired'));
        if (card.number.replace(/\s/g, "").length < 16) return toast.error(t('payment.invalidCardNumber'));
        if (card.expiry.length < 5) return toast.error(t('payment.invalidExpiry'));
        if (card.cvv.length < 3) return toast.error(t('payment.invalidCvv'));

        setProcessing(true);
        try {
            await axios.post(`/bookings/${id}/confirm`, { card });
            toast.success(t('payment.paymentSuccess'));
            navigate("/account/bookings");
        } catch (err) {
            toast.error(err.response?.data?.error || t('payment.paymentFailed'));
        } finally {
            setProcessing(false);
        }
    };

    if (loading)
        return (
            <div className="flex justify-center py-20">
                <div className="w-10 h-10 rounded-full border-3 border-primary-200 border-t-primary-600 animate-spin" />
            </div>
        );

    if (!booking) return null;

    const checkIn = new Date(booking.checkIn);
    const checkOut = new Date(booking.checkOut);
    const nights = Math.round((checkOut - checkIn) / (1000 * 60 * 60 * 24));

    return (
        <div className="max-w-2xl mx-auto">
            <h1 className="font-heading font-bold text-2xl mb-6" style={{ color: 'var(--on-surface)' }}>
                {t('payment.title')}
            </h1>

            {/* Order Summary */}
            <div className="rounded-2xl border p-6 mb-6" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
                <h2 className="font-heading font-semibold text-lg mb-4" style={{ color: 'var(--on-surface)' }}>
                    {t('payment.orderSummary')}
                </h2>
                <div className="space-y-3">
                    <div className="flex justify-between">
                        <span style={{ color: 'var(--on-surface-2)' }}>{booking.place?.title}</span>
                        <span style={{ color: 'var(--on-surface)' }} className="font-semibold">
                            ₺{booking.place?.price?.toFixed(2)} × {nights} gece
                        </span>
                    </div>
                    <div className="border-t pt-3" style={{ borderColor: 'var(--border)' }}>
                        <div className="flex justify-between">
                            <span className="font-semibold" style={{ color: 'var(--on-surface)' }}>{t('booking.total')}</span>
                            <span className="font-bold text-lg text-primary-600">
                                ₺{booking.totalPrice?.toFixed(2)}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Payment Form */}
            <div className="rounded-2xl border p-6" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
                <div className="flex items-center gap-2 mb-6">
                    <Lock size={18} style={{ color: 'var(--primary-600)' }} />
                    <p className="text-sm" style={{ color: 'var(--on-surface-2)' }}>
                        {t('payment.secureNotice')}
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Cardholder Name */}
                    <div>
                        <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--on-surface)' }}>
                            {t('payment.cardholderName')}
                        </label>
                        <input
                            type="text"
                            name="name"
                            value={card.name}
                            onChange={handleChange}
                            placeholder={t('profile.fullNamePlaceholder')}
                            className="w-full px-4 py-3 rounded-xl border text-sm focus:ring-2 focus:ring-primary-500/20 focus:outline-none"
                            style={{ background: 'var(--surface-2)', borderColor: 'var(--border)', color: 'var(--on-surface)' }}
                            required
                        />
                    </div>

                    {/* Card Number */}
                    <div>
                        <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--on-surface)' }}>
                            {t('payment.cardNumber')}
                        </label>
                        <input
                            type="text"
                            name="number"
                            value={card.number}
                            onChange={(e) =>
                                setCard((prev) => ({
                                    ...prev,
                                    number: e.target.value.replace(/\D/g, "").slice(0, 16),
                                }))
                            }
                            placeholder="1234 5678 9012 3456"
                            className="w-full px-4 py-3 rounded-xl border text-sm focus:ring-2 focus:ring-primary-500/20 focus:outline-none"
                            style={{ background: 'var(--surface-2)', borderColor: 'var(--border)', color: 'var(--on-surface)' }}
                            required
                        />
                    </div>

                    {/* Expiry & CVV */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--on-surface)' }}>
                                {t('payment.expiry')}
                            </label>
                            <input
                                type="text"
                                name="expiry"
                                value={card.expiry}
                                onChange={(e) => {
                                    let val = e.target.value.replace(/\D/g, "").slice(0, 4);
                                    if (val.length >= 2) val = val.slice(0, 2) + "/" + val.slice(2);
                                    setCard((prev) => ({ ...prev, expiry: val }));
                                }}
                                placeholder="MM/YY"
                                className="w-full px-4 py-3 rounded-xl border text-sm focus:ring-2 focus:ring-primary-500/20 focus:outline-none"
                                style={{ background: 'var(--surface-2)', borderColor: 'var(--border)', color: 'var(--on-surface)' }}
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--on-surface)' }}>
                                {t('payment.cvv')}
                            </label>
                            <input
                                type="text"
                                name="cvv"
                                value={card.cvv}
                                onChange={(e) =>
                                    setCard((prev) => ({
                                        ...prev,
                                        cvv: e.target.value.replace(/\D/g, "").slice(0, 3),
                                    }))
                                }
                                placeholder="123"
                                className="w-full px-4 py-3 rounded-xl border text-sm focus:ring-2 focus:ring-primary-500/20 focus:outline-none"
                                style={{ background: 'var(--surface-2)', borderColor: 'var(--border)', color: 'var(--on-surface)' }}
                                required
                            />
                        </div>
                    </div>

                    {/* Warning */}
                    <div className="flex gap-3 p-4 rounded-xl border" style={{ background: 'rgba(245,158,11,0.08)', borderColor: 'rgba(245,158,11,0.25)' }}>
                        <AlertCircle size={18} style={{ color: '#f59e0b', flexShrink: 0, marginTop: 2 }} />
                        <p className="text-xs" style={{ color: '#f59e0b' }}>
                            {t('payment.secureNotice')}
                        </p>
                    </div>

                    {/* Submit Button */}
                    <button
                        type="submit"
                        disabled={processing}
                        className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold text-white bg-primary-600 hover:bg-primary-700 transition-colors disabled:opacity-50"
                    >
                        <CreditCard size={16} />
                        {processing ? t('payment.paying') : t('payment.payNow')}
                    </button>
                </form>
            </div>
        </div>
    );
}
