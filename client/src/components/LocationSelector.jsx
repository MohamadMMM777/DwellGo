import { useEffect, useState } from "react";
import axios from "axios";
import { MapPin, Map, Home, Navigation } from 'lucide-react';

export default function LocationSelector({ city, district, neighborhood, street, onChange }) {
    const [locations, setLocations] = useState({});
    const [cities, setCities] = useState([]);
    const [districts, setDistricts] = useState([]);
    const [neighborhoods, setNeighborhoods] = useState([]);

    useEffect(() => {
        axios.get('/locations').then(({ data }) => {
            setLocations(data);
            setCities(Object.keys(data));
        });
    }, []);

    useEffect(() => {
        if (city && locations[city]) {
            setDistricts(Object.keys(locations[city]));
            setNeighborhoods([]);
        } else {
            setDistricts([]);
            setNeighborhoods([]);
        }
    }, [city, locations]);

    useEffect(() => {
        if (city && district && locations[city]?.[district]) {
            setNeighborhoods(locations[city][district]);
        } else {
            setNeighborhoods([]);
        }
    }, [city, district, locations]);

    function handleCity(e) { onChange({ city: e.target.value, district: '', neighborhood: '', street }); }
    function handleDistrict(e) { onChange({ city, district: e.target.value, neighborhood: '', street }); }
    function handleNeighborhood(e) { onChange({ city, district, neighborhood: e.target.value, street }); }
    function handleStreet(e) { onChange({ city, district, neighborhood, street: e.target.value }); }

    const selectStyle = {
        background: 'var(--surface)',
        borderColor: 'var(--border)',
        color: 'var(--on-surface)',
    };

    const fields = [
        { label: 'Şehir', Icon: MapPin, element: (
            <select value={city} onChange={handleCity}
                className="w-full px-3 py-2.5 rounded-xl border text-sm focus:ring-2 focus:ring-primary-500/20 focus:outline-none"
                style={selectStyle}>
                <option value="">Şehir seçin...</option>
                {cities.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
        )},
        { label: 'İlçe', Icon: Map, element: (
            <select value={district} onChange={handleDistrict} disabled={!city}
                className="w-full px-3 py-2.5 rounded-xl border text-sm focus:ring-2 focus:ring-primary-500/20 focus:outline-none disabled:opacity-50"
                style={selectStyle}>
                <option value="">İlçe seçin...</option>
                {districts.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
        )},
        { label: 'Mahalle', Icon: Home, element: (
            <select value={neighborhood} onChange={handleNeighborhood} disabled={!district}
                className="w-full px-3 py-2.5 rounded-xl border text-sm focus:ring-2 focus:ring-primary-500/20 focus:outline-none disabled:opacity-50"
                style={selectStyle}>
                <option value="">Mahalle seçin...</option>
                {neighborhoods.map(n => <option key={n} value={n}>{n}</option>)}
            </select>
        )},
        { label: 'Sokak', Icon: Navigation, element: (
            <input type="text" value={street} onChange={handleStreet}
                placeholder="Sokak adı..."
                className="w-full px-3 py-2.5 rounded-xl border text-sm focus:ring-2 focus:ring-primary-500/20 focus:outline-none"
                style={selectStyle} />
        )},
    ];

    return (
        <div className="grid gap-3 grid-cols-1 md:grid-cols-2">
            {fields.map(({ label, Icon, element }) => (
                <div key={label}>
                    <label className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider mb-2"
                        style={{ color: 'var(--on-surface-2)' }}>
                        <Icon size={11} /> {label}
                    </label>
                    {element}
                </div>
            ))}
        </div>
    );
}
