import Image from './Image.jsx';
import { useContext, useEffect, useState } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { UserContext } from '../contexts/UserContext.jsx';
import { Heart, MapPin, Star, Lock, Building2, Home, Castle, Sofa, Building } from 'lucide-react';
import { motion } from 'framer-motion';

const PROPERTY_ICONS = {
    apartment: Building2,
    house:     Home,
    villa:     Castle,
    studio:    Sofa,
    building:  Building,
};

const PROPERTY_LABELS = {
    apartment: 'Daire',
    house:     'Ev',
    villa:     'Villa',
    studio:    'Stüdyo',
    building:  'Bina',
};

export default function PropertyCard({ place, onClick, index = 0 }) {
    const { user } = useContext(UserContext);
    const [isWishlisted, setIsWishlisted] = useState(false);

    useEffect(() => {
        if (user?.wishlistIds) {
            setIsWishlisted(user.wishlistIds.includes(place.id || place._id));
        }
    }, [user, place.id, place._id]);

    const handleWishlist = async (e) => {
        e.stopPropagation();
        if (!user) { toast.error('Favorilere eklemek için giriş yapmalısınız'); return; }
        try {
            const placeId = place.id || place._id;
            const { data } = await axios.post('/wishlist/toggle', { placeId });
            setIsWishlisted(data.status === 'added');
            toast.success(data.status === 'added' ? 'Favorilere eklendi!' : 'Favorilerden çıkarıldı.');
        } catch { toast.error('İşlem başarısız.'); }
    };

    const TypeIcon = PROPERTY_ICONS[place.propertyType] || Building2;
    const typeLabel = PROPERTY_LABELS[place.propertyType] || 'Premium';
    const price = place.price || place.pricing?.basePrice || 0;

    return (
        <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.06, duration: 0.4, ease: 'easeOut' }}
            onClick={() => onClick(place.id || place._id)}
            className="property-card cursor-pointer flex flex-col h-full group">

            {/* Image */}
            <div className="relative aspect-[4/3] overflow-hidden rounded-t-2xl bg-[var(--surface-2)]">
                {place.photos?.[0] ? (
                    <Image
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                        src={place.photos[0]}
                        alt={place.title}
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center" style={{ background: 'var(--surface-2)' }}>
                        <Building2 size={36} style={{ color: 'var(--border-2)' }} />
                    </div>
                )}

                {/* Login overlay */}
                {!user && (
                    <div className="absolute inset-0 bg-black/10 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <span className="flex items-center gap-1.5 bg-white/90 text-slate-800 text-xs font-semibold px-3.5 py-2 rounded-full shadow-lg">
                            <Lock size={12} /> Detaylar için giriş yap
                        </span>
                    </div>
                )}

                {/* Wishlist button */}
                <motion.button
                    onClick={handleWishlist}
                    whileTap={{ scale: 0.85 }}
                    className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center rounded-full backdrop-blur-md shadow-md transition-all duration-200"
                    style={{
                        background: isWishlisted ? '#ef4444' : 'rgba(255,255,255,0.85)',
                        color: isWishlisted ? '#fff' : '#6b7280',
                    }}>
                    <Heart size={15} fill={isWishlisted ? 'currentColor' : 'none'} />
                </motion.button>

                {/* Type badge */}
                <div className="absolute top-3 left-3">
                    <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-lg bg-white/90 backdrop-blur-sm text-slate-700 shadow-sm">
                        <TypeIcon size={11} />
                        {typeLabel}
                    </span>
                </div>
            </div>

            {/* Content */}
            <div className="p-4 flex flex-col flex-1">
                <div className="flex items-start justify-between gap-2 mb-1">
                    <div className="flex items-center gap-1 min-w-0">
                        <MapPin size={12} className="flex-shrink-0" style={{ color: 'var(--on-surface-2)' }} />
                        <p className="text-sm font-medium truncate" style={{ color: 'var(--on-surface-2)' }}>
                            {[place.district, place.city].filter(Boolean).join(', ') || 'Konum belirtilmedi'}
                        </p>
                    </div>
                    <div className="flex items-center gap-0.5 flex-shrink-0">
                        <Star size={12} className="star-filled" />
                        <span className="text-xs font-semibold" style={{ color: 'var(--on-surface)' }}>Yeni</span>
                    </div>
                </div>

                <h3 className="font-heading font-semibold text-sm line-clamp-1 mb-3" style={{ color: 'var(--on-surface)' }}>
                    {place.title || 'Başlık belirtilmedi'}
                </h3>

                {/* Specs */}
                {(place.maxGuests || place.bedrooms) && (
                    <div className="flex items-center gap-3 text-xs mb-3" style={{ color: 'var(--on-surface-2)' }}>
                        {place.maxGuests && <span>{place.maxGuests} misafir</span>}
                        {place.bedrooms && <span>·</span>}
                        {place.bedrooms && <span>{place.bedrooms} yatak odası</span>}
                        {place.bathrooms && <span>·</span>}
                        {place.bathrooms && <span>{place.bathrooms} banyo</span>}
                    </div>
                )}

                <div className="mt-auto pt-3 border-t flex items-center justify-between" style={{ borderColor: 'var(--border)' }}>
                    <div>
                        <span className="font-heading font-bold text-lg" style={{ color: 'var(--on-surface)' }}>
                            ₺{price.toLocaleString('tr-TR')}
                        </span>
                        <span className="text-xs ml-1" style={{ color: 'var(--on-surface-2)' }}>/ gece</span>
                    </div>
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-lg badge badge-primary">
                        DwellGo
                    </span>
                </div>
            </div>
        </motion.div>
    );
}
