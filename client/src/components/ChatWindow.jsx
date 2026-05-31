import { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { Send, MessageCircle, Check, CheckCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function ChatWindow({ conversation, currentUser }) {
    const [messages, setMessages] = useState([]);
    const [newText, setNewText] = useState('');
    const [sending, setSending] = useState(false);
    const messagesContainerRef = useRef(null);

    function scrollToBottom() {
        if (messagesContainerRef.current) {
            messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
        }
    }

    const other = conversation?.participants?.find(p => p._id !== currentUser._id);

    useEffect(() => {
        if (!conversation) return;
        setMessages([]);
        async function fetchMessages() {
            try {
                const res = await axios.get(`/chat/conversations/${conversation._id}/messages`);
                setMessages(res.data);
                axios.put(`/chat/conversations/${conversation._id}/read`).catch(() => {});
            } catch {}
        }
        fetchMessages();
        const interval = setInterval(fetchMessages, 5000);
        return () => clearInterval(interval);
    }, [conversation]);

    useEffect(() => { scrollToBottom(); }, [messages]);

    async function handleSend(e) {
        e.preventDefault();
        if (!newText.trim()) return;
        setSending(true);
        try {
            const res = await axios.post(`/chat/conversations/${conversation._id}/messages`, { text: newText });
            setMessages(prev => [...prev, res.data]);
            setNewText('');
        } catch {}
        finally { setSending(false); }
    }

    if (!conversation) {
        return (
            <div className="flex-1 flex items-center justify-center h-full">
                <div className="text-center">
                    <MessageCircle size={48} className="mx-auto mb-4 opacity-20" style={{ color: 'var(--on-surface-2)' }} />
                    <p className="font-semibold" style={{ color: 'var(--on-surface)' }}>Konuşma seçin</p>
                    <p className="text-sm mt-1" style={{ color: 'var(--on-surface-2)' }}>Bir konuşma seçerek mesajlaşmaya başlayın.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex-1 flex flex-col h-full">
            {/* Header */}
            <div className="px-5 py-4 border-b flex items-center gap-3"
                style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm uppercase text-white bg-gradient-to-br from-primary-500 to-primary-700">
                    {other?.name?.charAt(0) || '?'}
                </div>
                <div>
                    <p className="font-semibold text-sm" style={{ color: 'var(--on-surface)' }}>{other?.name || 'Kullanıcı'}</p>
                    <p className="text-xs" style={{ color: 'var(--on-surface-2)' }}>Özel Mesaj</p>
                </div>
            </div>

            {/* Messages */}
            <div ref={messagesContainerRef} className="flex-1 overflow-y-auto p-5 flex flex-col gap-3"
                style={{ background: 'var(--wa-bg)', backgroundImage: 'url("https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png")', backgroundBlendMode: 'overlay', backgroundOpacity: '0.05' }}>
                {messages.length === 0 && (
                    <div className="flex justify-center">
                        <p className="bg-white/20 backdrop-blur-sm px-4 py-1.5 rounded-lg text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--on-surface)', background: 'var(--surface)', opacity: 0.8 }}>
                            Henüz mesaj yok. İlk mesajı siz gönderin!
                        </p>
                    </div>
                )}
                <AnimatePresence initial={false}>
                    {messages.map(msg => {
                        const isMe = msg.sender._id === currentUser._id;
                        return (
                            <motion.div
                                key={msg._id}
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ duration: 0.15 }}
                                className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                                <div className={`relative max-w-[85%] md:max-w-md px-3 py-1.5 rounded-xl shadow-sm ${isMe ? 'rounded-tr-none' : 'rounded-tl-none'}`}
                                    style={{
                                        background: isMe ? 'var(--wa-my-msg)' : 'var(--wa-other-msg)',
                                        color: isMe ? 'var(--on-surface)' : 'var(--on-surface)',
                                        border: 'none',
                                    }}>
                                    <p className="text-[14px] leading-relaxed pr-12">{msg.text}</p>
                                    
                                    <div className="absolute bottom-1 right-1.5 flex items-center gap-1">
                                        <span className="text-[10px]" style={{ color: 'var(--wa-time)' }}>
                                            {new Date(msg.createdAt).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                        {isMe && (
                                            <div className="flex items-center">
                                                {msg.read ? (
                                                    <CheckCheck size={14} style={{ color: 'var(--wa-tick-blue)' }} />
                                                ) : (
                                                    <CheckCheck size={14} style={{ color: 'var(--wa-tick-grey)' }} />
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })}
                </AnimatePresence>
            </div>

            {/* Input */}
            <form onSubmit={handleSend}
                className="px-4 py-3 border-t flex gap-2 items-center"
                style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
                <input
                    type="text"
                    className="flex-1 px-4 py-2.5 rounded-xl text-sm border focus:ring-2 focus:ring-primary-500/20 focus:outline-none"
                    style={{ background: 'var(--surface-2)', borderColor: 'var(--border)', color: 'var(--on-surface)' }}
                    placeholder="Mesajınızı yazın..."
                    value={newText}
                    onChange={e => setNewText(e.target.value)}
                    disabled={sending}
                />
                <button type="submit"
                    disabled={sending || !newText.trim()}
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-white bg-primary-600 hover:bg-primary-700 transition-colors disabled:opacity-40">
                    <Send size={15} />
                </button>
            </form>
        </div>
    );
}
