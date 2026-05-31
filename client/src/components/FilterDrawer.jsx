import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useSearch } from '../contexts/SearchContext.jsx';
import {
    SlidersHorizontal, X, MapPin, Home, ArrowUpDown,
    TrendingUp, TrendingDown, Star, Clock, Check,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

/* ── Constants ──────────────────────────────────────────────────── */

const PROPERTY_TYPES = [
    { value: 'apartment', label: 'Daire',  emoji: '🏢' },
    { value: 'house',     label: 'Ev',     emoji: '🏠' },
    { value: 'villa',     label: 'Villa',  emoji: '🏡' },
    { value: 'studio',    label: 'Stüdyo', emoji: '🛋️' },
    { value: 'building',  label: 'Bina',   emoji: '🏗️' },
];

const SORT_OPTIONS = [
    { value: 'newest',      label: 'En Yeni Önce',             icon: Clock },
    { value: 'oldest',      label: 'En Eski Önce',             icon: Clock },
    { value: 'price_asc',   label: 'Fiyat: Düşükten Yükseğe', icon: TrendingUp },
    { value: 'price_desc',  label: 'Fiyat: Yüksekten Düşüğe', icon: TrendingDown },
    { value: 'rating_desc', label: 'En Yüksek Puan Önce',     icon: Star },
    { value: 'rating_asc',  label: 'En Düşük Puan Önce',      icon: Star },
];

const MAX_PRICE = 10000;
const STEP       = 100;

/* ── Dual Range Slider ──────────────────────────────────────────── */
function PriceSlider({ minVal, maxVal, onChange }) {
    const minPct = Math.round((minVal / MAX_PRICE) * 100);
    const maxPct = Math.round((maxVal / MAX_PRICE) * 100);

    function setMin(raw) {
        const v = Math.min(Number(raw), maxVal - STEP);
        onChange(v, maxVal);
    }
    function setMax(raw) {
        const v = Math.max(Number(raw), minVal + STEP);
        onChange(minVal, v);
    }

    return (
        <div className="px-1">
            {/* Track */}
            <div className="price-range-wrap mb-2">
                <div className="price-range-track" />
                <div className="price-range-fill"
                    style={{ left: `${minPct}%`, width: `${maxPct - minPct}%` }} />
                <input type="range" className="price-range-input"
                    min={0} max={MAX_PRICE} step={STEP}
                    value={minVal}
                    onChange={e => setMin(e.target.value)}
                    style={{ zIndex: minVal > MAX_PRICE * 0.9 ? 5 : 3 }}
                />
                <input type="range" className="price-range-input"
                    min={0} max={MAX_PRICE} step={STEP}
                    value={maxVal}
                    onChange={e => setMax(e.target.value)}
                    style={{ zIndex: 4 }}
                />
            </div>
            {/* Labels under track */}
            <div className="flex justify-between text-xs font-semibold mb-4"
                style={{ color: 'var(--on-surface-2)' }}>
                <span>₺{minVal.toLocaleString('tr-TR')}</span>
                <span>{maxVal >= MAX_PRICE ? '₺10.000+' : `₺${maxVal.toLocaleString('tr-TR')}`}</span>
            </div>
            {/* Manual inputs */}
            <div className="grid grid-cols-2 gap-3">
                {[
                    { label: 'Min Fiyat', val: minVal, set: v => onChange(Math.min(v, maxVal - STEP), maxVal) },
                    { label: 'Max Fiyat', val: maxVal, set: v => onChange(minVal, Math.max(v, minVal + STEP)) },
                ].map(({ label, val, set }) => (
                    <div key={label}>
                        <label className="block text-[11px] font-semibold uppercase tracking-wider mb-1.5"
                            style={{ color: 'var(--on-surface-2)' }}>
                            {label}
                        </label>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold select-none"
                                style={{ color: 'var(--on-surface-2)' }}>₺</span>
                            <input
                                type="number" min={0} max={MAX_PRICE} step={STEP}
                                value={val || ''}
                                onChange={e => set(Number(e.target.value) || 0)}
                                placeholder={label === 'Min Fiyat' ? '0' : '∞'}
                                className="w-full pl-7 pr-3 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 transition-all"
                                style={{
                                    background: 'var(--surface)',
                                    borderColor: 'var(--border)',
                                    color: 'var(--on-surface)',
                                }}
                            />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

/* ── Section Wrapper ────────────────────────────────────────────── */
function Section({ icon: Icon, iconColor = 'var(--primary-600)', title, badge, children }) {
    return (
        <div className="px-6 py-5 border-b last:border-b-0" style={{ borderColor: 'var(--border)' }}>
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <Icon size={15} style={{ color: iconColor }} />
                    <h3 className="text-xs font-bold uppercase tracking-widest"
                        style={{ color: 'var(--on-surface)' }}>
                        {title}
                    </h3>
                </div>
                {badge && (
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
                        style={{ background: 'var(--primary-100)', color: 'var(--primary-700)' }}>
                        {badge}
                    </span>
                )}
            </div>
            {children}
        </div>
    );
}

/* ── Main Component ─────────────────────────────────────────────── */
export default function FilterDrawer({ locations }) {
    const {
        filterCity, setFilterCity,
        filterDistrict, setFilterDistrict,
        filterNeighborhood, setFilterNeighborhood,
        filterTypes, setFilterTypes,
        filterMinPrice, setFilterMinPrice,
        filterMaxPrice, setFilterMaxPrice,
        sortBy, setSortBy,
        drawerOpen, setDrawerOpen,
        clearFilters, activeCount,
    } = useSearch();

    /* Local pending state */
    const [lCity,  setLCity]  = useState('');
    const [lDist,  setLDist]  = useState('');
    const [lNeigh, setLNeigh] = useState('');
    const [lTypes, setLTypes] = useState([]);
    const [lMin,   setLMin]   = useState(0);
    const [lMax,   setLMax]   = useState(0);
    const [lSort,  setLSort]  = useState('newest');

    /* Sync from context when drawer opens */
    useEffect(() => {
        if (!drawerOpen) return;
        setLCity(filterCity);
        setLDist(filterDistrict);
        setLNeigh(filterNeighborhood);
        setLTypes([...filterTypes]);
        setLMin(filterMinPrice);
        setLMax(filterMaxPrice || MAX_PRICE);
        setLSort(sortBy);
    }, [drawerOpen]); // eslint-disable-line

    /* Derived location options */
    const districts     = lCity && locations[lCity] ? Object.keys(locations[lCity]).sort() : [];
    const neighborhoods = lCity && lDist && locations[lCity]?.[lDist]
        ? [...locations[lCity][lDist]].sort() : [];

    /* Toggle property type */
    function toggleType(val) {
        setLTypes(prev =>
            prev.includes(val) ? prev.filter(t => t !== val) : [...prev, val]
        );
    }

    /* Apply */
    function applyFilters() {
        setFilterCity(lCity);
        setFilterDistrict(lDist);
        setFilterNeighborhood(lNeigh);
        setFilterTypes(lTypes);
        setFilterMinPrice(lMin);
        setFilterMaxPrice(lMax >= MAX_PRICE ? 0 : lMax);
        setSortBy(lSort);
        setDrawerOpen(false);
    }

    /* Clear local only */
    function handleClear() {
        setLCity(''); setLDist(''); setLNeigh('');
        setLTypes([]); setLMin(0); setLMax(MAX_PRICE);
        setLSort('newest');
        clearFilters();
    }

    const localCount =
        (lCity ? 1 : 0) + (lDist ? 1 : 0) + (lNeigh ? 1 : 0) +
        lTypes.length +
        (lMin > 0 || (lMax > 0 && lMax < MAX_PRICE) ? 1 : 0) +
        (lSort !== 'newest' ? 1 : 0);

    const selectStyle = {
        width: '100%',
        padding: '0.6rem 2rem 0.6rem 0.875rem',
        borderRadius: '0.75rem',
        border: '1px solid var(--border)',
        background: 'var(--surface)',
        color: 'var(--on-surface)',
        fontSize: '0.875rem',
        outline: 'none',
        cursor: 'pointer',
        appearance: 'none',
        WebkitAppearance: 'none',
    };

    return (
        <>
            {/* ── Trigger ──────────────────────────────────────────────────── */}
            <button
                type="button"
                onClick={() => setDrawerOpen(p => !p)}
                className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold border transition-all duration-200 flex-shrink-0 whitespace-nowrap"
                style={{
                    background: activeCount > 0 ? 'var(--primary-600)' : 'var(--surface)',
                    borderColor: activeCount > 0 ? 'var(--primary-600)' : 'var(--border)',
                    color:       activeCount > 0 ? '#fff'                : 'var(--on-surface)',
                }}>
                <SlidersHorizontal size={14} />
                Filtrele
                {activeCount > 0 && (
                    <span className="min-w-[20px] h-5 px-1 rounded-full text-xs font-bold flex items-center justify-center"
                        style={{ background: 'rgba(255,255,255,0.25)' }}>
                        {activeCount}
                    </span>
                )}
            </button>

            {createPortal(
              <AnimatePresence>
                {drawerOpen && (
                    <>
                        {/* Backdrop */}
                        <motion.div
                            key="filter-backdrop"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.22 }}
                            className="fixed inset-0 z-[9998]"
                            style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(3px)' }}
                            onClick={() => setDrawerOpen(false)}
                        />

                        {/* Panel */}
                        <motion.aside
                            key="filter-panel"
                            initial={{ x: '100%', opacity: 0.6 }}
                            animate={{ x: 0, opacity: 1 }}
                            exit={{ x: '100%', opacity: 0.6 }}
                            transition={{ type: 'spring', damping: 32, stiffness: 340 }}
                            className="fixed right-0 top-0 h-full flex flex-col"
                            style={{
                                zIndex: 9999,
                                width: 'min(460px, 98vw)',
                                background: 'var(--surface)',
                                borderLeft: '1px solid var(--border)',
                                boxShadow: '-8px 0 40px rgba(0,0,0,0.18)',
                            }}>

                            {/* ── Header ─────────────────────────────────────────── */}
                            <div className="flex items-center justify-between px-6 py-4 border-b flex-shrink-0"
                                style={{ borderColor: 'var(--border)', background: 'var(--surface-2)' }}>
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-xl flex items-center justify-center"
                                        style={{ background: 'var(--primary-100)' }}>
                                        <SlidersHorizontal size={15} style={{ color: 'var(--primary-600)' }} />
                                    </div>
                                    <div>
                                        <h2 className="font-heading font-bold text-[15px]"
                                            style={{ color: 'var(--on-surface)' }}>
                                            Filtrele &amp; Sırala
                                        </h2>
                                        {localCount > 0 && (
                                            <p className="text-[11px] font-medium"
                                                style={{ color: 'var(--primary-600)' }}>
                                                {localCount} seçim aktif
                                            </p>
                                        )}
                                    </div>
                                </div>
                                <button type="button" onClick={() => setDrawerOpen(false)}
                                    className="w-8 h-8 rounded-xl flex items-center justify-center transition-colors"
                                    style={{ color: 'var(--on-surface-2)' }}
                                    onMouseEnter={e => e.currentTarget.style.background = 'var(--border)'}
                                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                                    <X size={16} />
                                </button>
                            </div>

                            {/* ── Scrollable Body ────────────────────────────────── */}
                            <div className="flex-1 overflow-y-auto">

                                {/* ── Sort ────────────────────────────────────────── */}
                                <Section icon={ArrowUpDown} title="Sıralama"
                                    badge={lSort !== 'newest' ? SORT_OPTIONS.find(s => s.value === lSort)?.label.split(':')[0] : undefined}>
                                    <div className="grid grid-cols-1 gap-1.5">
                                        {SORT_OPTIONS.map(opt => {
                                            const Icon = opt.icon;
                                            const active = lSort === opt.value;
                                            return (
                                                <button key={opt.value} type="button"
                                                    onClick={() => setLSort(opt.value)}
                                                    className="flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium border transition-all duration-150"
                                                    style={{
                                                        background:   active ? 'var(--primary-50)'   : 'transparent',
                                                        borderColor:  active ? 'var(--primary-300)'  : 'var(--border)',
                                                        color:        active ? 'var(--primary-700)'  : 'var(--on-surface)',
                                                    }}
                                                    onMouseEnter={e => { if (!active) { e.currentTarget.style.background = 'var(--surface-2)'; e.currentTarget.style.borderColor = 'var(--primary-200)'; } }}
                                                    onMouseLeave={e => { if (!active) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'var(--border)'; } }}>
                                                    <div className="flex items-center gap-3">
                                                        <Icon size={14}
                                                            style={{ color: active ? 'var(--primary-600)' : 'var(--on-surface-2)' }} />
                                                        <span>{opt.label}</span>
                                                    </div>
                                                    {active && (
                                                        <span className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                                                            style={{ background: 'var(--primary-600)' }}>
                                                            <Check size={10} color="#fff" />
                                                        </span>
                                                    )}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </Section>

                                {/* ── Location ────────────────────────────────────── */}
                                <Section icon={MapPin} title="Konum"
                                    badge={[lCity, lDist, lNeigh].filter(Boolean).join(' › ') || undefined}>
                                    <div className="space-y-3">
                                        {[
                                            {
                                                label: 'Şehir',
                                                val: lCity,
                                                opts: Object.keys(locations).sort(),
                                                placeholder: 'Tüm Şehirler',
                                                disabled: false,
                                                onChange: v => { setLCity(v); setLDist(''); setLNeigh(''); },
                                            },
                                            {
                                                label: 'İlçe',
                                                val: lDist,
                                                opts: districts,
                                                placeholder: 'Tüm İlçeler',
                                                disabled: !lCity,
                                                onChange: v => { setLDist(v); setLNeigh(''); },
                                            },
                                            {
                                                label: 'Mahalle',
                                                val: lNeigh,
                                                opts: neighborhoods,
                                                placeholder: 'Tüm Mahalleler',
                                                disabled: !lDist,
                                                onChange: v => setLNeigh(v),
                                            },
                                        ].map(({ label, val, opts, placeholder, disabled, onChange }) => (
                                            <div key={label}>
                                                <label className="block text-[11px] font-semibold uppercase tracking-wider mb-1.5"
                                                    style={{ color: 'var(--on-surface-2)' }}>
                                                    {label}
                                                </label>
                                                <div className="relative">
                                                    <select
                                                        value={val}
                                                        disabled={disabled}
                                                        onChange={e => onChange(e.target.value)}
                                                        style={{
                                                            ...selectStyle,
                                                            opacity: disabled ? 0.4 : 1,
                                                            cursor: disabled ? 'not-allowed' : 'pointer',
                                                            background: val ? 'var(--primary-50)' : 'var(--surface)',
                                                            borderColor: val ? 'var(--primary-300)' : 'var(--border)',
                                                            color: val ? 'var(--primary-700)' : 'var(--on-surface)',
                                                            fontWeight: val ? 600 : 400,
                                                        }}>
                                                        <option value="">{placeholder}</option>
                                                        {opts.map(o => (
                                                            <option key={o} value={o}>{o}</option>
                                                        ))}
                                                    </select>
                                                    <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[10px]"
                                                        style={{ color: 'var(--on-surface-2)' }}>▼</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </Section>

                                {/* ── Property Type ────────────────────────────────── */}
                                <Section icon={Home} title="Mülk Tipi"
                                    badge={lTypes.length > 0 ? `${lTypes.length} seçili` : undefined}>
                                    <div className="grid grid-cols-3 gap-2">
                                        {PROPERTY_TYPES.map(pt => {
                                            const active = lTypes.includes(pt.value);
                                            return (
                                                <button key={pt.value} type="button"
                                                    onClick={() => toggleType(pt.value)}
                                                    className="relative flex flex-col items-center justify-center gap-1.5 py-3.5 px-2 rounded-xl border text-xs font-semibold transition-all duration-150 overflow-hidden"
                                                    style={{
                                                        background:  active ? 'var(--primary-600)' : 'var(--surface-2)',
                                                        borderColor: active ? 'var(--primary-600)' : 'var(--border)',
                                                        color:       active ? '#fff'                : 'var(--on-surface)',
                                                    }}
                                                    onMouseEnter={e => { if (!active) { e.currentTarget.style.borderColor = 'var(--primary-400)'; e.currentTarget.style.background = 'var(--primary-50)'; e.currentTarget.style.color = 'var(--primary-700)'; } }}
                                                    onMouseLeave={e => { if (!active) { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.background = 'var(--surface-2)'; e.currentTarget.style.color = 'var(--on-surface)'; } }}>
                                                    {active && (
                                                        <span className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full flex items-center justify-center"
                                                            style={{ background: 'rgba(255,255,255,0.25)' }}>
                                                            <Check size={9} color="#fff" />
                                                        </span>
                                                    )}
                                                    <span className="text-xl">{pt.emoji}</span>
                                                    <span>{pt.label}</span>
                                                </button>
                                            );
                                        })}
                                    </div>
                                    {lTypes.length > 0 && (
                                        <button type="button" onClick={() => setLTypes([])}
                                            className="mt-3 text-xs font-medium transition-opacity hover:opacity-70"
                                            style={{ color: 'var(--on-surface-2)', textDecoration: 'underline', textUnderlineOffset: '3px' }}>
                                            Seçimi temizle
                                        </button>
                                    )}
                                </Section>

                                {/* ── Price Range ──────────────────────────────────── */}
                                <Section icon={TrendingUp} title="Fiyat Aralığı (₺ / gece)"
                                    badge={(lMin > 0 || lMax < MAX_PRICE)
                                        ? `₺${lMin.toLocaleString('tr-TR')} – ${lMax >= MAX_PRICE ? '∞' : '₺' + lMax.toLocaleString('tr-TR')}`
                                        : undefined}>
                                    <PriceSlider
                                        minVal={lMin}
                                        maxVal={lMax || MAX_PRICE}
                                        onChange={(min, max) => { setLMin(min); setLMax(max); }}
                                    />
                                </Section>

                            </div>

                            {/* ── Footer ───────────────────────────────────────────── */}
                            <div className="px-6 py-4 border-t flex items-center gap-3 flex-shrink-0"
                                style={{ borderColor: 'var(--border)', background: 'var(--surface-2)' }}>
                                <button type="button" onClick={handleClear}
                                    className="px-4 py-3 rounded-xl text-sm font-semibold border transition-all"
                                    style={{
                                        borderColor: 'var(--border)',
                                        color: 'var(--on-surface-2)',
                                        background: 'transparent',
                                    }}
                                    onMouseEnter={e => e.currentTarget.style.background = 'var(--border)'}
                                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                                    Temizle
                                </button>
                                <button type="button" onClick={applyFilters}
                                    className="flex-1 py-3 rounded-xl text-sm font-bold text-white transition-all"
                                    style={{ background: 'var(--primary-600)' }}
                                    onMouseEnter={e => e.currentTarget.style.background = 'var(--primary-700)'}
                                    onMouseLeave={e => e.currentTarget.style.background = 'var(--primary-600)'}>
                                    {localCount > 0
                                        ? `${localCount} filtreyle Göster`
                                        : 'Tüm İlanları Göster'}
                                </button>
                            </div>
                        </motion.aside>
                    </>
                )}
            </AnimatePresence>,
              document.body
            )}
        </>
    );
}
