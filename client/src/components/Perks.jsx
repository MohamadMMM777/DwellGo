import { Wifi, Car, Tv, Radio, PawPrint, Waves, Palmtree, DoorOpen } from 'lucide-react';

const PERKS = [
    { name: 'wifi',     label: 'Wifi',                 Icon: Wifi },
    { name: 'parking',  label: 'Ücretsiz Otopark',      Icon: Car },
    { name: 'tv',       label: 'Televizyon',            Icon: Tv },
    { name: 'radio',    label: 'Radyo',                 Icon: Radio },
    { name: 'pets',     label: 'Evcil Hayvan Kabul',    Icon: PawPrint },
    { name: 'pool',     label: 'Yüzme Havuzu',          Icon: Waves },
    { name: 'beach',    label: 'Sahil / Deniz',         Icon: Palmtree },
    { name: 'entrance', label: 'Özel Giriş',            Icon: DoorOpen },
];

export default function Perks({ selected, onChange }) {
    function handleCbClick(ev) {
        const { checked, name } = ev.target;
        if (checked) {
            onChange([...selected, name]);
        } else {
            onChange([...selected.filter(selectedName => selectedName !== name)]);
        }
    }

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {PERKS.map(({ name, label, Icon }) => {
                const isSelected = selected.includes(name);
                return (
                    <label key={name}
                        className="flex items-center gap-3 p-4 rounded-2xl border cursor-pointer transition-all duration-200"
                        style={{
                            borderColor: isSelected ? 'var(--primary-500)' : 'var(--border)',
                            background: isSelected ? 'var(--primary-50)' : 'var(--surface)',
                        }}>
                        <input type="checkbox"
                            checked={isSelected}
                            name={name}
                            onChange={handleCbClick}
                            className="w-4 h-4 rounded accent-primary-600 cursor-pointer flex-shrink-0"
                        />
                        <Icon size={18} style={{ color: isSelected ? 'var(--primary-600)' : 'var(--on-surface-2)', flexShrink: 0 }} />
                        <span className="text-sm font-medium" style={{ color: isSelected ? 'var(--primary-800)' : 'var(--on-surface)' }}>
                            {label}
                        </span>
                    </label>
                );
            })}
        </div>
    );
}
