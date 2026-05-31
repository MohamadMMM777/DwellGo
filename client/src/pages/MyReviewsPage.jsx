import { useEffect, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import PlaceImg from "../components/PlaceImg";
import { toast } from "react-hot-toast";
import { Star, Edit3, Trash2, X, Check } from 'lucide-react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useConfirm } from '../contexts/ConfirmContext.jsx';

function StarPicker({ value, hover, onChange, onHover, onLeave }) {
    return (
        <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map(n => (
                <button key={n} type="button"
                    onClick={() => onChange(value === n ? 0 : n)}
                    onMouseEnter={() => onHover(n)}
                    onMouseLeave={() => onLeave(0)}
                    className="transition-transform hover:scale-110">
                    <Star size={22}
                        fill={(hover || value) >= n ? 'var(--star-color)' : 'none'}
                        style={{ color: (hover || value) >= n ? 'var(--star-color)' : 'var(--border-2)' }} />
                </button>
            ))}
        </div>
    );
}

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

export default function MyReviewsPage() {
    const { t } = useTranslation();
    const confirm = useConfirm();
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editingReviewId, setEditingReviewId] = useState(null);
    const [editRating, setEditRating] = useState(0);
    const [editComment, setEditComment] = useState('');
    const [hoverRating, setHoverRating] = useState(0);

    useEffect(() => { fetchReviews(); }, []);

    function fetchReviews() {
        setLoading(true);
        axios.get('/user-reviews/authored').then(res => {
            setReviews(res.data);
            setLoading(false);
        }).catch(() => setLoading(false));
    }

    function startEditing(review) {
        setEditingReviewId(review._id);
        setEditRating(review.rating || 0);
        setEditComment(review.comment || '');
    }

    function cancelEditing() {
        setEditingReviewId(null); setEditRating(0); setEditComment('');
    }

    async function submitUpdate() {
        if (editRating === 0 && !editComment.trim()) return toast.error(t('reviews.ratingOrCommentRequired'));
        try {
            const data = { comment: editComment.trim() };
            if (editRating > 0) data.rating = editRating;
            await axios.put(`/user-reviews/${editingReviewId}`, data);
            toast.success(t('reviews.updateSuccess'));
            cancelEditing(); fetchReviews();
        } catch (err) { toast.error(err.response?.data?.error || t('common.error')); }
    }

    async function deleteReview(reviewId) {
        const confirmed = await confirm({
            title: t('reviews.deleteConfirmTitle'),
            message: t('reviews.deleteConfirmMessage'),
            confirmLabel: t('common.delete'),
            cancelLabel: t('common.cancel'),
            danger: true,
        });
        if (!confirmed) return;
        try {
            await axios.delete(`/user-reviews/${reviewId}`);
            toast.success(t('reviews.deleteSuccess'));
            if (editingReviewId === reviewId) cancelEditing();
            fetchReviews();
        } catch { toast.error(t('reviews.deleteFailed')); }
    }

    if (loading && reviews.length === 0) return (
        <div className="text-center py-16 text-sm" style={{ color: 'var(--on-surface-2)' }}>{t('common.loading')}</div>
    );

    return (
        <div>
            <h1 className="font-heading font-bold text-xl mb-6" style={{ color: 'var(--on-surface)' }}>{t('reviews.myReviewsTitle')}</h1>
            {reviews.length === 0 ? (
                <div className="text-center py-16 rounded-2xl border" style={{ borderColor: 'var(--border)' }}>
                    <Star size={36} className="mx-auto mb-3 opacity-20" style={{ color: 'var(--on-surface-2)' }} />
                    <p className="text-sm" style={{ color: 'var(--on-surface-2)' }}>{t('reviews.noReviews')}</p>
                </div>
            ) : (
                <div className="grid gap-4">
                    {reviews.map((review, i) => (
                        <motion.div key={review._id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.05 }}
                            className="rounded-2xl border p-5 flex flex-col sm:flex-row gap-4"
                            style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
                            <div className="w-24 h-24 rounded-xl overflow-hidden flex-shrink-0 hidden sm:block" style={{ background: 'var(--surface-2)' }}>
                                <Link to={`/place/${review.place?._id}`}>
                                    <PlaceImg place={review.place} className="w-full h-full object-cover" />
                                </Link>
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between gap-2 mb-1">
                                    <Link to={`/place/${review.place?._id}`}
                                        className="font-heading font-semibold hover:text-primary-600 transition-colors truncate"
                                        style={{ color: 'var(--on-surface)' }}>
                                        {review.place?.title || t('common.unknown')}
                                    </Link>
                                    {editingReviewId !== review._id && (
                                        <button onClick={() => startEditing(review)}
                                            className="flex items-center gap-1 text-xs font-medium text-primary-600 hover:text-primary-700 flex-shrink-0">
                                            <Edit3 size={11} /> {t('common.edit')}
                                        </button>
                                    )}
                                </div>
                                <p className="text-xs mb-2" style={{ color: 'var(--on-surface-2)' }}>
                                    {new Date(review.createdAt).toLocaleDateString('tr-TR', { year: 'numeric', month: 'long', day: 'numeric' })}
                                </p>

                                {editingReviewId === review._id ? (
                                    <div className="mt-2 p-4 rounded-xl border space-y-3"
                                        style={{ background: 'var(--surface-2)', borderColor: 'var(--border)' }}>
                                        <div>
                                            <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--on-surface-2)' }}>{t('reviews.ratingLabel')}</p>
                                            <StarPicker value={editRating} hover={hoverRating} onChange={setEditRating} onHover={setHoverRating} onLeave={setHoverRating} />
                                        </div>
                                        <div>
                                            <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--on-surface-2)' }}>{t('reviews.commentLabel')}</p>
                                            <textarea value={editComment} onChange={e => setEditComment(e.target.value)}
                                                placeholder={t('reviews.commentPlaceholder')}
                                                rows={3}
                                                className="w-full rounded-xl p-3 text-sm resize-none border focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                                                style={{ background: 'var(--surface)', borderColor: 'var(--border)', color: 'var(--on-surface)' }} />
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <button onClick={() => deleteReview(review._id)}
                                                className="flex items-center gap-1 text-xs font-medium text-error-600 hover:text-error-700">
                                                <Trash2 size={11} /> {t('common.delete')}
                                            </button>
                                            <div className="flex gap-2">
                                                <button onClick={cancelEditing}
                                                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium border"
                                                    style={{ borderColor: 'var(--border)', color: 'var(--on-surface-2)' }}>
                                                    <X size={11} /> {t('common.cancel')}
                                                </button>
                                                <button onClick={submitUpdate}
                                                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-primary-600 hover:bg-primary-700 transition-colors">
                                                    <Check size={11} /> {t('common.save')}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-1.5">
                                        {review.rating && <StarDisplay value={review.rating} />}
                                        {review.comment && (
                                            <p className="text-sm leading-relaxed" style={{ color: 'var(--on-surface-2)' }}>{review.comment}</p>
                                        )}
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}
        </div>
    );
}
