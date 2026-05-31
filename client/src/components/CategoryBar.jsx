import {
    LayoutGrid, Building2, Home, Castle, Sofa,
    Building, Waves, Mountain, Palmtree, Gem
} from 'lucide-react';
import { motion } from 'framer-motion';

const CATEGORIES = [
    { label: 'Hepsi',    icon: LayoutGrid,  value: '' },
    { label: 'Daire',    icon: Building2,   value: 'apartment' },
    { label: 'Ev',       icon: Home,        value: 'house' },
    { label: 'Villa',    icon: Castle,      value: 'villa' },
    { label: 'Stüdyo',   icon: Sofa,        value: 'studio' },
    { label: 'Bina',     icon: Building,    value: 'building' },
    { label: 'Havuzlu',  icon: Waves,       value: 'pool' },
    { label: 'Manzaralı',icon: Mountain,   value: 'view' },
    { label: 'Sahil',    icon: Palmtree,    value: 'beach' },
    { label: 'Lüks',     icon: Gem,         value: 'luxury' },
];

export default function CategoryBar({ selected, onChange }) {
    return (
        <div className="flex items-center gap-1 overflow-x-auto pb-2 no-scrollbar scroll-smooth">
            {CATEGORIES.map((cat, i) => {
                const Icon = cat.icon;
                const isActive = selected === cat.value;
                return (
                    <motion.button
                        key={cat.value}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.04, duration: 0.3 }}
                        onClick={() => onChange(cat.value)}
                        className="flex flex-col items-center gap-1.5 px-4 py-2.5 rounded-xl min-w-fit transition-all duration-200 relative group"
                        style={{
                            background: isActive ? 'var(--primary-50)' : 'transparent',
                            color: isActive ? 'var(--primary-700)' : 'var(--on-surface-2)',
                            border: isActive ? '1px solid var(--primary-200)' : '1px solid transparent',
                        }}>
                        <Icon
                            size={18}
                            className="transition-transform duration-200 group-hover:scale-110"
                            style={{ strokeWidth: isActive ? 2.5 : 1.8 }}
                        />
                        <span className="text-[10px] font-semibold uppercase tracking-wide whitespace-nowrap">
                            {cat.label}
                        </span>
                        {isActive && (
                            <motion.div
                                layoutId="catIndicator"
                                className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-4 h-0.5 rounded-full bg-primary-600"
                            />
                        )}
                    </motion.button>
                );
            })}
        </div>
    );
}
