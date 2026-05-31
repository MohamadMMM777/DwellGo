import { MapPin } from 'lucide-react';

export default function AddressLink({ children, className = null }) {
    if (!className) className = 'my-3 block';
    return (
        <a className={className + ' flex items-center gap-1.5 text-sm font-medium hover:text-primary-600 transition-colors'}
            style={{ color: 'var(--on-surface-2)' }}
            target="_blank"
            rel="noopener noreferrer"
            href={'https://maps.google.com/?q=' + children}>
            <MapPin size={14} style={{ color: 'var(--primary-600)', flexShrink: 0 }} />
            <span className="underline underline-offset-2">{children}</span>
        </a>
    );
}
