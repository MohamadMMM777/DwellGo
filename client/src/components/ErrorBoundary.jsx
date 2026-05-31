import { Component } from 'react';
import { AlertTriangle } from 'lucide-react';

export default class ErrorBoundary extends Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, info) {
        console.error('[ErrorBoundary]', error, info);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="flex flex-col items-center justify-center py-24 px-6 text-center gap-4">
                    <div className="w-16 h-16 rounded-2xl flex items-center justify-center"
                        style={{ background: 'var(--error-50)' }}>
                        <AlertTriangle size={28} style={{ color: 'var(--error-500)' }} />
                    </div>
                    <h2 className="font-heading font-bold text-xl" style={{ color: 'var(--on-surface)' }}>
                        Bir şeyler ters gitti
                    </h2>
                    <p className="text-sm max-w-sm" style={{ color: 'var(--on-surface-2)' }}>
                        Bu sayfa yüklenirken bir hata oluştu. Sayfayı yenilemeyi deneyin.
                    </p>
                    <p className="text-xs font-mono px-4 py-2 rounded-xl max-w-lg break-all"
                        style={{ background: 'var(--surface-2)', color: 'var(--on-surface-2)' }}>
                        {this.state.error?.message || 'Unknown error'}
                    </p>
                    <button
                        onClick={() => { this.setState({ hasError: false, error: null }); window.location.reload(); }}
                        className="mt-2 px-6 py-2.5 rounded-xl text-sm font-semibold text-white bg-primary-600 hover:bg-primary-700 transition-colors">
                        Sayfayı Yenile
                    </button>
                </div>
            );
        }
        return this.props.children;
    }
}
