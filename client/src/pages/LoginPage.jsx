import { Link, Navigate } from "react-router-dom";
import { useContext, useState } from "react";
import axios from "axios";
import { UserContext } from '../contexts/UserContext.jsx';
import { toast } from 'react-hot-toast';
import { Mail, Lock, LogIn } from 'lucide-react';
import { motion } from 'framer-motion';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [redirect, setRedirect] = useState(false);
    const [loading, setLoading] = useState(false);
    const { setUser } = useContext(UserContext);

    async function handleLoginSubmit(ev) {
        ev.preventDefault();
        setLoading(true);
        try {
            const { data } = await axios.post('/login', { email, password });
            setUser(data);
            toast.success('Giriş başarılı!');
            setRedirect(true);
        } catch {
            toast.error('E-posta veya şifre hatalı.');
        } finally {
            setLoading(false);
        }
    }

    if (redirect) return <Navigate to={'/'} />;

    return (
        <div className="min-h-[80vh] flex items-center justify-center px-4">
            <motion.div
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="w-full max-w-sm">

                <div className="text-center mb-8">
                    <div className="w-14 h-14 rounded-2xl bg-primary-600 flex items-center justify-center mx-auto mb-4 shadow-primary">
                        <LogIn size={24} className="text-white" />
                    </div>
                    <h1 className="font-heading font-bold text-2xl" style={{ color: 'var(--on-surface)' }}>Tekrar Hoşgeldiniz</h1>
                    <p className="text-sm mt-1" style={{ color: 'var(--on-surface-2)' }}>Hesabınıza giriş yapın</p>
                </div>

                <form onSubmit={handleLoginSubmit} className="space-y-3">
                    <div className="flex items-center gap-2.5 px-4 py-3 rounded-xl border"
                        style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}>
                        <Mail size={15} style={{ color: 'var(--on-surface-2)', flexShrink: 0 }} />
                        <input type="email" id="email" name="email" placeholder="E-posta adresiniz"
                            autocomplete="username"
                            value={email} onChange={ev => setEmail(ev.target.value)} required
                            className="flex-1 bg-transparent border-none p-0 m-0 text-sm focus:ring-0 focus:outline-none"
                            style={{ color: 'var(--on-surface)', boxShadow: 'none' }} />
                    </div>
                    <div className="flex items-center gap-2.5 px-4 py-3 rounded-xl border"
                        style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}>
                        <Lock size={15} style={{ color: 'var(--on-surface-2)', flexShrink: 0 }} />
                        <input type="password" id="password" name="password" placeholder="Şifreniz"
                            autocomplete="current-password"
                            value={password} onChange={ev => setPassword(ev.target.value)} required
                            className="flex-1 bg-transparent border-none p-0 m-0 text-sm focus:ring-0 focus:outline-none"
                            style={{ color: 'var(--on-surface)', boxShadow: 'none' }} />
                    </div>

                    <motion.button
                        type="submit"
                        disabled={loading}
                        whileTap={{ scale: 0.98 }}
                        className="w-full py-3 rounded-xl font-semibold text-sm text-white bg-primary-600 hover:bg-primary-700 transition-colors shadow-primary disabled:opacity-60">
                        {loading ? 'Giriş yapılıyor...' : 'Giriş Yap'}
                    </motion.button>

                    <p className="text-center text-sm pt-1" style={{ color: 'var(--on-surface-2)' }}>
                        Hesabınız yok mu?{' '}
                        <Link to="/register" className="font-semibold text-primary-600 hover:text-primary-700 transition-colors">
                            Kayıt Ol
                        </Link>
                    </p>
                </form>
            </motion.div>
        </div>
    );
}
