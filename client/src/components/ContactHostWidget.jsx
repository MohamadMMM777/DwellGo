import { useContext, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { UserContext } from '../contexts/UserContext.jsx';
import { MessageCircle, User } from 'lucide-react';

export default function ContactHostWidget({ place }) {
    const { user } = useContext(UserContext);
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);

    if (!user || user.role?.toLowerCase() === 'admin') return null;
    const userId = user._id || user.id;
    if (userId && (userId === place.owner?.toString() || userId === place.ownerId?.toString())) return null;

    async function handleContact() {
        if (!user) { toast.error('Mesaj göndermek için giriş yapmalısınız.'); return; }
        setLoading(true);
        try {
            const ownerId = place.owner || place.ownerId;
            const res = await axios.post('/chat/conversations', { otherUserId: ownerId });
            navigate(`/account/messages?conv=${res.data._id || res.data.id}`);
        } catch (err) {
            const msg = err.response?.data?.message;
            toast.error(msg || 'Mesaj gönderilemedi, lütfen tekrar deneyin.');
            setLoading(false);
        }
    }

    return (
        <div className="mt-4 p-5 rounded-2xl border" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
            <h2 className="font-heading font-semibold text-lg mb-1" style={{ color: 'var(--on-surface)' }}>
                Ev Sahibiyle İletişim
            </h2>
            <p className="text-sm mb-4" style={{ color: 'var(--on-surface-2)' }}>
                Sorularınız için ev sahibine doğrudan mesaj gönderin.
            </p>

            <div className="flex items-center gap-3 mb-4">
                <div className="w-11 h-11 rounded-xl flex items-center justify-center font-bold text-sm uppercase text-white bg-gradient-to-br from-primary-500 to-primary-700">
                    {place.ownerName?.charAt(0) || <User size={16} />}
                </div>
                <div>
                    <Link to={`/user/${place.owner}`}
                        className="font-semibold text-sm hover:text-primary-600 transition-colors"
                        style={{ color: 'var(--on-surface)' }}>
                        {place.ownerName || 'Ev Sahibi'}
                    </Link>
                    <p className="text-xs" style={{ color: 'var(--on-surface-2)' }}>İlan Sahibi</p>
                </div>
            </div>

            <button
                onClick={handleContact}
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold text-white bg-primary-600 hover:bg-primary-700 transition-colors disabled:opacity-50">
                <MessageCircle size={15} />
                {loading ? 'Yükleniyor...' : 'Mesaj Gönder'}
            </button>
        </div>
    );
}
