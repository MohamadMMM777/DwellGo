import { useState } from 'react';

export default function Image({ src, alt = '', className = '', style = {}, ...rest }) {
    const [loaded, setLoaded] = useState(false);
    const [errored, setErrored] = useState(false);
    const fallbackImage = '/uploads/placeholder.jpg';

    const resolvedSrc = errored
        ? fallbackImage
        : src && src.includes('https://')
            ? src
            : '/uploads/' + src;

    return (
        <img
            {...rest}
            src={resolvedSrc}
            alt={alt}
            className={className + (!loaded ? ' shimmer' : '')}
            style={{ transition: 'opacity 0.3s', opacity: loaded ? 1 : 0.6, ...style }}
            onLoad={() => setLoaded(true)}
            onError={() => { setErrored(true); setLoaded(true); }}
        />
    );
}
