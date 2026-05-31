import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import axios from "axios";
import AddressLink from '../components/AddressLink.jsx';
import PlaceGallery from '../components/PlaceGallery.jsx';
import BookingDates from '../components/BookingDates.jsx';
import { CreditCard } from 'lucide-react';

export default function BookingPage() {
    const { id } = useParams();
    const [booking, setBooking] = useState(null);

    function normalizeBooking(b) {
        // Normalize photos: some endpoints return [{url,id,...}], others return ["url"]
        if (b?.place?.photos) {
            b.place.photos = b.place.photos.map(p => (typeof p === 'string' ? p : p.url));
        }
        // Normalize address from location sub-object
        if (b?.place?.location?.address && !b.place.address) {
            b.place.address = b.place.location.address;
        }
        return b;
    }

    useEffect(() => {
        if (id) {
            axios.get('/bookings/guest').then(response => {
                const data = Array.isArray(response.data) ? response.data : [];
                const found = data.find(b => b._id === id || b.id === id);
                if (found) setBooking(normalizeBooking(found));
            }).catch(() => {
                axios.get('/bookings/' + id).then(r => setBooking(normalizeBooking(r.data))).catch(() => {});
            });
        }
    }, [id]);

    if (!booking) return (
        <div className="text-center py-20 text-sm" style={{ color: 'var(--on-surface-2)' }}>Yükleniyor...</div>
    );

    return (
        <div className="my-6 space-y-6">
            <h1 className="font-heading font-bold text-2xl" style={{ color: 'var(--on-surface)' }}>{booking.place.title}</h1>
            {booking.place.address && <AddressLink>{booking.place.address}</AddressLink>}

            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 rounded-2xl border"
                style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
                <div>
                    <h2 className="font-heading font-semibold mb-3" style={{ color: 'var(--on-surface)' }}>Rezervasyon Bilgileriniz</h2>
                    <BookingDates booking={booking} />
                </div>
                <div className="flex flex-col items-center px-6 py-4 rounded-2xl text-white bg-primary-600">
                    <div className="flex items-center gap-1.5 text-xs opacity-80 mb-1">
                        <CreditCard size={12} /> Toplam Fiyat
                    </div>
                    <div className="font-heading font-bold text-2xl">₺{(booking.totalPrice ?? booking.price ?? 0).toLocaleString('tr-TR')}</div>
                </div>
            </div>

            <PlaceGallery place={booking.place} />
        </div>
    );
}
