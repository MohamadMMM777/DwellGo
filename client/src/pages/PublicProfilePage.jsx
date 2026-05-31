import { useContext, useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import PropertyCard from '../components/PropertyCard.jsx';
import { UserContext } from '../contexts/UserContext.jsx';
import { MessageCircle, Home, Star, MapPin, Shield, User, Check } from 'lucide-react';
import { motion } from 'framer-motion';

export default function PublicProfilePage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user: currentUser } = useContext(UserContext);
    const [profileData, setProfileData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [msgLoading, setMsgLoading] = useState(false);

    useEffect(() => {
        axios.get(`/users/${id}`).then(res => {
            setProfileData(res.data);
            setLoading(false);
        }).catch(() => setLoading(false));
    }, [id]);

    if (loading) return (
        <div className="flex items-center justify-center min-h-[60vh]">
            <div className="w-10 h-10 rounded-full border-2 border-primary-600 border-t-transparent animate-spin" />
        </div>
    );

    if (!profileData?.user) return (
        <div className="py-24 text-center">
            <User size={48} className="mx-auto mb-4 opacity-20" style={{ color: 'var(--on-surface-2)' }} />
            <h1 className="font-heading font-bold text-2xl mb-3" style={{ color: 'var(--on-surface)' }}>Kullanıcı Bulunamadı</h1>
            <p className="text-sm mb-6" style={{ color: 'var(--on-surface-2)' }}>Aradığınız profil mevcut değil veya silinmiş olabilir.</p>
            <Link to="/" className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-primary-600 hover:bg-primary-700 transition-colors">
                Ana Sayfaya Dön
            </Link>
        </div>
    );

    const { user, places, averageRating, totalReviews } = profileData;

    async function handleMessage() {
        setMsgLoading(true);
        try {
            const res = await axios.post('/chat/conversations', { otherUserId: user.id || user._id });
            navigate(`/account/messages?conv=${res.data._id || res.data.id}`);
        } catch (err) {
            const msg = err.response?.data?.message;
            toast.error(msg || 'Mesaj gönderilemedi, lütfen tekrar deneyin.');
            setMsgLoading(false);
        }
    }

    const canMessage = !!currentUser && currentUser.role?.toUpperCase() !== 'ADMIN' && (currentUser._id !== (user.id || user._id));

    return (
        <div className="max-w-5xl mx-auto space-y-6">
            {/* Profile header */}
            <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative overflow-hidden rounded-2xl p-8 border"
                style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
                <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
                    <div className="w-20 h-20 rounded-2xl flex items-center justify-center font-heading font-bold text-3xl text-white bg-gradient-to-br from-primary-500 to-primary-700 flex-shrink-0">
                        {user.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 text-center sm:text-left">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-3">
                            <h1 className="font-heading font-bold text-2xl" style={{ color: 'var(--on-surface)' }}>{user.name}</h1>
                            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold ${user.role?.toUpperCase() === 'ADMIN' ? 'badge badge-warning' : 'badge badge-primary'}`}>
                                {user.role?.toUpperCase() === 'ADMIN' ? <><Shield size={10} /> Yönetici</> : <><User size={10} /> Onaylı Üye</>}
                            </span>
                        </div>

                        <div className="flex flex-wrap justify-center sm:justify-start gap-4 text-sm mb-4" style={{ color: 'var(--on-surface-2)' }}>
                            <span className="flex items-center gap-1.5"><Home size={13} /> <strong style={{ color: 'var(--on-surface)' }}>{places.length}</strong> İlan</span>
                            <span className="flex items-center gap-1.5"><MessageCircle size={13} /> <strong style={{ color: 'var(--on-surface)' }}>{totalReviews}</strong> Değerlendirme</span>
                            {totalReviews > 0 && (
                                <span className="flex items-center gap-1.5"><Star size={13} style={{ color: 'var(--star-color)' }} /> <strong style={{ color: 'var(--on-surface)' }}>{averageRating}</strong> / 5.0</span>
                            )}
                        </div>

                        <div className="flex flex-wrap justify-center sm:justify-start gap-2 mb-4">
                            {[{ label: 'Kimlik Doğrulandı' }, { label: 'E-posta Onaylı' }].map(({ label }) => (
                                <span key={label} className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium badge badge-success">
                                    <Check size={10} /> {label}
                                </span>
                            ))}
                        </div>

                        {canMessage && (
                            <button onClick={handleMessage} disabled={msgLoading}
                                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-primary-600 hover:bg-primary-700 transition-colors disabled:opacity-50 mx-auto sm:mx-0">
                                <MessageCircle size={14} />
                                {msgLoading ? 'Hazırlanıyor...' : 'Mesaj Gönder'}
                            </button>
                        )}
                    </div>
                </div>
                <div className="absolute -top-10 -right-10 w-48 h-48 rounded-full opacity-5" style={{ background: 'var(--primary-500)' }} />
            </motion.div>

            {/* Bio & Listings */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="space-y-4">
                    <div className="rounded-2xl border p-5" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
                        <h3 className="font-heading font-semibold mb-3" style={{ color: 'var(--on-surface)' }}>Hakkında</h3>
                        <p className="text-sm leading-relaxed italic" style={{ color: 'var(--on-surface-2)' }}>
                            "{user.profile?.bio || 'DwellGo üyesi olarak heyecan verici konaklamalar sunuyor.'}"
                        </p>
                    </div>
                    <div className="rounded-2xl border p-5" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
                        <h3 className="font-heading font-semibold mb-3" style={{ color: 'var(--on-surface)' }}>Konum</h3>
                        <p className="flex items-center gap-1.5 text-sm" style={{ color: 'var(--on-surface-2)' }}>
                            <MapPin size={13} /> {user.profile?.address || 'Türkiye'}
                        </p>
                    </div>
                </div>

                <div className="lg:col-span-2">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="font-heading font-semibold" style={{ color: 'var(--on-surface)' }}>
                            {user.name}'in İlanları
                        </h2>
                        <span className="text-sm" style={{ color: 'var(--on-surface-2)' }}>{places.length} ilan</span>
                    </div>

                    {places.length > 0 ? (
                        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
                            {places.map((place, i) => (
                                <PropertyCard key={place.id || place._id} place={place} index={i}
                                    onClick={() => navigate(`/place/${place.id || place._id}`)} />
                            ))}
                        </div>
                    ) : (
                        <div className="py-16 text-center rounded-2xl border-2 border-dashed" style={{ borderColor: 'var(--border)' }}>
                            <Home size={36} className="mx-auto mb-3 opacity-20" style={{ color: 'var(--on-surface-2)' }} />
                            <p className="text-sm" style={{ color: 'var(--on-surface-2)' }}>Bu kullanıcının henüz aktif bir ilanı bulunmuyor.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
