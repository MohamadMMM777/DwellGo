import { X } from 'lucide-react';

const selectClass = "w-full px-3 py-2.5 rounded-xl border text-sm focus:ring-2 focus:ring-primary-500/20 focus:outline-none disabled:opacity-50";

export default function PropertyFilters({
    filterCity, setFilterCity,
    filterDistrict, setFilterDistrict,
    filterNeighborhood, setFilterNeighborhood,
    filterStreet, setFilterStreet,
    filterType, setFilterType,
    locations,
    hasFilter,
    filteredLength,
    clearFilters,
}) {
    const cities = Object.keys(locations);
    const districts = filterCity && locations[filterCity] ? Object.keys(locations[filterCity]) : [];
    const neighborhoods = filterCity && filterDistrict && locations[filterCity]?.[filterDistrict] || [];

    const inputStyle = { background: 'var(--surface)', borderColor: 'var(--border)', color: 'var(--on-surface)' };

    return (
        <div className="rounded-2xl border p-5 mb-8" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
                <select value={filterCity}
                    onChange={e => { setFilterCity(e.target.value); setFilterDistrict(''); setFilterNeighborhood(''); }}
                    className={selectClass} style={inputStyle}>
                    <option value="">Tüm Şehirler</option>
                    {cities.map(c => <option key={c} value={c}>{c}</option>)}
                </select>

                <select value={filterDistrict}
                    onChange={e => { setFilterDistrict(e.target.value); setFilterNeighborhood(''); }}
                    disabled={!filterCity}
                    className={selectClass} style={inputStyle}>
                    <option value="">Tüm İlçeler</option>
                    {districts.map(d => <option key={d} value={d}>{d}</option>)}
                </select>

                <select value={filterNeighborhood}
                    onChange={e => setFilterNeighborhood(e.target.value)}
                    disabled={!filterDistrict}
                    className={selectClass} style={inputStyle}>
                    <option value="">Tüm Mahalleler</option>
                    {neighborhoods.map(n => <option key={n} value={n}>{n}</option>)}
                </select>

                <input type="text" value={filterStreet}
                    onChange={e => setFilterStreet(e.target.value)}
                    placeholder="Sokak ara..."
                    className={selectClass} style={inputStyle} />

                <select value={filterType}
                    onChange={e => setFilterType(e.target.value)}
                    className={selectClass} style={inputStyle}>
                    <option value="">Tüm Tipler</option>
                    <option value="apartment">Daire</option>
                    <option value="house">Ev</option>
                    <option value="villa">Villa</option>
                    <option value="studio">Stüdyo</option>
                    <option value="building">Bina</option>
                </select>
            </div>

            {hasFilter && (
                <div className="mt-3 flex items-center gap-3">
                    <span className="text-sm" style={{ color: 'var(--on-surface-2)' }}>
                        <strong style={{ color: 'var(--on-surface)' }}>{filteredLength}</strong> sonuç bulundu
                    </span>
                    <button onClick={clearFilters}
                        className="flex items-center gap-1 text-sm font-medium text-primary-600 hover:text-primary-700 transition-colors">
                        <X size={12} /> Temizle
                    </button>
                </div>
            )}
        </div>
    );
}
