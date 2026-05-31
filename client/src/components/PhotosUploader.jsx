import axios from "axios";
import { useState } from "react";
import Image from "./Image.jsx";
import { Trash2, Star, Upload, Link as LinkIcon } from 'lucide-react';

export default function PhotosUploader({ addedPhotos, onChange }) {
    const [photoLink, setPhotoLink] = useState('');

    async function addPhotoByLink(ev) {
        ev.preventDefault();
        try {
            const { data: filename } = await axios.post('/upload-by-link', { link: photoLink });
            onChange(prev => [...prev, filename]);
            setPhotoLink('');
        } catch (err) {
            alert('Bağlantıdan fotoğraf yüklenemedi');
        }
    }

    function uploadPhoto(ev) {
        const files = ev.target.files;
        const data = new FormData();
        for (let i = 0; i < files.length; i++) {
            data.append('photos', files[i]);
        }
        axios.post('/upload', data, {
            headers: { 'Content-type': 'multipart/form-data' }
        }).then(response => {
            const { data: filenames } = response;
            onChange(prev => [...prev, ...filenames]);
        }).catch(() => {
            alert('Fotoğraf yükleme başarısız');
        });
    }

    function removePhoto(ev, filename) {
        ev.preventDefault();
        onChange([...addedPhotos.filter(photo => photo !== filename)]);
    }

    function selectAsMainPhoto(ev, filename) {
        ev.preventDefault();
        onChange([filename, ...addedPhotos.filter(photo => photo !== filename)]);
    }

    return (
        <div className="space-y-3">
            {/* Link upload */}
            <div className="flex gap-2">
                <div className="flex-1 flex items-center gap-2 px-3.5 py-2.5 rounded-xl border"
                    style={{ borderColor: 'var(--border)', background: 'var(--surface-2)' }}>
                    <LinkIcon size={14} style={{ color: 'var(--on-surface-2)', flexShrink: 0 }} />
                    <input
                        value={photoLink}
                        onChange={ev => setPhotoLink(ev.target.value)}
                        type="text"
                        placeholder="Bağlantıdan ekle ...jpg"
                        className="flex-1 bg-transparent border-none text-sm p-0 m-0 focus:ring-0 focus:outline-none"
                        style={{ color: 'var(--on-surface)', boxShadow: 'none' }}
                    />
                </div>
                <button onClick={addPhotoByLink}
                    className="px-4 py-2.5 rounded-xl text-sm font-medium border transition-colors"
                    style={{ borderColor: 'var(--border)', background: 'var(--surface-2)', color: 'var(--on-surface)' }}>
                    Ekle
                </button>
            </div>

            {/* Photo grid */}
            <div className="grid gap-2 grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
                {addedPhotos.map(link => (
                    <div className="h-32 relative rounded-2xl overflow-hidden group" key={link}>
                        <Image className="w-full h-full object-cover" src={link} alt="" />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                        <button onClick={ev => removePhoto(ev, link)}
                            className="absolute bottom-1.5 right-1.5 w-7 h-7 flex items-center justify-center rounded-xl bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/80">
                            <Trash2 size={13} />
                        </button>
                        <button onClick={ev => selectAsMainPhoto(ev, link)}
                            className="absolute bottom-1.5 left-1.5 w-7 h-7 flex items-center justify-center rounded-xl bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/80">
                            <Star size={13} fill={link === addedPhotos[0] ? '#fbbf24' : 'none'} style={{ color: link === addedPhotos[0] ? '#fbbf24' : 'white' }} />
                        </button>
                        {link === addedPhotos[0] && (
                            <div className="absolute top-1.5 left-1.5 px-2 py-0.5 rounded-lg text-[10px] font-bold text-white bg-primary-600">
                                Ana
                            </div>
                        )}
                    </div>
                ))}

                {/* Upload button */}
                <label className="h-32 cursor-pointer flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed transition-colors"
                    style={{ borderColor: 'var(--border-2)', color: 'var(--on-surface-2)' }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--primary-400)'; e.currentTarget.style.background = 'var(--primary-50)'; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-2)'; e.currentTarget.style.background = 'transparent'; }}>
                    <input type="file" multiple className="hidden" onChange={uploadPhoto} />
                    <Upload size={22} />
                    <span className="text-xs font-medium">Yükle</span>
                </label>
            </div>
        </div>
    );
}
