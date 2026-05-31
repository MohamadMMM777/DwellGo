import { motion } from 'framer-motion';
import { Sparkles, MapPin, ShieldCheck, Star } from 'lucide-react';

export default function HeroSection() {
    return (
        <div className="relative overflow-hidden rounded-3xl mb-10 h-[520px] flex items-center shadow-2xl">
            {/* Background */}
            <div
                className="absolute inset-0 bg-cover bg-center scale-105 transition-transform duration-[8s] hover:scale-110"
                style={{ backgroundImage: 'url("/hero-bg.png")' }}
            />
            {/* Overlays */}
            <div className="absolute inset-0 bg-gradient-to-r from-slate-900/97 via-slate-900/70 to-slate-900/25" />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900/70 via-transparent to-transparent" />

            {/* Glow effects */}
            <div className="absolute right-[10%] bottom-[15%] w-80 h-80 bg-primary-500/20 rounded-full blur-[100px] pointer-events-none" />
            <div className="absolute top-[10%] right-[30%] w-40 h-40 bg-accent-500/10 rounded-full blur-[80px] pointer-events-none" />

            {/* Content */}
            <div className="relative z-10 px-8 md:px-14 max-w-2xl">
                <motion.div
                    initial={{ opacity: 0, y: 24 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, ease: 'easeOut' }}>

                    <div className="inline-flex items-center gap-2 mb-5 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white/90 text-xs font-semibold tracking-wide">
                        <Sparkles size={13} className="text-primary-400" />
                        Yeni Nesil Konaklama Deneyimi
                    </div>

                    <h1 className="font-heading text-4xl md:text-6xl font-extrabold mb-5 leading-[1.1] text-white">
                        Hayalindeki{' '}
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-400 to-accent-400">
                            Konforu
                        </span>{' '}
                        Keşfet
                    </h1>

                    <p className="text-base md:text-lg text-white/75 mb-6 max-w-lg leading-relaxed font-body">
                        Türkiye'nin dört bir yanında <span className="text-white font-semibold">5.000'den fazla</span> seçkin konaklamayı keşfedin.
                        DwellGo ile güvenli ödeme, anlık onay ve <span className="text-white font-semibold">gerçek misafir yorumları</span> sayesinde
                        mükemmel tatil deneyiminizi planlayın.
                    </p>

                    {/* Feature highlights */}
                    <motion.div
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                        className="flex flex-wrap gap-3">
                        {[
                            { icon: ShieldCheck, text: 'Güvenli & Onaylı İlanlar', color: '#10b981' },
                            { icon: MapPin,       text: '81 Şehirde Konaklama',   color: '#3b82f6' },
                            { icon: Star,         text: '4.9★ Ortalama Puan',     color: '#f59e0b' },
                        ].map(({ icon: Icon, text, color }) => (
                            <div key={text}
                                className="flex items-center gap-2 px-4 py-2 rounded-xl backdrop-blur-sm border border-white/10 text-white/85 text-sm font-medium"
                                style={{ background: `${color}15` }}>
                                <Icon size={14} style={{ color }} />
                                {text}
                            </div>
                        ))}
                    </motion.div>
                </motion.div>
            </div>

            {/* Stats strip */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="absolute bottom-0 left-0 right-0 px-8 md:px-14 pb-6 flex gap-8">
                {[
                    { value: '5,000+', label: 'İlan' },
                    { value: '81', label: 'Şehir' },
                    { value: '4.9★', label: 'Ortalama Puan' },
                ].map(({ value, label }) => (
                    <div key={label} className="text-white/80">
                        <p className="font-heading font-bold text-lg text-white">{value}</p>
                        <p className="text-xs text-white/60">{label}</p>
                    </div>
                ))}
            </motion.div>
        </div>
    );
}
