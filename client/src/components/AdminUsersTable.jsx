import { Link } from 'react-router-dom';
import { Trash2, User, Crown } from 'lucide-react';

export default function AdminUsersTable({ userList, currentUser, deleteUser }) {
    if (!userList.length) return (
        <p className="text-center py-10 text-sm" style={{ color: 'var(--on-surface-2)' }}>Kullanıcı bulunamadı</p>
    );
    return (
        <div className="overflow-x-auto">
            <table className="w-full text-sm">
                <thead>
                    <tr style={{ background: 'var(--surface-2)', borderBottom: '1px solid var(--border)' }}>
                        {['Ad', 'E-posta', 'Rol', 'İşlem'].map(h => (
                            <th key={h} className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider"
                                style={{ color: 'var(--on-surface-2)' }}>{h}</th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {userList.map(u => (
                        <tr key={u._id} className="border-b transition-colors"
                            style={{ borderColor: 'var(--border)' }}
                            onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-2)'}
                            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                            <td className="px-4 py-3">
                                <Link to={`/user/${u._id}`}
                                    className="font-medium hover:text-primary-600 transition-colors"
                                    style={{ color: 'var(--on-surface)' }}>
                                    {u.name}
                                </Link>
                            </td>
                            <td className="px-4 py-3" style={{ color: 'var(--on-surface-2)' }}>{u.email}</td>
                            <td className="px-4 py-3">
                                <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold ${u.role?.toUpperCase() === 'ADMIN' ? 'badge badge-warning' : 'badge badge-primary'}`}>
                                    {u.role?.toUpperCase() === 'ADMIN' ? <Crown size={10} /> : <User size={10} />}
                                    {u.role?.toUpperCase() === 'ADMIN' ? 'Yönetici' : 'Kullanıcı'}
                                </span>
                            </td>
                            <td className="px-4 py-3">
                                {u._id !== currentUser._id && (
                                    <button onClick={() => deleteUser(u._id)}
                                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-error-600 border border-error-200 hover:bg-error-50 transition-colors">
                                        <Trash2 size={11} /> Sil
                                    </button>
                                )}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
