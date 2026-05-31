import { useContext, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { UserContext } from '../contexts/UserContext.jsx';
import ChatWindow from '../components/ChatWindow.jsx';
import { MessageCircle } from 'lucide-react';

export default function ChatPage() {
    const { user } = useContext(UserContext);
    const [searchParams] = useSearchParams();
    const [conversations, setConversations] = useState([]);
    const [selected, setSelected] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        axios.get('/chat/conversations').then(res => {
            const convs = res.data;
            setConversations(convs);
            const convId = searchParams.get('conv');
            if (convId) {
                const match = convs.find(c => c._id === convId || c.id === convId);
                if (match) setSelected(match);
            }
            setLoading(false);
        }).catch(() => setLoading(false));
    }, [searchParams]);

    function getOther(conv) {
        return conv.participants?.find(p => p._id !== user?._id);
    }

    return (
        <div className="flex rounded-2xl overflow-hidden border" style={{ height: '72vh', background: 'var(--surface)', borderColor: 'var(--border)' }}>
            {/* Sidebar */}
            <div className="w-full md:w-64 flex-shrink-0 border-r flex flex-col" style={{ background: 'var(--surface-2)', borderColor: 'var(--border)' }}>
                <div className="px-4 py-4 border-b" style={{ borderColor: 'var(--border)' }}>
                    <h2 className="font-heading font-bold text-sm flex items-center gap-2" style={{ color: 'var(--on-surface)' }}>
                        <MessageCircle size={15} /> Mesajlarım
                    </h2>
                </div>
                <div className="flex-1 overflow-y-auto">
                    {loading && (
                        <p className="text-center text-sm py-8" style={{ color: 'var(--on-surface-2)' }}>Yükleniyor...</p>
                    )}
                    {!loading && conversations.length === 0 && (
                        <div className="text-center py-12 px-4">
                            <MessageCircle size={28} className="mx-auto mb-2 opacity-20" style={{ color: 'var(--on-surface-2)' }} />
                            <p className="text-sm" style={{ color: 'var(--on-surface-2)' }}>Henüz bir konuşmanız yok.</p>
                        </div>
                    )}
                    {conversations.map(conv => {
                        const other = getOther(conv);
                        const isActive = selected?._id === conv._id;
                        return (
                            <button key={conv._id} onClick={() => setSelected(conv)}
                                className="w-full flex items-center gap-3 px-4 py-3 text-left transition-colors border-b"
                                style={{
                                    background: isActive ? 'var(--primary-50)' : 'transparent',
                                    borderColor: 'var(--border)',
                                    borderLeft: isActive ? '3px solid var(--primary-600)' : '3px solid transparent',
                                }}>
                                <div className="w-9 h-9 rounded-xl flex-shrink-0 flex items-center justify-center font-bold text-sm uppercase text-white bg-gradient-to-br from-primary-500 to-primary-700">
                                    {other?.name?.charAt(0) || '?'}
                                </div>
                                <div className="min-w-0">
                                    <p className="font-semibold text-sm truncate" style={{ color: 'var(--on-surface)' }}>{other?.name || 'Kullanıcı'}</p>
                                    <p className="text-xs truncate" style={{ color: 'var(--on-surface-2)' }}>Özel Mesaj</p>
                                </div>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Chat Window */}
            <div className="flex-1 flex flex-col min-w-0">
                <ChatWindow conversation={selected} currentUser={user} />
            </div>
        </div>
    );
}
