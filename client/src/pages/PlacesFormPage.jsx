import PhotosUploader from '../components/PhotosUploader.jsx';
import Perks from '../components/Perks.jsx';
import LocationSelector from '../components/LocationSelector.jsx';
import Map from '../components/Map.jsx';
import { useEffect, useState } from "react";
import axios from "axios";
import { Navigate, useParams, Link } from "react-router-dom";
import toast from "react-hot-toast";
import { ArrowLeft, ChevronLeft, Rocket, Users, Bed, Bath, Building2, Sofa, Building, Home, Castle } from 'lucide-react';
import { motion } from 'framer-motion';

const PROPERTY_TYPES = [
  { value: 'apartment', label: 'Daire', Icon: Building2 },
  { value: 'house', label: 'Ev', Icon: Home },
  { value: 'villa', label: 'Villa', Icon: Castle },
  { value: 'studio', label: 'Stüdyo', Icon: Sofa },
  { value: 'building', label: 'Bina', Icon: Building },
];

export default function PlacesFormPage() {
  const { id } = useParams();
  const [step, setStep] = useState(1);

  // Step 1: Basics
  const [title, setTitle] = useState('');
  const [propertyType, setPropertyType] = useState('apartment');
  const [description, setDescription] = useState('');

  // Step 2: Location
  const [city, setCity] = useState('');
  const [district, setDistrict] = useState('');
  const [neighborhood, setNeighborhood] = useState('');
  const [street, setStreet] = useState('');
  const [lat, setLat] = useState(39.9334);
  const [lng, setLng] = useState(32.8597);

  // Step 3: Visuals & Perks
  const [addedPhotos, setAddedPhotos] = useState([]);
  const [perks, setPerks] = useState([]);

  // Step 4: Capacity & Rules
  const [maxGuests, setMaxGuests] = useState(2);
  const [bedrooms, setBedrooms] = useState(1);
  const [beds, setBeds] = useState(1);
  const [bathrooms, setBathrooms] = useState(1);
  const [extraInfo, setExtraInfo] = useState('');
  const [checkIn, setCheckIn] = useState('14:00');
  const [checkOut, setCheckOut] = useState('11:00');

  // Step 5: Pricing
  const [price, setPrice] = useState(500);
  const [cleaningFee, setCleaningFee] = useState(0);
  const [serviceFee, setServiceFee] = useState(0);
  const [securityDeposit, setSecurityDeposit] = useState(0);

  const [redirect, setRedirect] = useState(false);

  useEffect(() => {
    if (!id || id === 'new') return;
    
    axios.get('/places/' + id)
      .then(response => {
        const { data } = response;
        setTitle(data.title || '');
        setPropertyType(data.propertyType || 'apartment');
        setCity(data.city || '');
        setDistrict(data.district || '');
        setNeighborhood(data.neighborhood || '');
        setStreet(data.street || '');
        setAddedPhotos(data.photos || []);
        setDescription(data.description || '');
        setPerks(data.perks || []);
        setExtraInfo(data.extraInfo || '');
        setCheckIn(data.checkIn !== null && data.checkIn !== undefined ? `${data.checkIn}:00` : '14:00');
        setCheckOut(data.checkOut !== null && data.checkOut !== undefined ? `${data.checkOut}:00` : '11:00');
        setPrice(data.price || 500);
        
        if (data.capacity) {
          setMaxGuests(data.capacity.maxGuests);
          setBedrooms(data.capacity.bedrooms);
          setBeds(data.capacity.beds);
          setBathrooms(data.capacity.bathrooms);
        }
        if (data.pricing) {
          setCleaningFee(data.pricing.cleaningFee);
          setServiceFee(data.pricing.serviceFee);
          setSecurityDeposit(data.pricing.securityDeposit);
        }
        if (data.location) {
          setLat(data.location.latitude);
          setLng(data.location.longitude);
        }
      })
      .catch(err => {
        console.error("Error fetching place details:", err);
        toast.error("İlan bilgileri yüklenemedi.");
      });
  }, [id]);

  function preInput(header, description) {
    return (
      <div className="mb-4">
        <h2 className="font-heading font-bold text-2xl" style={{ color: 'var(--on-surface)' }}>{header}</h2>
        {description && <p className="text-sm" style={{ color: 'var(--on-surface-2)' }}>{description}</p>}
      </div>
    );
  }

  async function savePlace(ev) {
    if (ev) ev.preventDefault();
    const address = [neighborhood, district, city].filter(Boolean).join(', ');
    const placeData = {
      title, propertyType, city, district, neighborhood, street, address,
      addedPhotos, description, perks, extraInfo, checkIn, checkOut, price,
      latitude: lat, longitude: lng,
      maxGuests, bedrooms, beds, bathrooms,
      cleaningFee, serviceFee, securityDeposit
    };
    try {
      if (id) {
        await axios.put('/places', { id, ...placeData });
      } else {
        await axios.post('/places', placeData);
      }
      toast.success(id ? 'İlan güncellendi! ✅' : 'İlan başarıyla yayınlandı! ✅');
      setRedirect(true);
    } catch (err) {
      console.error("Place save error:", err);
      const msg = err.response?.data?.error || err.response?.data || err.message || 'Bilinmeyen hata';
      toast.error('Kayıt başarısız: ' + msg);
    }
  }

  function nextStep() { setStep(prev => prev + 1); window.scrollTo(0, 0); }
  function prevStep() { setStep(prev => prev - 1); window.scrollTo(0, 0); }

  if (redirect) return <Navigate to={'/account/places'} />;

  const ProgressBar = () => (
    <div className="flex items-center justify-between mb-10 max-w-xl mx-auto px-4">
      {[1, 2, 3, 4, 5].map((s) => (
        <div key={s} className="flex items-center flex-1 last:flex-none">
          <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all duration-300 border-2" style={{
            background: step >= s ? 'var(--primary-600)' : 'var(--surface)',
            borderColor: step >= s ? 'var(--primary-600)' : 'var(--border)',
            color: step >= s ? 'white' : 'var(--on-surface-2)',
            boxShadow: step >= s ? '0 10px 25px rgba(37, 99, 235, 0.2)' : 'none'
          }}>
            {s}
          </div>
          {s < 5 && (
            <div className="h-1 flex-1 mx-2 rounded-full transition-all duration-500" style={{
              background: step > s ? 'var(--primary-600)' : 'var(--border)'
            }}></div>
          )}
        </div>
      ))}
    </div>
  );

  return (
    <div className="pb-10">
      <div className="max-w-3xl mx-auto p-6 md:p-8 rounded-2xl border" style={{
        background: 'var(--surface)',
        borderColor: 'var(--border)',
      }}>

        <Link to="/account/places" className="inline-flex items-center gap-2 mb-6 transition-colors hover:opacity-70" style={{ color: 'var(--on-surface-2)' }}>
          <ArrowLeft size={20} />
          Geri Dön
        </Link>

        <ProgressBar />

        <form onSubmit={(e) => e.preventDefault()}>
          
          {step === 1 && (
            <motion.div
              initial={{ opacity: 1, x: 8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 1, x: -8 }}
            >
              {preInput('Temel Bilgiler', 'Eviniz hakkında genel bir fikir verin')}
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold mb-2 ml-1" style={{ color: 'var(--on-surface)' }}>İlan Başlığı</label>
                  <input type="text" value={title} onChange={ev => setTitle(ev.target.value)}
                    placeholder="Örn: Boğaz Manzaralı Lüks Daire" className="text-lg py-3" />
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2 ml-1" style={{ color: 'var(--on-surface)' }}>Mülk Tipi</label>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                    {PROPERTY_TYPES.map(pt => {
                      const Icon = pt.Icon;
                      return (
                        <label key={pt.value}
                          className="cursor-pointer border-2 rounded-2xl p-4 text-center transition-all duration-200 hover:scale-105"
                          style={{
                            borderColor: propertyType === pt.value ? 'var(--primary-600)' : 'var(--border)',
                            background: propertyType === pt.value ? 'var(--primary-50)' : 'var(--surface-2)',
                            color: propertyType === pt.value ? 'var(--primary-600)' : 'var(--on-surface-2)',
                          }}>
                          <input type="radio" className="hidden" value={pt.value}
                            checked={propertyType === pt.value} onChange={() => setPropertyType(pt.value)} />
                          <div className="flex justify-center mb-1">
                            <Icon size={28} />
                          </div>
                          <span className="text-xs font-bold uppercase tracking-wider">{pt.label}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2 ml-1" style={{ color: 'var(--on-surface)' }}>Açıklama</label>
                  <textarea value={description} onChange={ev => setDescription(ev.target.value)}
                    placeholder="Evinizin öne çıkan özelliklerinden bahsedin..." className="min-h-[150px]" />
                </div>
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              initial={{ opacity: 1, x: 8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 1, x: -8 }}
            >
              {preInput('Konum Belirleme', 'Misafirlerin sizi bulmasını sağlayın')}
              <div className="space-y-6">
                <LocationSelector
                  city={city} district={district} neighborhood={neighborhood} street={street}
                  onChange={({ city: c, district: d, neighborhood: n, street: s }) => {
                    setCity(c); setDistrict(d); setNeighborhood(n); setStreet(s);
                  }}
                />

                <div className="mt-4">
                  <label className="block text-sm font-semibold mb-2 ml-1" style={{ color: 'var(--on-surface)' }}>Haritada İşaretleyin</label>
                  <Map
                    position={{lat, lng}}
                    setPosition={(p) => { setLat(p.lat); setLng(p.lng); }}
                    isEditable={true}
                  />
                  <p className="text-xs mt-2 italic" style={{ color: 'var(--on-surface-2)' }}>Daha kesin konum için haritaya tıklayabilirsiniz.</p>
                </div>
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div
              initial={{ opacity: 1, x: 8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 1, x: -8 }}
            >
              {preInput('Görseller & Olanaklar', 'Görsellik her şeydir')}
              <div className="space-y-8">
                <div>
                  <label className="block text-sm font-semibold mb-3 ml-1" style={{ color: 'var(--on-surface)' }}>Fotoğraflar</label>
                  <PhotosUploader addedPhotos={addedPhotos} onChange={setAddedPhotos} />
                </div>
                <div className="pt-8" style={{ borderTopColor: 'var(--border)', borderTopWidth: '1px' }}>
                  <label className="block text-sm font-semibold mb-4 ml-1" style={{ color: 'var(--on-surface)' }}>Sunulan Olanaklar</label>
                  <Perks selected={perks} onChange={setPerks} />
                </div>
              </div>
            </motion.div>
          )}

          {step === 4 && (
            <motion.div
              initial={{ opacity: 1, x: 8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 1, x: -8 }}
            >
              {preInput('Kapasite & Kurallar', 'Sınırları ve kuralları belirleyin')}
              <div className="grid gap-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { label: 'Max Misafir', val: maxGuests, set: setMaxGuests, Icon: Users },
                    { label: 'Yatak Odası', val: bedrooms, set: setBedrooms, Icon: Bed },
                    { label: 'Yatak Sayısı', val: beds, set: setBeds, Icon: Bed },
                    { label: 'Banyo Sayısı', val: bathrooms, set: setBathrooms, Icon: Bath },
                  ].map(item => {
                    const Icon = item.Icon;
                    return (
                      <div key={item.label}>
                        <label className="block text-xs font-bold uppercase mb-2 ml-1 flex items-center gap-1.5" style={{ color: 'var(--on-surface-2)' }}>
                          <Icon size={14} />
                          {item.label}
                        </label>
                        <input type="number" value={item.val} onChange={ev => item.set(Number(ev.target.value))} className="font-semibold text-center w-full" />
                      </div>
                    );
                  })}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold mb-2 ml-1" style={{ color: 'var(--on-surface)' }}>Giriş Saati</label>
                    <input type="text" value={checkIn} onChange={ev => setCheckIn(ev.target.value)} placeholder="14:00" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-2 ml-1" style={{ color: 'var(--on-surface)' }}>Çıkış Saati</label>
                    <input type="text" value={checkOut} onChange={ev => setCheckOut(ev.target.value)} placeholder="11:00" />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2 ml-1" style={{ color: 'var(--on-surface)' }}>Ek Bilgiler & Ev Kuralları</label>
                  <textarea value={extraInfo} onChange={ev => setExtraInfo(ev.target.value)} placeholder="Evcil hayvan, sigara kullanımı vb. kurallar..." />
                </div>
              </div>
            </motion.div>
          )}

          {step === 5 && (
            <motion.div
              initial={{ opacity: 1, x: 8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 1, x: -8 }}
            >
              {preInput('Finansal Detaylar', 'Kazancınızı planlayın')}
              <div className="grid gap-8">
                <div className="p-6 rounded-3xl border" style={{
                  background: 'var(--primary-50)',
                  borderColor: 'var(--primary-600)',
                }}>
                   <label className="block font-bold mb-2" style={{ color: 'var(--primary-600)' }}>Gecelik Temel Fiyat (₺)</label>
                   <input type="number" value={price} onChange={ev => setPrice(Number(ev.target.value))} className="text-3xl font-black w-full rounded-lg p-3" style={{ color: 'var(--primary-600)' }} />
                </div>

                <div className="grid md:grid-cols-3 gap-6">
                  {[
                    { label: 'Temizlik Ücreti', val: cleaningFee, set: setCleaningFee },
                    { label: 'Hizmet Bedeli', val: serviceFee, set: setServiceFee },
                    { label: 'Depozito', val: securityDeposit, set: setSecurityDeposit },
                  ].map(item => (
                    <div key={item.label}>
                      <label className="block text-sm font-semibold mb-2 ml-1" style={{ color: 'var(--on-surface-2)' }}>{item.label}</label>
                      <input type="number" value={item.val} onChange={ev => item.set(Number(ev.target.value))} />
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* Navigation Buttons */}
          <div className="mt-12 flex items-center justify-between pt-8" style={{ borderTopColor: 'var(--border)', borderTopWidth: '1px' }}>
            {step > 1 ? (
              <button
                type="button"
                onClick={prevStep}
                className="px-8 py-3 rounded-2xl font-bold transition-all flex items-center gap-2 hover:opacity-70"
                style={{ color: 'var(--on-surface-2)' }}
              >
                <ChevronLeft size={20} />
                Geri
              </button>
            ) : <div />}

            {step < 5 ? (
              <button
                type="button"
                onClick={nextStep}
                className="primary px-10 py-4 text-lg hover:scale-105 active:scale-95 transition-all"
              >
                Devam Et
              </button>
            ) : (
              <button
                type="button"
                onClick={savePlace}
                className="px-10 py-4 text-lg font-bold text-white rounded-2xl flex items-center gap-2 hover:scale-105 active:scale-95 transition-all"
                style={{ background: 'var(--success-600)' }}
              >
                <Rocket size={20} />
                İlanı Yayınla
              </button>
            )}
          </div>

        </form>
      </div>
    </div>
  );
}