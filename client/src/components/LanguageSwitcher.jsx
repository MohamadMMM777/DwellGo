import { useTranslation } from 'react-i18next';
import { Languages } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const LANGUAGES = [
    { code: 'tr', label: 'Türkçe', flag: '🇹🇷' },
    { code: 'en', label: 'English', flag: '🇬🇧' },
];

export default function LanguageSwitcher() {
    const { i18n, t } = useTranslation();
    const [open, setOpen] = useState(false);
    const ref = useRef(null);

    useEffect(() => {
        function handleClickOutside(e) {
            if (ref.current && !ref.current.contains(e.target)) setOpen(false);
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const current = LANGUAGES.find(l => l.code === i18n.language?.slice(0, 2)) || LANGUAGES[0];

    const changeLanguage = (code) => {
        i18n.changeLanguage(code);
        setOpen(false);
    };

    return (
        <div className="relative" ref={ref}>
            <button
                onClick={() => setOpen(p => !p)}
                className="w-9 h-9 flex items-center justify-center rounded-full transition-all duration-200 hover:bg-[var(--surface-2)]"
                style={{ color: 'var(--on-surface-2)' }}
                title={t('language.switchTo')}
                aria-label={t('language.switchTo')}>
                <span className="text-base leading-none">{current.flag}</span>
            </button>

            <AnimatePresence>
                {open && (
                    <motion.div
                        initial={{ opacity: 0, y: -8, scale: 0.96 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -8, scale: 0.96 }}
                        transition={{ duration: 0.15, ease: 'easeOut' }}
                        className="absolute right-0 top-full mt-2 w-44 rounded-2xl shadow-2xl z-50 overflow-hidden border"
                        style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
                        <div className="px-4 py-2.5 border-b flex items-center gap-2"
                            style={{ borderColor: 'var(--border)', background: 'var(--surface-2)' }}>
                            <Languages size={13} style={{ color: 'var(--on-surface-2)' }} />
                            <span className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--on-surface-2)' }}>
                                {t('language.switchTo')}
                            </span>
                        </div>
                        <div className="p-1.5">
                            {LANGUAGES.map(lang => {
                                const isActive = current.code === lang.code;
                                return (
                                    <button
                                        key={lang.code}
                                        onClick={() => changeLanguage(lang.code)}
                                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150"
                                        style={{
                                            background: isActive ? 'var(--primary-50)' : 'transparent',
                                            color: isActive ? 'var(--primary-700)' : 'var(--on-surface-2)',
                                        }}
                                        onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = 'var(--surface-2)'; }}
                                        onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent'; }}>
                                        <span className="text-lg leading-none">{lang.flag}</span>
                                        <span className="flex-1 text-left">{lang.label}</span>
                                        {isActive && (
                                            <span className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--primary-600)' }} />
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
