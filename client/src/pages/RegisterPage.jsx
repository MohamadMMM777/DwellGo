import { Link, Navigate } from "react-router-dom";
import { useContext, useState } from "react";
import axios from "axios";
import { UserContext } from '../contexts/UserContext.jsx';
import { toast } from 'react-hot-toast';
import { User, Mail, Lock, UserPlus } from 'lucide-react';
import { motion } from 'framer-motion';

export default function RegisterPage() {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [redirect, setRedirect] = useState(false);
    const [loading, setLoading] = useState(false);
    const { setUser } = useContext(UserContext);

    async function registerUser(ev) {
        ev.preventDefault();
        setLoading(true);
        try {
            await axios.post('/register', { name, email, password });
            const loginRes = await axios.post('/login', { email, password });
            setUser(loginRes.data);
            toast.success('Hesabınız oluşturuldu!');
            setRedirect(true);
        } catch (err) {
            const errorMsg = err.response?.data?.error || 'Kayıt başarısız. Lütfen bilgilerinizi kontrol edin.';
            toast.error(errorMsg);
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
                        <UserPlus size={24} className="text-white" />
                    </div>
                    <h1 className="font-heading font-bold text-2xl" style={{ color: 'var(--on-surface)' }}>Hesap Oluşturun</h1>
                    <p className="text-sm mt-1" style={{ color: 'var(--on-surface-2)' }}>DwellGo'ya katılın</p>
                </div>

                <form onSubmit={registerUser} className="space-y-3">
                    {[
                        { Icon: User, type: 'text', placeholder: 'Ad Soyad', value: name, onChange: setName, name: 'name', auto: 'name' },
                        { Icon: Mail, type: 'email', placeholder: 'E-posta adresi', value: email, onChange: setEmail, name: 'email', auto: 'email' },
                        { Icon: Lock, type: 'password', placeholder: 'Şifre', value: password, onChange: setPassword, name: 'password', auto: 'new-password' },
                    ].map(({ Icon, type, placeholder, value, onChange, name, auto }) => (
                        <div key={placeholder} className="flex items-center gap-2.5 px-4 py-3 rounded-xl border"
                            style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}>
                            <Icon size={15} style={{ color: 'var(--on-surface-2)', flexShrink: 0 }} />
                            <input type={type} placeholder={placeholder}
                                name={name} autoComplete={auto}
                                value={value} onChange={ev => onChange(ev.target.value)} required
                                className="flex-1 bg-transparent border-none p-0 m-0 text-sm focus:ring-0 focus:outline-none"
                                style={{ color: 'var(--on-surface)', boxShadow: 'none' }} />
                        </div>
                    ))}

                    <motion.button
                        type="submit"
                        disabled={loading}
                        whileTap={{ scale: 0.98 }}
                        className="w-full py-3 rounded-xl font-semibold text-sm text-white bg-primary-600 hover:bg-primary-700 transition-colors shadow-primary disabled:opacity-60">
                        {loading ? 'Hesap oluşturuluyor...' : 'Hesap Oluştur'}
                    </motion.button>

                    <p className="text-center text-sm pt-1" style={{ color: 'var(--on-surface-2)' }}>
                        Zaten hesabınız var mı?{' '}
                        <Link to="/login" className="font-semibold text-primary-600 hover:text-primary-700 transition-colors">
                            Giriş Yap
                        </Link>
                    </p>
                </form>
            </motion.div>
        </div>
    );
}
