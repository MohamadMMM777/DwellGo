import PlaceImg from './PlaceImg.jsx';
import { Trash2, MapPin } from 'lucide-react';

export default function AdminPlacesTable({ places, deletePlace }) {
    if (!places.length) return (
        <p className="text-center py-10 text-sm" style={{ color: 'var(--on-surface-2)' }}>İlan bulunamadı</p>
    );
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-4">
            {places.map(place => (
                <div key={place._id}
                    className="flex gap-3 rounded-2xl border p-3 transition-colors"
                    style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
                    <div className="w-20 h-20 rounded-xl overflow-hidden flex-shrink-0"
                        style={{ background: 'var(--surface-2)' }}>
                        <PlaceImg place={place} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-sm truncate" style={{ color: 'var(--on-surface)' }}>{place.title}</h3>
                        <p className="flex items-center gap-1 text-xs mt-0.5" style={{ color: 'var(--on-surface-2)' }}>
                            <MapPin size={10} />
                            {[place.district, place.city].filter(Boolean).join(', ') || '—'}
                        </p>
                        <p className="text-xs mt-0.5" style={{ color: 'var(--on-surface-2)' }}>
                            Sahibi: {place.owner?.name || '—'}
                        </p>
                        <p className="text-sm font-bold mt-1" style={{ color: 'var(--primary-600)' }}>
                            ₺{place.price}/gece
                        </p>
                    </div>
                    <button onClick={() => deletePlace(place._id)}
                        className="self-start flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-error-600 border border-error-200 hover:bg-error-50 transition-colors">
                        <Trash2 size={11} />
                    </button>
                </div>
            ))}
        </div>
    );
}
