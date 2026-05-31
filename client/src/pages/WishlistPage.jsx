import { useEffect, useState } from "react";
import axios from "axios";
import PropertyCard from "../components/PropertyCard.jsx";
import { useNavigate } from "react-router-dom";
import { Heart, Compass } from 'lucide-react';

export default function WishlistPage() {
    const [wishlist, setWishlist] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        axios.get('/wishlist').then(({ data }) => {
            setWishlist(data);
            setLoading(false);
        }).catch(() => setLoading(false));
    }, []);

    if (loading) return (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map(n => (
                <div key={n} className="rounded-2xl shimmer aspect-[3/4]" />
            ))}
        </div>
    );

    return (
        <div>
            <div className="flex items-center gap-3 mb-8">
                <Heart size={20} style={{ color: '#ef4444' }} fill="#ef4444" />
                <h1 className="font-heading font-bold text-xl" style={{ color: 'var(--on-surface)' }}>Favorilerim</h1>
                {wishlist.length > 0 && (
                    <span className="badge badge-primary ml-auto">{wishlist.length} İlan</span>
                )}
            </div>

            {wishlist.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {wishlist.map((place, i) => (
                        <PropertyCard key={place._id} place={place} index={i} onClick={id => navigate('/place/' + id)} />
                    ))}
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center py-20 rounded-2xl border-2 border-dashed"
                    style={{ borderColor: 'var(--border)' }}>
                    <Heart size={48} className="mb-4 opacity-20" style={{ color: 'var(--on-surface-2)' }} />
                    <h2 className="font-heading font-bold text-lg mb-2" style={{ color: 'var(--on-surface)' }}>Henüz favori eklenmedi</h2>
                    <p className="text-sm mb-6" style={{ color: 'var(--on-surface-2)' }}>Beğendiğiniz yerleri kalbe tıklayarak buraya ekleyebilirsiniz.</p>
                    <button onClick={() => navigate('/')}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-primary-600 hover:bg-primary-700 transition-colors">
                        <Compass size={14} /> Keşfetmeye Başla
                    </button>
                </div>
            )}
        </div>
    );
}
