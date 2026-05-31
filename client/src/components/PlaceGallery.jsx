import { useState } from "react";
import Image from "./Image.jsx";
import { X, Images } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function PlaceGallery({ place }) {
    const [showAllPhotos, setShowAllPhotos] = useState(false);
    // Normalize photos: accept both string URLs and {url, id, isMain} objects
    const photos = (place?.photos || []).map(p => (typeof p === 'string' ? p : p?.url)).filter(Boolean);
    const normalizedPlace = { ...place, photos };

    if (showAllPhotos) {
        return (
            <AnimatePresence>
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-50 overflow-y-auto"
                    style={{ background: 'var(--background)' }}>
                    <div className="max-w-4xl mx-auto px-4 pb-12">
                        <div className="sticky top-0 z-10 flex items-center justify-between py-4 border-b mb-6"
                            style={{ background: 'var(--background)', borderColor: 'var(--border)' }}>
                            <h2 className="font-heading font-bold text-lg" style={{ color: 'var(--on-surface)' }}>
                                {place.title} — Fotoğraflar
                            </h2>
                            <button onClick={() => setShowAllPhotos(false)}
                                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold border transition-colors"
                                style={{ borderColor: 'var(--border)', color: 'var(--on-surface)', background: 'var(--surface)' }}>
                                <X size={14} /> Kapat
                            </button>
                        </div>
                        <div className="grid gap-4">
                            {normalizedPlace.photos.map((photo, i) => (
                                <motion.div
                                    key={photo}
                                    initial={{ opacity: 0, y: 16 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: i * 0.05 }}
                                    className="overflow-hidden rounded-2xl">
                                    <Image className="w-full object-cover" src={photo} alt="" />
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </motion.div>
            </AnimatePresence>
        );
    }

    return (
        <div className="relative group/gallery">
            <div className="grid gap-2 grid-cols-1 md:grid-cols-4 aspect-[16/10] md:aspect-[21/9] rounded-2xl overflow-hidden">
                {/* Main Photo */}
                <div className="md:col-span-2 h-full overflow-hidden">
                    {normalizedPlace.photos[0] && (
                        <Image
                            onClick={() => setShowAllPhotos(true)}
                            className="w-full h-full cursor-pointer object-cover hover:scale-105 transition-transform duration-700"
                            src={normalizedPlace.photos[0]}
                            alt=""
                        />
                    )}
                </div>

                {/* Side Photos */}
                <div className="hidden md:grid grid-cols-1 grid-rows-2 gap-2 h-full">
                    {[1, 2].map(i => (
                        <div key={i} className="overflow-hidden h-full" style={{ background: 'var(--surface-2)' }}>
                            {normalizedPlace.photos[i] && (
                                <Image onClick={() => setShowAllPhotos(true)}
                                    className="w-full h-full cursor-pointer object-cover hover:scale-105 transition-transform duration-700"
                                    src={normalizedPlace.photos[i]} alt="" />
                            )}
                        </div>
                    ))}
                </div>

                <div className="hidden md:grid grid-cols-1 grid-rows-2 gap-2 h-full">
                    {[3, 4].map(i => (
                        <div key={i} className="overflow-hidden h-full" style={{ background: 'var(--surface-2)' }}>
                            {normalizedPlace.photos[i] && (
                                <Image onClick={() => setShowAllPhotos(true)}
                                    className="w-full h-full cursor-pointer object-cover hover:scale-105 transition-transform duration-700"
                                    src={normalizedPlace.photos[i]} alt="" />
                            )}
                        </div>
                    ))}
                </div>
            </div>

            <button
                onClick={() => setShowAllPhotos(true)}
                className="absolute bottom-4 right-4 flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold border backdrop-blur-md shadow-lg transition-colors"
                style={{ background: 'rgba(255,255,255,0.9)', color: '#1e293b', borderColor: 'rgba(0,0,0,0.1)' }}>
                <Images size={15} />
                Tümünü Gör ({normalizedPlace.photos.length})
            </button>
        </div>
    );
}
