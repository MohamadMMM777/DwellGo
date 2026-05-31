import { motion } from 'framer-motion';
import { Sparkles, ShieldCheck, Clock, Compass } from 'lucide-react';

export default function HeroSection() {
    return (
        <div className="relative overflow-hidden rounded-3xl mb-10 min-h-[460px] md:min-h-[520px] flex flex-col justify-between p-6 sm:p-10 md:p-14 shadow-2xl">
            {/* Background Image */}
            <div
                className="absolute inset-0 bg-cover bg-center scale-105 transition-transform duration-[8s] hover:scale-110"
                style={{ backgroundImage: 'url("/hero-bg.png")' }}
            />
            {/* Dark Premium Gradients */}
            <div className="absolute inset-0 bg-gradient-to-r from-slate-950/95 via-slate-900/80 to-slate-900/30" />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-transparent to-transparent" />

            {/* Ambient Glows */}
            <div className="absolute right-[10%] bottom-[15%] w-72 h-72 bg-primary-600/20 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute top-[10%] right-[25%] w-48 h-48 bg-accent-500/10 rounded-full blur-[90px] pointer-events-none" />

            {/* Main Content Area */}
            <div className="relative z-10 max-w-2xl my-auto pb-8 md:pb-0">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, ease: 'easeOut' }}
                >
                    {/* Badge */}
                    <div className="inline-flex items-center gap-2 mb-4 px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white/90 text-xs font-semibold tracking-wide">
                        <Sparkles size={12} className="text-primary-400 animate-pulse" />
                        Yeni Nesil Konaklama Deneyimi
                    </div>

                    {/* Headline */}
                    <h1 className="font-heading text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold mb-4 leading-[1.15] text-white tracking-tight">
                        Hayalindeki{' '}
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-400 via-primary-300 to-accent-400">
                            Konforu
                        </span>{' '}
                        Keşfet
                    </h1>

                    {/* Paragraph description */}
                    <p className="text-sm sm:text-base md:text-lg text-white/80 mb-6 max-w-lg leading-relaxed font-body">
                        Türkiye'nin dört bir yanında <span className="text-white font-semibold">5.000'den fazla</span> seçkin konaklamayı keşfedin. 
                        DwellGo ile güvenli ödeme, anlık onay ve <span className="text-white font-semibold">gerçek misafir yorumları</span> ile 
                        kusursuz bir konaklama deneyimi yaşayın.
                    </p>

                    {/* Unique Value Propositions (No duplicates with stats) */}
                    <div className="flex flex-wrap gap-2.5">
                        {[
                            { icon: ShieldCheck, text: 'Güvenli & Onaylı İlanlar', color: '#10b981' },
                            { icon: Clock,       text: 'Anında Rezervasyon Onayı', color: '#3b82f6' },
                            { icon: Compass,     text: 'Kişiselleştirilmiş Arama', color: '#f59e0b' },
                        ].map(({ icon: Icon, text, color }) => (
                            <div
                                key={text}
                                className="flex items-center gap-2 px-3 py-1.5 rounded-xl backdrop-blur-sm border border-white/10 text-white/90 text-xs sm:text-sm font-medium transition-all duration-300 hover:border-white/25"
                                style={{ background: `${color}15` }}
                            >
                                <Icon size={14} style={{ color }} />
                                {text}
                            </div>
                        ))}
                    </div>
                </motion.div>
            </div>

            {/* Bottom Stats Section (Ensured no overlaps, stacked nicely on mobile) */}
            <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="relative z-10 pt-4 border-t border-white/10 flex flex-row flex-wrap gap-x-10 gap-y-3 mt-4 md:mt-0"
            >
                {[
                    { value: '5,000+', label: 'Seçkin İlan' },
                    { value: '81',     label: 'Şehir' },
                    { value: '4.9★',   label: 'Müşteri Puanı' },
                ].map(({ value, label }) => (
                    <div key={label} className="flex flex-col">
                        <span className="font-heading font-bold text-lg sm:text-xl text-white tracking-tight">{value}</span>
                        <span className="text-[10px] sm:text-xs text-white/60 font-medium uppercase tracking-wider">{label}</span>
                    </div>
                ))}
            </motion.div>
        </div>
    );
}
