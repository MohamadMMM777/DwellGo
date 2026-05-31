import { useEffect, useRef, useMemo } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icons in Leaflet with Vite/Webpack
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});

export default function Map({ center = [39.9334, 32.8597], zoom = 13, position = null, isEditable = false, setPosition = null }) {
    const mapRef = useRef(null);     // Container div ref
    const leafletMap = useRef(null); // Leaflet map instance
    const markerRef = useRef(null);  // Marker instance

    // ✅ المشكلة الأساسية كانت هنا: currentCenter كانت تُنشأ كـ array جديدة في كل render
    // مما يسبب useEffect يشتغل لا نهائياً → الخريطة تتدمر → شاشة سوداء
    // الحل: useMemo لحفظ الـ reference وعدم إنشاء array جديدة إلا عند تغيير القيم الفعلية
    // Safely parse coordinates or fallback to defaults
    const lat = Number(position?.lat) || (Array.isArray(center) ? Number(center[0]) : 39.9334);
    const lng = Number(position?.lng) || (Array.isArray(center) ? Number(center[1]) : 32.8597);

    const currentCenter = useMemo(() => [lat, lng], [lat, lng]);

    useEffect(() => {
        if (!mapRef.current) return;

        // Initialize map if not already initialized
        if (!leafletMap.current) {
            leafletMap.current = L.map(mapRef.current, {
                center: currentCenter,
                zoom: zoom,
                scrollWheelZoom: false,
                zoomControl: true
            });

            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            }).addTo(leafletMap.current);

            // Enable click-to-pin when editable
            if (isEditable && setPosition) {
                leafletMap.current.on('click', (e) => {
                    const { lat, lng } = e.latlng;
                    setPosition({ lat: parseFloat(lat.toFixed(6)), lng: parseFloat(lng.toFixed(6)) });
                });
            }
        } else {
            // Update center if map already exists
            leafletMap.current.setView(currentCenter, zoom);
        }

        // Handle Marker
        if (position && position.lat && position.lng) {
            if (markerRef.current) {
                markerRef.current.setLatLng([position.lat, position.lng]);
            } else {
                markerRef.current = L.marker([position.lat, position.lng], { icon: DefaultIcon })
                    .addTo(leafletMap.current);
            }
        } else if (markerRef.current) {
            markerRef.current.remove();
            markerRef.current = null;
        }
    }, [currentCenter, zoom, position]);

    // Actual Unmount Cleanup
    useEffect(() => {
        return () => {
            if (leafletMap.current) {
                leafletMap.current.remove();
                leafletMap.current = null;
            }
        };
    }, []);

    return (
        <div className="h-full w-full rounded-2xl overflow-hidden shadow-inner relative" style={{
            background: 'var(--surface-2)',
            height: '400px'
        }}>
            <div ref={mapRef} style={{ height: '100%', width: '100%' }} />
        </div>
    );
}
