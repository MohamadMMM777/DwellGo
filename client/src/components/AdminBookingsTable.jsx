export default function AdminBookingsTable({ bookings }) {
    if (!bookings.length) return (
        <p className="text-center py-10 text-sm" style={{ color: 'var(--on-surface-2)' }}>Rezervasyon bulunamadı</p>
    );
    return (
        <div className="overflow-x-auto">
            <table className="w-full text-sm">
                <thead>
                    <tr style={{ background: 'var(--surface-2)', borderBottom: '1px solid var(--border)' }}>
                        {['Kullanıcı', 'İlan', 'Giriş', 'Çıkış', 'Tutar'].map(h => (
                            <th key={h} className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider"
                                style={{ color: 'var(--on-surface-2)' }}>{h}</th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {bookings.map(b => (
                        <tr key={b._id} className="border-b transition-colors"
                            style={{ borderColor: 'var(--border)' }}
                            onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-2)'}
                            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                            <td className="px-4 py-3">
                                <div className="font-medium" style={{ color: 'var(--on-surface)' }}>{b.user?.name || b.name}</div>
                                <div className="text-xs" style={{ color: 'var(--on-surface-2)' }}>{b.user?.email || ''}</div>
                            </td>
                            <td className="px-4 py-3 font-medium" style={{ color: 'var(--on-surface)' }}>{b.place?.title || '—'}</td>
                            <td className="px-4 py-3" style={{ color: 'var(--on-surface-2)' }}>
                                {b.checkIn ? new Date(b.checkIn).toLocaleDateString('tr-TR') : '—'}
                            </td>
                            <td className="px-4 py-3" style={{ color: 'var(--on-surface-2)' }}>
                                {b.checkOut ? new Date(b.checkOut).toLocaleDateString('tr-TR') : '—'}
                            </td>
                            <td className="px-4 py-3 font-bold" style={{ color: 'var(--primary-600)' }}>
                                ₺{(b.price || 0).toLocaleString('tr-TR')}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
