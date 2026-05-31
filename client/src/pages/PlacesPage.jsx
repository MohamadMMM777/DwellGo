import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import axios from "axios";
import PlaceImg from '../components/PlaceImg.jsx';
import { Plus, Trash2, MapPin, Edit2, Eye } from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { useConfirm } from '../contexts/ConfirmContext.jsx';

export default function PlacesPage() {
    const { t } = useTranslation();
    const confirm = useConfirm();
    const [places, setPlaces] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setLoading(true);
        axios.get('/places/user/all')
            .then(({ data }) => setPlaces(Array.isArray(data) ? data : []))
            .catch(() => toast.error(t('myListings.loadFailed')))
            .finally(() => setLoading(false));
    }, [t]);

    async function deletePlace(ev, placeId, placeTitle) {
        ev.preventDefault();
        ev.stopPropagation();
        const confirmed = await confirm({
            title: t('myListings.deleteTitle'),
            message: t('place.deleteConfirmNamed', { title: placeTitle }),
            confirmLabel: t('common.delete'),
            cancelLabel: t('common.cancel'),
            danger: true,
        });
        if (!confirmed) return;
        try {
            await axios.delete('/places/' + placeId);
            setPlaces(prev => prev.filter(p => p._id !== placeId && p.id !== placeId));
            toast.success(t('place.deleteSuccess'));
        } catch (err) {
            const msg = err.response?.data?.error || err.response?.data || t('myListings.deleteFailed');
            toast.error(typeof msg === 'string' ? msg : t('myListings.deleteFailed'));
        }
    }

    return (
        <div>
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="font-heading font-bold text-xl" style={{ color: 'var(--on-surface)' }}>{t('myListings.title')}</h2>
                    {!loading && <p className="text-sm mt-0.5" style={{ color: 'var(--on-surface-2)' }}>{t('myListings.count', { count: places.length })}</p>}
                </div>
                <Link to="/account/places/new"
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-primary-600 hover:bg-primary-700 transition-colors">
                    <Plus size={15} /> {t('myListings.addNew')}
                </Link>
            </div>

            {loading ? (
                <div className="flex justify-center py-16">
                    <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
                </div>
            ) : places.length === 0 ? (
                <div className="text-center py-16 rounded-2xl border" style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}>
                    <div className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center" style={{ background: 'var(--surface-2)' }}>
                        <MapPin size={28} style={{ color: 'var(--on-surface-2)', opacity: 0.5 }} />
                    </div>
                    <p className="font-semibold mb-1" style={{ color: 'var(--on-surface)' }}>{t('myListings.emptyTitle')}</p>
                    <p className="text-sm mb-4" style={{ color: 'var(--on-surface-2)' }}>{t('myListings.emptyMessage')}</p>
                    <Link to="/account/places/new"
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white bg-primary-600 hover:bg-primary-700 transition-colors">
                        <Plus size={14} /> {t('myListings.addFirst')}
                    </Link>
                </div>
            ) : (
                <div className="space-y-3">
                    {places.map((place, i) => (
                        <motion.div
                            key={place._id || place.id}
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.05 }}
                            className="flex gap-4 rounded-2xl border p-4 relative group"
                            style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>

                            {/* Thumbnail */}
                            <div className="w-24 h-24 rounded-xl overflow-hidden flex-shrink-0" style={{ background: 'var(--surface-2)' }}>
                                <PlaceImg place={place} className="w-full h-full object-cover" />
                            </div>

                            {/* Info */}
                            <div className="flex-1 min-w-0">
                                <h3 className="font-heading font-semibold truncate mb-1" style={{ color: 'var(--on-surface)' }}>{place.title}</h3>
                                {place.city && (
                                    <p className="flex items-center gap-1 text-xs mb-1" style={{ color: 'var(--on-surface-2)' }}>
                                        <MapPin size={10} />
                                        {[place.district, place.city].filter(Boolean).join(', ')}
                                    </p>
                                )}
                                <p className="text-xs line-clamp-2 mb-2" style={{ color: 'var(--on-surface-2)' }}>
                                    {place.description?.substring(0, 100)}{place.description?.length > 100 ? '...' : ''}
                                </p>
                                <p className="font-bold text-sm" style={{ color: 'var(--primary-600)' }}>
                                    ₺{place.price?.toLocaleString('tr-TR')}{t('common.perNight')}
                                </p>
                            </div>

                            {/* Action buttons */}
                            <div className="flex flex-col gap-1.5 self-start">
                                <Link
                                    to={`/place/${place._id || place.id}`}
                                    onClick={e => e.stopPropagation()}
                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
                                    style={{ color: 'var(--on-surface-2)', background: 'var(--surface-2)' }}
                                    title={t('myListings.viewTitle')}>
                                    <Eye size={12} /> {t('myListings.viewBtn')}
                                </Link>
                                <Link
                                    to={`/account/places/${place._id || place.id}`}
                                    onClick={e => e.stopPropagation()}
                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
                                    style={{ color: '#60a5fa', background: 'rgba(59,130,246,0.1)' }}
                                    title={t('myListings.editTitle')}>
                                    <Edit2 size={12} /> {t('myListings.editBtn')}
                                </Link>
                                <button
                                    onClick={ev => deletePlace(ev, place._id || place.id, place.title)}
                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
                                    style={{ color: '#ef4444', background: 'rgba(239,68,68,0.08)' }}
                                    title={t('myListings.deleteTitle')}>
                                    <Trash2 size={12} /> {t('common.delete')}
                                </button>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}
        </div>
    );
}
