import Header from "./Header";
import { Outlet, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Globe, DollarSign } from "lucide-react";

function Footer() {
  return (
    <footer className="mt-16 border-t py-12" style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}>
      <div className="max-w-6xl mx-auto px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-10">

          {/* Brand */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 p-2 flex items-center justify-center">
                <img src="/logo.svg" alt="DwellGo" className="w-full h-full object-contain brightness-0 invert" />
              </div>
              <span className="font-heading font-extrabold text-lg text-primary-600 dark:text-primary-400">DwellGo</span>
            </div>
            <p className="text-sm leading-relaxed max-w-xs" style={{ color: 'var(--on-surface-2)' }}>
              Türkiye genelinde güvenli ve kolay kiralık ev deneyimi. Hayalinizdeki evi bulun.
            </p>
          </div>

          {/* Keşfet */}
          <div>
            <h3 className="font-heading font-semibold text-sm mb-4" style={{ color: 'var(--on-surface)' }}>Keşfet</h3>
            <ul className="space-y-2.5 text-sm" style={{ color: 'var(--on-surface-2)' }}>
              <li><a href="/" className="hover:text-primary-600 transition-colors">İlanlar</a></li>
              <li><a href="/login" className="hover:text-primary-600 transition-colors">Giriş Yap</a></li>
              <li><a href="/register" className="hover:text-primary-600 transition-colors">Kayıt Ol</a></li>
            </ul>
          </div>

          {/* Yasal */}
          <div>
            <h3 className="font-heading font-semibold text-sm mb-4" style={{ color: 'var(--on-surface)' }}>Yasal</h3>
            <ul className="space-y-2.5 text-sm" style={{ color: 'var(--on-surface-2)' }}>
              <li><span className="cursor-default hover:text-primary-600 transition-colors">Gizlilik Politikası</span></li>
              <li><span className="cursor-default hover:text-primary-600 transition-colors">Kullanım Şartları</span></li>
              <li><span className="cursor-default hover:text-primary-600 transition-colors">Çerez Politikası</span></li>
            </ul>
          </div>
        </div>

        <div className="border-t pt-6 flex flex-col sm:flex-row justify-between items-center gap-3" style={{ borderColor: 'var(--border)' }}>
          <p className="text-xs" style={{ color: 'var(--on-surface-2)' }}>
            © {new Date().getFullYear()} DwellGo. Tüm hakları saklıdır.
          </p>
          <div className="flex items-center gap-4 text-xs" style={{ color: 'var(--on-surface-2)' }}>
            <span className="flex items-center gap-1.5"><Globe size={12} /> Türkçe (TR)</span>
            <span className="flex items-center gap-1.5"><DollarSign size={12} /> TRY</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default function Layout() {
  const location = useLocation();
  return (
    <div className="flex flex-col min-h-screen" style={{ background: 'var(--background)' }}>
      <Header />
      <main className="flex-1">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </main>
      <Footer />
    </div>
  );
}
