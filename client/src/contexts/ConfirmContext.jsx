import { createContext, useCallback, useContext, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, HelpCircle, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';

// ── ConfirmContext ───────────────────────────────────────────────────────────
// Replaces window.confirm / window.prompt with themed, i18n-aware modals.
//
//   const confirm = useConfirm();
//   const ok = await confirm({
//     title: t('place.deleteConfirmTitle'),
//     message: t('place.deleteConfirmMessage'),
//     danger: true,
//   });
//   if (!ok) return;
//
//   const reason = await confirm({
//     title: t('booking.rejectReasonTitle'),
//     message: t('booking.rejectReasonMessage'),
//     input: true,
//     inputPlaceholder: t('booking.rejectReasonPlaceholder'),
//   });
//   if (reason === null) return;  // user cancelled
// ────────────────────────────────────────────────────────────────────────────

const ConfirmContext = createContext(null);

export function ConfirmProvider({ children }) {
    const { t } = useTranslation();
    const [state, setState] = useState(null);
    const [inputValue, setInputValue] = useState('');
    const resolverRef = useRef(null);

    const open = useCallback((opts) => {
        setInputValue(opts.defaultValue || '');
        setState({
            title: opts.title,
            message: opts.message,
            confirmLabel: opts.confirmLabel,
            cancelLabel: opts.cancelLabel,
            danger: !!opts.danger,
            input: !!opts.input,
            inputPlaceholder: opts.inputPlaceholder || '',
            inputRequired: !!opts.inputRequired,
            inputMultiline: !!opts.inputMultiline,
        });
        return new Promise((resolve) => {
            resolverRef.current = resolve;
        });
    }, []);

    const close = (value) => {
        if (resolverRef.current) {
            resolverRef.current(value);
            resolverRef.current = null;
        }
        setState(null);
        setInputValue('');
    };

    const handleCancel = () => {
        close(state?.input ? null : false);
    };

    const handleConfirm = () => {
        if (state?.input) {
            if (state.inputRequired && !inputValue.trim()) return;
            close(inputValue);
        } else {
            close(true);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !state?.inputMultiline) {
            e.preventDefault();
            handleConfirm();
        } else if (e.key === 'Escape') {
            handleCancel();
        }
    };

    const Icon = state?.danger ? AlertTriangle : HelpCircle;
    const accentColor = state?.danger ? '#ef4444' : 'var(--primary-600)';
    const accentBg = state?.danger ? 'rgba(239,68,68,0.12)' : 'rgba(99,102,241,0.12)';

    return (
        <ConfirmContext.Provider value={open}>
            {children}
            <AnimatePresence>
                {state && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.15 }}
                        className="fixed inset-0 z-[100] flex items-center justify-center p-4"
                        style={{ background: 'rgba(15, 23, 42, 0.55)', backdropFilter: 'blur(4px)' }}
                        onClick={handleCancel}>
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 10 }}
                            transition={{ duration: 0.18, ease: 'easeOut' }}
                            onClick={(e) => e.stopPropagation()}
                            className="w-full max-w-md rounded-2xl shadow-2xl overflow-hidden border"
                            style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>

                            {/* Close button */}
                            <div className="flex justify-end p-2">
                                <button onClick={handleCancel}
                                    className="w-8 h-8 flex items-center justify-center rounded-lg transition-colors"
                                    style={{ color: 'var(--on-surface-2)' }}
                                    onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-2)'}
                                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                                    <X size={15} />
                                </button>
                            </div>

                            {/* Icon + content */}
                            <div className="px-6 pb-6">
                                <div className="flex flex-col items-center text-center mb-5">
                                    <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
                                        style={{ background: accentBg }}>
                                        <Icon size={24} style={{ color: accentColor }} />
                                    </div>
                                    {state.title && (
                                        <h3 className="font-heading font-bold text-lg mb-2"
                                            style={{ color: 'var(--on-surface)' }}>
                                            {state.title}
                                        </h3>
                                    )}
                                    {state.message && (
                                        <p className="text-sm leading-relaxed"
                                            style={{ color: 'var(--on-surface-2)' }}>
                                            {state.message}
                                        </p>
                                    )}
                                </div>

                                {/* Input field */}
                                {state.input && (
                                    <div className="mb-5">
                                        {state.inputMultiline ? (
                                            <textarea
                                                autoFocus
                                                rows={3}
                                                value={inputValue}
                                                onChange={e => setInputValue(e.target.value)}
                                                onKeyDown={handleKeyDown}
                                                placeholder={state.inputPlaceholder}
                                                className="w-full px-4 py-3 rounded-xl border text-sm focus:ring-2 focus:ring-primary-500/20 focus:outline-none resize-none"
                                                style={{ background: 'var(--surface-2)', borderColor: 'var(--border)', color: 'var(--on-surface)' }}
                                            />
                                        ) : (
                                            <input
                                                autoFocus
                                                type="text"
                                                value={inputValue}
                                                onChange={e => setInputValue(e.target.value)}
                                                onKeyDown={handleKeyDown}
                                                placeholder={state.inputPlaceholder}
                                                className="w-full px-4 py-3 rounded-xl border text-sm focus:ring-2 focus:ring-primary-500/20 focus:outline-none"
                                                style={{ background: 'var(--surface-2)', borderColor: 'var(--border)', color: 'var(--on-surface)' }}
                                            />
                                        )}
                                    </div>
                                )}

                                {/* Actions */}
                                <div className="flex gap-2.5">
                                    <button onClick={handleCancel}
                                        className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold border transition-colors"
                                        style={{
                                            background: 'var(--surface-2)',
                                            borderColor: 'var(--border)',
                                            color: 'var(--on-surface)',
                                        }}
                                        onMouseEnter={e => e.currentTarget.style.opacity = '0.8'}
                                        onMouseLeave={e => e.currentTarget.style.opacity = '1'}>
                                        {state.cancelLabel || t('common.cancel')}
                                    </button>
                                    <button onClick={handleConfirm}
                                        className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-colors"
                                        style={{ background: state.danger ? '#ef4444' : 'var(--primary-600)' }}
                                        onMouseEnter={e => e.currentTarget.style.opacity = '0.9'}
                                        onMouseLeave={e => e.currentTarget.style.opacity = '1'}>
                                        {state.confirmLabel || t('common.confirm')}
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </ConfirmContext.Provider>
    );
}

export function useConfirm() {
    const ctx = useContext(ConfirmContext);
    if (!ctx) throw new Error('useConfirm must be used inside <ConfirmProvider>');
    return ctx;
}
