import { useContext, useEffect, useState } from "react";
import { UserContext } from '../contexts/UserContext.jsx';
import { Navigate, Link } from "react-router-dom";
import axios from "axios";
import { toast } from "react-hot-toast";
import { Shield, User, Lock, Calendar, Home, Heart, MessageCircle, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

export default function ProfilePage() {
    const { ready, user } = useContext(UserContext);
    const [conversations, setConversations] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (user && user.role?.toLowerCase() !== 'admin') {
            axios.get('/chat/conversations').then(res => setConversations(res.data)).catch(() => {});
        }
    }, [user]);

    if (!ready) return (
        <div className="flex flex-col items-center justify-center py-20">
            <div className="w-16 h-16 rounded-2xl shimmer mb-4" />
            <div className="h-4 w-32 shimmer rounded-xl" />
        </div>
    );

    if (ready && !user) return <Navigate to="/login" />;

    const isAdmin = user.role?.toLowerCase() === 'admin';

    async function handleUpdate(e) {
        e.preventDefault();
        const data = {};
        if (e.target.name) data.name = e.target.name.value;
        const oldP = e.target.oldPassword?.value;
        const newP = e.target.password?.value;
        if (newP) {
            if (!oldP) return toast.error('Mevcut şifrenizi girmelisiniz');
            if (newP.length < 6) return toast.error('Yeni şifre en az 6 karakter olmalıdır');
            if (newP === oldP) return toast.error('Yeni şifre eskisiyle aynı olamaz');
            data.oldPassword = oldP;
            data.password = newP;
        }
        setLoading(true);
        try {
            await axios.put('/profile', data);
            toast.success('Profil başarıyla güncellendi');
            if (e.target.oldPassword) e.target.oldPassword.value = '';
            if (e.target.password) e.target.password.value = '';
        } catch (err) {
            toast.error(err.response?.data?.error || 'Güncelleme başarısız oldu');
        } finally {
            setLoading(false);
        }
    }

    const inputClass = "w-full px-4 py-3 rounded-xl border text-sm focus:ring-2 focus:ring-primary-500/20 focus:outline-none";
    const inputStyle = { background: 'var(--surface-2)', borderColor: 'var(--border)', color: 'var(--on-surface)' };

    return (
        <div className="w-full space-y-6">
            {/* Hero card */}
            <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative overflow-hidden rounded-2xl p-8"
                style={{ background: 'linear-gradient(135deg, var(--primary-700) 0%, var(--primary-900) 100%)' }}>
                <div className="relative z-10 flex flex-col sm:flex-row items-center gap-6">
                    <div className="w-20 h-20 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center font-heading font-bold text-3xl text-white">
                        {user.name?.charAt(0).toUpperCase()}
                    </div>
                    <div className="text-center sm:text-left">
                        <h1 className="font-heading font-bold text-2xl text-white">
                            Merhaba, {user.name}!
                        </h1>
                        <p className="text-white/70 text-sm mt-0.5">{user.email}</p>
                        <span className="inline-flex items-center gap-1.5 mt-2 px-3 py-1 rounded-lg text-xs font-semibold bg-white/15 text-white">
                            {isAdmin ? <><Shield size={11} /> Sistem Yöneticisi</> : <><User size={11} /> Gezgin Üye</>}
                        </span>
                    </div>
                </div>
                <div className="absolute -top-10 -right-10 w-64 h-64 rounded-full bg-white/5 pointer-events-none" />
                <div className="absolute -bottom-16 -left-8 w-48 h-48 rounded-full bg-white/5 pointer-events-none" />
            </motion.div>

            {/* Update form */}
            <div className="rounded-2xl border p-6" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
                <h3 className="font-heading font-bold text-lg mb-1" style={{ color: 'var(--on-surface)' }}>Hesap Bilgileri</h3>
                <p className="text-sm mb-6" style={{ color: 'var(--on-surface-2)' }}>Bilgilerinizi buradan güncelleyebilirsiniz.</p>

                <form onSubmit={handleUpdate} className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl">
                    {!isAdmin && (
                        <div className="md:col-span-2">
                            <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'var(--on-surface-2)' }}>Tam Adınız</label>
                            <input name="name" type="text" defaultValue={user.name} required className={inputClass} style={inputStyle} />
                        </div>
                    )}
                    <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'var(--on-surface-2)' }}>Mevcut Şifre</label>
                        <input name="oldPassword" type="password" placeholder="••••••••" className={inputClass} style={inputStyle} />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'var(--on-surface-2)' }}>Yeni Şifre</label>
                        <input name="password" type="password" placeholder="••••••••" minLength={6} className={inputClass} style={inputStyle} />
                    </div>
                    <div className="md:col-span-2">
                        <button type="submit" disabled={loading}
                            className="px-6 py-2.5 rounded-xl text-sm font-semibold text-white bg-primary-600 hover:bg-primary-700 transition-colors disabled:opacity-50">
                            {loading ? 'Güncelleniyor...' : 'Değişiklikleri Kaydet'}
                        </button>
                    </div>
                </form>
            </div>

            {/* Admin panel link */}
            {isAdmin && (
                <Link to="/admin"
                    className="flex items-center justify-between p-6 rounded-2xl border group transition-colors"
                    style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
                    onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--primary-400)'}
                    onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}>
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-primary-600">
                            <Shield size={20} className="text-white" />
                        </div>
                        <div>
                            <h3 className="font-heading font-semibold" style={{ color: 'var(--on-surface)' }}>Yönetim Paneline Git</h3>
                            <p className="text-sm" style={{ color: 'var(--on-surface-2)' }}>Kullanıcıları, ilanları ve sistemi yönetin.</p>
                        </div>
                    </div>
                    <ArrowRight size={18} style={{ color: 'var(--primary-600)' }} className="group-hover:translate-x-1 transition-transform" />
                </Link>
            )}

            {/* Quick links */}
            {!isAdmin && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[
                        { to: '/account/bookings', Icon: Calendar, label: 'Rezervasyonlarım', desc: 'Konaklamalar', color: 'var(--success-600)' },
                        { to: '/account/places', Icon: Home, label: 'İlanlarım', desc: 'Ev sahipliği', color: 'var(--primary-600)' },
                        { to: '/account/wishlist', Icon: Heart, label: 'Favorilerim', desc: 'Beğendiklerim', color: '#ef4444' },
                        { to: '/account/messages', Icon: MessageCircle, label: 'Mesajlarım', desc: `${conversations.length} Sohbet`, color: 'var(--accent-600)' },
                    ].map(({ to, Icon, label, desc, color }) => (
                        <Link key={to} to={to}
                            className="p-5 rounded-2xl border flex flex-col gap-3 group transition-all hover:-translate-y-0.5"
                            style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
                            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${color}20` }}>
                                <Icon size={18} style={{ color }} />
                            </div>
                            <div>
                                <p className="font-semibold text-sm" style={{ color: 'var(--on-surface)' }}>{label}</p>
                                <p className="text-xs" style={{ color: 'var(--on-surface-2)' }}>{desc}</p>
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
}
