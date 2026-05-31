import { useContext, useEffect, useState } from "react";
import { differenceInCalendarDays } from "date-fns";
import axios from "axios";
import { Navigate } from "react-router-dom";
import { UserContext } from '../contexts/UserContext.jsx';
import toast from "react-hot-toast";
import { Calendar, Users, User, Phone, Shield, Star } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function BookingWidget({ place }) {
    const today = new Date().toISOString().split('T')[0];
    const [checkIn, setCheckIn] = useState('');
    const [checkOut, setCheckOut] = useState('');
    const [numberOfGuests, setNumberOfGuests] = useState(1);
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [redirect, setRedirect] = useState('');
    const { user } = useContext(UserContext);

    // Admin cannot book — block entirely
    if (user?.role?.toUpperCase() === 'ADMIN') return null;

    // Owner cannot book their own place
    const isOwner = user && (user._id === (place.ownerId || place.owner) || user.id === (place.ownerId || place.owner));
    if (isOwner) return (
        <div className="rounded-2xl border p-5 text-center" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
            <Shield size={24} className="mx-auto mb-2" style={{ color: 'var(--on-surface-2)' }} />
            <p className="text-sm font-semibold" style={{ color: 'var(--on-surface)' }}>Bu sizin ilanınız</p>
            <p className="text-xs mt-1" style={{ color: 'var(--on-surface-2)' }}>Kendi ilanınızı rezerve edemezsiniz.</p>
        </div>
    );

    useEffect(() => {
        if (user) setName(user.name || user.email || '');
    }, [user]);

    let numberOfNights = 0;
    if (checkIn && checkOut) {
        const diff = differenceInCalendarDays(new Date(checkOut), new Date(checkIn));
        numberOfNights = diff > 0 ? diff : 0;
    }

    const basePrice = place.price || 0;
    const cleaningFee = place.pricing?.cleaningFee || 0;
    const serviceFee = place.pricing?.serviceFee || 0;
    const totalBasePrice = basePrice * numberOfNights;
    const totalPrice = totalBasePrice + cleaningFee + serviceFee;

    async function bookThisPlace() {
        if (!user) { setRedirect('/login'); return; }
        if (!checkIn || !checkOut) { toast.error('Lütfen giriş ve çıkış tarihlerini seçin'); return; }
        if (checkIn < today) { toast.error('Geçmiş tarih seçilemez'); return; }
        if (new Date(checkOut) <= new Date(checkIn)) { toast.error('Çıkış tarihi giriş tarihinden sonra olmalı'); return; }
        try {
            await axios.post('/bookings', {
                checkIn, checkOut, name, phone,
                place: place._id || place.id,
                numberOfGuests,
                price: totalPrice,
            });
            toast.success('Rezervasyon oluşturuldu!');
            setRedirect('/account/bookings');
        } catch (err) {
            const msg = err.response?.data?.error || err.response?.data?.message || err.response?.data || 'Rezervasyon başarısız.';
            toast.error(msg);
        }
    }

    if (redirect) return <Navigate to={redirect} />;

    return (
        <div className="rounded-2xl border shadow-card p-5" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
            {/* Price header */}
            <div className="flex items-baseline justify-between mb-5">
                <div>
                    <span className="font-heading font-bold text-2xl" style={{ color: 'var(--on-surface)' }}>
                        ₺{basePrice.toLocaleString('tr-TR')}
                    </span>
                    <span className="text-sm ml-1" style={{ color: 'var(--on-surface-2)' }}>/ gece</span>
                </div>
                <div className="flex items-center gap-1">
                    <Star size={14} className="star-filled" />
                    <span className="text-sm font-semibold" style={{ color: 'var(--on-surface)' }}>Yeni</span>
                </div>
            </div>

            {/* Date & Guest Picker */}
            <div className="rounded-xl border overflow-hidden mb-4" style={{ borderColor: 'var(--border)' }}>
                <div className="grid grid-cols-2 divide-x border-b" style={{ borderColor: 'var(--border)' }}>
                    <div className="p-3">
                        <label className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'var(--on-surface-2)' }}>
                            <Calendar size={10} /> Giriş
                        </label>
                        <input type="date" min={today} value={checkIn}
                            onChange={e => setCheckIn(e.target.value)}
                            className="w-full p-0 m-0 border-none bg-transparent text-sm font-medium focus:ring-0 focus:outline-none"
                            style={{ color: 'var(--on-surface)', boxShadow: 'none' }} />
                    </div>
                    <div className="p-3" style={{ borderColor: 'var(--border)' }}>
                        <label className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'var(--on-surface-2)' }}>
                            <Calendar size={10} /> Çıkış
                        </label>
                        <input type="date" min={checkIn || today} value={checkOut}
                            onChange={e => setCheckOut(e.target.value)}
                            className="w-full p-0 m-0 border-none bg-transparent text-sm font-medium focus:ring-0 focus:outline-none"
                            style={{ color: 'var(--on-surface)', boxShadow: 'none' }} />
                    </div>
                </div>
                <div className="p-3">
                    <label className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'var(--on-surface-2)' }}>
                        <Users size={10} /> Misafir Sayısı
                    </label>
                    <select value={numberOfGuests} onChange={e => setNumberOfGuests(Number(e.target.value))}
                        className="w-full p-0 m-0 border-none bg-transparent text-sm font-medium focus:ring-0 cursor-pointer"
                        style={{ color: 'var(--on-surface)', boxShadow: 'none' }}>
                        {[...Array(place.capacity?.maxGuests || 4)].map((_, i) => (
                            <option key={i + 1} value={i + 1}>{i + 1} Misafir</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Contact info when dates are selected */}
            <AnimatePresence>
                {numberOfNights > 0 && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden mb-4">
                        <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--on-surface-2)' }}>İletişim Bilgileri</p>
                        <div className="space-y-2">
                            <div className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl border" style={{ borderColor: 'var(--border)', background: 'var(--surface-2)' }}>
                                <User size={13} style={{ color: 'var(--on-surface-2)' }} />
                                <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Tam adınız"
                                    className="flex-1 bg-transparent border-none text-sm p-0 m-0 focus:ring-0 focus:outline-none"
                                    style={{ color: 'var(--on-surface)', boxShadow: 'none' }} />
                            </div>
                            <div className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl border" style={{ borderColor: 'var(--border)', background: 'var(--surface-2)' }}>
                                <Phone size={13} style={{ color: 'var(--on-surface-2)' }} />
                                <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="Telefon numaranız"
                                    className="flex-1 bg-transparent border-none text-sm p-0 m-0 focus:ring-0 focus:outline-none"
                                    style={{ color: 'var(--on-surface)', boxShadow: 'none' }} />
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Price Breakdown */}
            <AnimatePresence>
                {numberOfNights > 0 && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="space-y-2.5 mb-5 pb-4 border-b text-sm"
                        style={{ borderColor: 'var(--border)' }}>
                        <div className="flex justify-between" style={{ color: 'var(--on-surface-2)' }}>
                            <span>₺{basePrice.toLocaleString('tr-TR')} × {numberOfNights} gece</span>
                            <span style={{ color: 'var(--on-surface)' }}>₺{totalBasePrice.toLocaleString('tr-TR')}</span>
                        </div>
                        {cleaningFee > 0 && (
                            <div className="flex justify-between" style={{ color: 'var(--on-surface-2)' }}>
                                <span>Temizlik ücreti</span>
                                <span style={{ color: 'var(--on-surface)' }}>₺{cleaningFee}</span>
                            </div>
                        )}
                        {serviceFee > 0 && (
                            <div className="flex justify-between" style={{ color: 'var(--on-surface-2)' }}>
                                <span>Hizmet bedeli</span>
                                <span style={{ color: 'var(--on-surface)' }}>₺{serviceFee}</span>
                            </div>
                        )}
                        <div className="flex justify-between font-heading font-bold pt-3 border-t text-base" style={{ borderColor: 'var(--border)', color: 'var(--on-surface)' }}>
                            <span>Toplam</span>
                            <span>₺{totalPrice.toLocaleString('tr-TR')}</span>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <motion.button
                onClick={bookThisPlace}
                whileTap={{ scale: 0.97 }}
                className="w-full py-3.5 rounded-xl font-semibold text-sm text-white bg-primary-600 shadow-primary hover:bg-primary-700 transition-colors">
                Rezervasyon Yap
            </motion.button>

            <p className="flex items-center justify-center gap-1.5 text-center text-xs mt-3" style={{ color: 'var(--on-surface-2)' }}>
                <Shield size={11} /> Henüz ödeme alınmayacak
            </p>
        </div>
    );
}
