import { useEffect, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { Star } from 'lucide-react';
import { motion } from 'framer-motion';

function StarDisplay({ value }) {
    return (
        <div className="flex gap-0.5">
            {[1, 2, 3, 4, 5].map(n => (
                <Star key={n} size={13}
                    fill={n <= value ? 'var(--star-color)' : 'none'}
                    style={{ color: n <= value ? 'var(--star-color)' : 'var(--border-2)' }} />
            ))}
        </div>
    );
}

export default function ReviewsAboutMePage() {
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        axios.get('/user-reviews/received').then(res => {
            setReviews(res.data);
            setLoading(false);
        }).catch(() => setLoading(false));
    }, []);

    if (loading) return (
        <div className="text-center py-16 text-sm" style={{ color: 'var(--on-surface-2)' }}>Yükleniyor...</div>
    );

    return (
        <div>
            <h1 className="font-heading font-bold text-xl mb-6" style={{ color: 'var(--on-surface)' }}>Hakkımdaki Değerlendirmeler</h1>

            {reviews.length === 0 ? (
                <div className="text-center py-16 rounded-2xl border" style={{ borderColor: 'var(--border)' }}>
                    <Star size={36} className="mx-auto mb-3 opacity-20" style={{ color: 'var(--on-surface-2)' }} />
                    <p className="text-sm" style={{ color: 'var(--on-surface-2)' }}>Mekanlarınıza henüz değerlendirme yapılmamış.</p>
                </div>
            ) : (
                <div className="grid gap-4 md:grid-cols-2">
                    {reviews.map((review, i) => (
                        <motion.div key={review._id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.05 }}
                            className="rounded-2xl border p-5 flex flex-col gap-3"
                            style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
                            <div className="flex items-center gap-3">
                                <Link to={`/user/${review.user?._id}`}
                                    className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm uppercase text-white bg-gradient-to-br from-primary-500 to-primary-700 flex-shrink-0 hover:scale-105 transition-transform">
                                    {review.user?.name?.charAt(0) || '?'}
                                </Link>
                                <div className="flex-1 min-w-0">
                                    <Link to={`/user/${review.user?._id}`}
                                        className="font-semibold text-sm hover:text-primary-600 transition-colors truncate block"
                                        style={{ color: 'var(--on-surface)' }}>
                                        {review.user?.name || 'Kullanıcı'}
                                    </Link>
                                    <p className="text-xs" style={{ color: 'var(--on-surface-2)' }}>
                                        {new Date(review.createdAt).toLocaleDateString('tr-TR', { year: 'numeric', month: 'long', day: 'numeric' })}
                                    </p>
                                </div>
                            </div>

                            <p className="text-xs border-b pb-2" style={{ color: 'var(--on-surface-2)', borderColor: 'var(--border)' }}>
                                İlan: <Link to={`/place/${review.place?._id}`}
                                    className="text-primary-600 hover:underline font-medium">{review.place?.title}</Link>
                            </p>

                            <div className="space-y-1.5">
                                {review.rating && <StarDisplay value={review.rating} />}
                                {review.comment && (
                                    <p className="text-sm leading-relaxed" style={{ color: 'var(--on-surface-2)' }}>{review.comment}</p>
                                )}
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}
        </div>
    );
}
