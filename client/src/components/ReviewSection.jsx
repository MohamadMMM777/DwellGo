import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { UserContext } from '../contexts/UserContext';
import { Link } from 'react-router-dom';
import { Star, Edit3, Trash2, X, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useConfirm } from '../contexts/ConfirmContext.jsx';

function StarRating({ value, onChange, hover, onHover, onLeave, size = 24 }) {
    return (
        <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map(n => (
                <button key={n} type="button"
                    onClick={() => onChange(value === n ? 0 : n)}
                    onMouseEnter={() => onHover && onHover(n)}
                    onMouseLeave={() => onLeave && onLeave(0)}
                    className="transition-transform hover:scale-110 active:scale-90">
                    <Star size={size}
                        fill={(hover || value) >= n ? 'var(--star-color)' : 'none'}
                        style={{ color: (hover || value) >= n ? 'var(--star-color)' : 'var(--border-2)' }}
                    />
                </button>
            ))}
        </div>
    );
}

function StarDisplay({ value, size = 14 }) {
    return (
        <div className="flex items-center gap-0.5">
            {[1, 2, 3, 4, 5].map(n => (
                <Star key={n} size={size}
                    fill={n <= value ? 'var(--star-color)' : 'none'}
                    style={{ color: n <= value ? 'var(--star-color)' : 'var(--border-2)' }}
                />
            ))}
        </div>
    );
}

export default function ReviewSection({ placeId, ownerId }) {
    const { t } = useTranslation();
    const confirm = useConfirm();
    const { user } = useContext(UserContext);
    const [reviews, setReviews] = useState([]);
    const [rating, setRating] = useState(0);
    const [hoverRating, setHoverRating] = useState(0);
    const [comment, setComment] = useState('');
    const [average, setAverage] = useState(0);
    const [editingMode, setEditingMode] = useState(false);
    const [editingReviewId, setEditingReviewId] = useState(null);

    const isRegularUser = user?.role?.toUpperCase() === 'USER';
    const userId = user?._id || user?.id;
    const isOwner = userId && (userId === ownerId || userId === ownerId?.toString());
    const [hasCompletedBooking, setHasCompletedBooking] = useState(false);

    useEffect(() => {
        if (!user || !isRegularUser) return;
        // Check if user has a completed booking for this place
        axios.get('/bookings/guest').then(res => {
            const data = Array.isArray(res.data) ? res.data : [];
            const completed = data.some(b =>
                (b.placeId === placeId || b.place?.id === placeId || b.place?._id === placeId) &&
                b.status === 'COMPLETED'
            );
            setHasCompletedBooking(completed);
        }).catch(() => {});
    }, [user, placeId, isRegularUser]);

    useEffect(() => { fetchReviews(); }, [placeId]);

    function fetchReviews() {
        axios.get(`/places/${placeId}/reviews`).then(res => {
            setReviews(res.data.reviews);
            setAverage(res.data.averageRating);
        }).catch(() => {});
    }

    const userReview = user ? reviews.find(r => {
        const rId = r.user?._id || r.user?.id;
        return rId && rId === userId;
    }) : null;
    const otherReviews = user ? reviews.filter(r => {
        const rId = r.user?._id || r.user?.id;
        return !(rId && rId === userId);
    }) : reviews;

    async function submitReview(e) {
        if (e) e.preventDefault();
        if (rating === 0 && !comment.trim()) return toast.error(t('reviews.ratingOrCommentRequired'));
        try {
            const data = { comment: comment.trim() };
            if (rating > 0) data.rating = rating;
            if (editingMode && editingReviewId) {
                await axios.put(`/user-reviews/${editingReviewId}`, data);
                toast.success(t('reviews.updateSuccess'));
                setEditingMode(false); setEditingReviewId(null);
            } else {
                await axios.post(`/places/${placeId}/reviews`, data);
                toast.success(t('reviews.addSuccess'));
            }
            setComment(''); setRating(0);
            fetchReviews();
        } catch (err) { toast.error(err.response?.data?.error || t('common.error')); }
    }

    async function deleteReview() {
        if (!editingReviewId) return;
        const confirmed = await confirm({
            title: t('reviews.deleteConfirmTitle'),
            message: t('reviews.deleteConfirmMessage'),
            confirmLabel: t('common.delete'),
            cancelLabel: t('common.cancel'),
            danger: true,
        });
        if (!confirmed) return;
        try {
            await axios.delete(`/user-reviews/${editingReviewId}`);
            toast.success(t('reviews.deleteSuccess'));
            setEditingMode(false); setEditingReviewId(null); setComment(''); setRating(0);
            fetchReviews();
        } catch { toast.error(t('reviews.deleteFailed')); }
    }

    function startEditing() {
        if (userReview) {
            setEditingMode(true);
            setEditingReviewId(userReview._id || userReview.id);
            setRating(userReview.rating || 0);
            setComment(userReview.comment || '');
        }
    }

    return (
        <div className="py-8 border-t" style={{ borderColor: 'var(--border)' }}>
            {/* Header */}
            <div className="flex items-center gap-3 mb-8">
                <Star size={22} className="star-filled" />
                <h2 className="font-heading font-bold text-xl" style={{ color: 'var(--on-surface)' }}>
                    {average > 0 ? `${average} · ${reviews.length} ${t('admin.reviewsTab')}` : t('reviews.writeReview')}
                </h2>
            </div>

            {/* "Must stay first" notice */}
            {user && isRegularUser && !isOwner && !hasCompletedBooking && !userReview && (
                <div className="mb-6 p-4 rounded-xl border text-sm" style={{ borderColor: 'var(--border)', background: 'var(--surface-2)', color: 'var(--on-surface-2)' }}>
                    💡 {t('reviews.writeReview')}
                </div>
            )}

            {/* Review Form */}
            {user && isRegularUser && !isOwner && (hasCompletedBooking || editingMode) && (!userReview || editingMode) && (
                <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-10 p-5 rounded-2xl border"
                    style={{ background: 'var(--surface-2)', borderColor: 'var(--border)' }}>
                    <h3 className="font-heading font-semibold mb-5" style={{ color: 'var(--on-surface)' }}>
                        {editingMode ? t('reviews.updateSuccess') : t('reviews.writeReview')}
                    </h3>
                    <div className="space-y-4">
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--on-surface-2)' }}>{t('reviews.ratingLabel')}</p>
                            <StarRating value={rating} onChange={setRating} hover={hoverRating}
                                onHover={setHoverRating} onLeave={setHoverRating} size={28} />
                        </div>
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--on-surface-2)' }}>{t('reviews.commentLabel')}</p>
                            <textarea value={comment} onChange={e => setComment(e.target.value)}
                                placeholder={t('reviews.commentPlaceholder')}
                                rows={4}
                                className="w-full rounded-xl p-3.5 text-sm resize-none border focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                                style={{ background: 'var(--surface)', borderColor: 'var(--border)', color: 'var(--on-surface)' }} />
                        </div>
                        <div className="flex items-center justify-between pt-1">
                            {editingMode ? (
                                <button onClick={deleteReview}
                                    className="flex items-center gap-1.5 text-sm font-medium text-error-500 hover:text-error-600 transition-colors">
                                    <Trash2 size={14} /> {t('common.delete')}
                                </button>
                            ) : <div />}
                            <div className="flex items-center gap-2">
                                {editingMode && (
                                    <button onClick={() => { setEditingMode(false); setRating(0); setComment(''); }}
                                        className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-all"
                                        style={{ color: 'var(--on-surface-2)' }}
                                        onMouseEnter={e => e.currentTarget.style.background = 'var(--border)'}
                                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                                        <X size={14} /> {t('common.cancel')}
                                    </button>
                                )}
                                <button onClick={submitReview}
                                    className="flex items-center gap-1.5 px-5 py-2 rounded-xl text-sm font-semibold text-white bg-primary-600 hover:bg-primary-700 transition-colors">
                                    <Check size={14} /> {editingMode ? t('common.save') : t('reviews.writeReview')}
                                </button>
                            </div>
                        </div>
                    </div>
                </motion.div>
            )}

            {/* Reviews grid */}
            {reviews.length > 0 ? (
                <div className="grid gap-8 md:grid-cols-2">
                    {/* User's own review */}
                    {userReview && !editingMode && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="p-4 rounded-2xl border-2"
                            style={{ borderColor: 'var(--primary-200)', background: 'var(--primary-50)' }}>
                            <div className="flex items-center gap-3 mb-3">
                                <div className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm uppercase text-white bg-gradient-to-br from-primary-500 to-primary-700">
                                    {userReview.user?.name?.charAt(0) || '?'}
                                </div>
                                <div>
                                    <p className="font-semibold text-sm" style={{ color: 'var(--on-surface)' }}>{userReview.user?.name || t('common.unknown')}</p>
                                    <p className="text-xs" style={{ color: 'var(--on-surface-2)' }}>
                                        {new Date(userReview.createdAt).toLocaleDateString('tr-TR', { year: 'numeric', month: 'long' })}
                                    </p>
                                </div>
                            </div>
                            {userReview.rating && <StarDisplay value={userReview.rating} />}
                            {userReview.comment && (
                                <p className="mt-3 text-sm leading-relaxed" style={{ color: 'var(--on-surface-2)' }}>{userReview.comment}</p>
                            )}
                            <button onClick={startEditing}
                                className="mt-3 flex items-center gap-1.5 text-xs font-medium text-primary-600 hover:text-primary-700 transition-colors">
                                <Edit3 size={12} /> {t('common.edit')}
                            </button>
                        </motion.div>
                    )}

                    {/* Other reviews */}
                    {otherReviews.map((rev, i) => (
                        <motion.div
                            key={rev._id || rev.id}
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.05 }}>
                            <div className="flex items-center gap-3 mb-3">
                                <Link to={`/user/${rev.user?._id || rev.user?.id}`}
                                    className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm uppercase text-white bg-gradient-to-br from-primary-500 to-primary-700 hover:scale-105 transition-transform">
                                    {rev.user?.name?.charAt(0) || '?'}
                                </Link>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between">
                                        <Link to={`/user/${rev.user?._id || rev.user?.id}`}
                                            className="font-semibold text-sm hover:text-primary-600 transition-colors truncate" style={{ color: 'var(--on-surface)' }}>
                                            {rev.user?.name || t('messages.userLabel')}
                                        </Link>
                                        {user?.role?.toUpperCase() === 'ADMIN' && (
                                            <button onClick={async () => {
                                                const confirmed = await confirm({
                                                    title: t('reviews.deleteConfirmTitle'),
                                                    message: t('reviews.commentDeleteConfirm'),
                                                    confirmLabel: t('common.delete'),
                                                    cancelLabel: t('common.cancel'),
                                                    danger: true,
                                                });
                                                if (!confirmed) return;
                                                try {
                                                    await axios.delete(`/user-reviews/${rev._id || rev.id}`);
                                                    toast.success(t('reviews.commentDeleteSuccess'));
                                                    fetchReviews();
                                                } catch { toast.error(t('reviews.deleteFailed')); }
                                            }} className="flex items-center gap-1 text-xs text-error-500 hover:text-error-600 transition-colors ml-2">
                                                <Trash2 size={12} />
                                            </button>
                                        )}
                                    </div>
                                    <p className="text-xs" style={{ color: 'var(--on-surface-2)' }}>
                                        {new Date(rev.createdAt).toLocaleDateString('tr-TR', { year: 'numeric', month: 'long' })}
                                    </p>
                                </div>
                            </div>
                            {rev.rating && <StarDisplay value={rev.rating} />}
                            {rev.comment && (
                                <p className="mt-2 text-sm leading-relaxed" style={{ color: 'var(--on-surface-2)' }}>{rev.comment}</p>
                            )}
                        </motion.div>
                    ))}
                </div>
            ) : (
                <div className="text-center py-10">
                    <Star size={32} className="mx-auto mb-3 opacity-20" style={{ color: 'var(--on-surface-2)' }} />
                    <p className="text-sm" style={{ color: 'var(--on-surface-2)' }}>Henüz değerlendirme yapılmamış. İlk siz olun!</p>
                </div>
            )}
        </div>
    );
}
