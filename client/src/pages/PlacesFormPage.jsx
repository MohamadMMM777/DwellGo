import PhotosUploader from '../components/PhotosUploader.jsx';
import Perks from '../components/Perks.jsx';
import LocationSelector from '../components/LocationSelector.jsx';
import Map from '../components/Map.jsx';
import { useEffect, useState } from "react";
import axios from "axios";
import { Navigate, useParams, Link } from "react-router-dom";
import toast from "react-hot-toast";
import { ArrowLeft, ChevronLeft, Rocket, Users, Bed, Bath, Building2, Sofa, Building, Home, Castle, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const PROPERTY_TYPES = [
  { value: 'apartment', label: 'Daire',   Icon: Building2 },
  { value: 'house',     label: 'Ev',      Icon: Home      },
  { value: 'villa',     label: 'Villa',   Icon: Castle    },
  { value: 'studio',   label: 'Stüdyo',  Icon: Sofa      },
  { value: 'building', label: 'Bina',    Icon: Building  },
];

const STEP_LABELS = ['Temel Bilgiler', 'Konum', 'Görseller', 'Kapasite', 'Fiyatlandırma'];

// ─── Per-step validation rules ───────────────────────────────────────────────
function validateStep(step, state) {
  const { title, description, city, district, neighborhood, addedPhotos, price } = state;

  if (step === 1) {
    if (!title.trim())
      return 'İlan başlığı zorunludur.';
    if (title.trim().length < 5)
      return 'İlan başlığı en az 5 karakter olmalıdır.';
    if (!description.trim())
      return 'Açıklama zorunludur.';
    if (description.trim().length < 20)
      return 'Açıklama en az 20 karakter olmalıdır.';
    return null;
  }

  if (step === 2) {
    if (!city)
      return 'Lütfen bir il seçiniz.';
    if (!district)
      return 'Lütfen bir ilçe seçiniz.';
    if (!neighborhood)
      return 'Lütfen bir mahalle seçiniz.';
    return null;
  }

  if (step === 3) {
    if (!addedPhotos || addedPhotos.length === 0)
      return 'En az 1 fotoğraf yüklemeniz gerekmektedir.';
    return null;
  }

  if (step === 4) {
    // capacity validation handled by min in inputs — no extra check needed
    return null;
  }

  if (step === 5) {
    if (!price || Number(price) < 1)
      return 'Gecelik fiyat en az ₺1 olmalıdır.';
    return null;
  }

  return null;
}

// ─── Counter widget (replaces number input for capacity) ─────────────────────
function Counter({ label, value, onChange, Icon, min = 1 }) {
  function decrement() {
    if (value > min) onChange(value - 1);
  }
  function increment() {
    onChange(value + 1);
  }
  return (
    <div className="flex flex-col items-center gap-2 p-4 rounded-2xl border" style={{ borderColor: 'var(--border)', background: 'var(--surface-2)' }}>
      <label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--on-surface-2)' }}>
        <Icon size={14} />
        {label}
      </label>
      <div className="flex items-center gap-3 mt-1">
        <button
          type="button"
          onClick={decrement}
          disabled={value <= min}
          className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-lg border transition-all"
          style={{
            borderColor: value <= min ? 'var(--border)' : 'var(--primary-600)',
            color: value <= min ? 'var(--on-surface-2)' : 'var(--primary-600)',
            opacity: value <= min ? 0.4 : 1,
            cursor: value <= min ? 'not-allowed' : 'pointer',
          }}
        >−</button>
        <span className="text-2xl font-black w-8 text-center" style={{ color: 'var(--on-surface)' }}>{value}</span>
        <button
          type="button"
          onClick={increment}
          className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-lg border transition-all"
          style={{ borderColor: 'var(--primary-600)', color: 'var(--primary-600)' }}
        >+</button>
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function PlacesFormPage() {
  const { id } = useParams();
  const [step, setStep]         = useState(1);
  const [direction, setDirection] = useState(1); // 1 = forward, -1 = backward

  // Step 1
  const [title, setTitle]               = useState('');
  const [propertyType, setPropertyType] = useState('apartment');
  const [description, setDescription]   = useState('');

  // Step 2
  const [city, setCity]               = useState('');
  const [district, setDistrict]       = useState('');
  const [neighborhood, setNeighborhood] = useState('');
  const [street, setStreet]           = useState('');
  const [lat, setLat]                 = useState(39.9334);
  const [lng, setLng]                 = useState(32.8597);

  // Step 3
  const [addedPhotos, setAddedPhotos] = useState([]);
  const [perks, setPerks]             = useState([]);

  // Step 4
  const [maxGuests, setMaxGuests]   = useState(2);
  const [bedrooms, setBedrooms]     = useState(1);
  const [beds, setBeds]             = useState(1);
  const [bathrooms, setBathrooms]   = useState(1);
  const [extraInfo, setExtraInfo]   = useState('');

  // Step 5
  const [price, setPrice]                   = useState(500);
  const [cleaningFee, setCleaningFee]       = useState(0);
  const [serviceFee, setServiceFee]         = useState(0);
  const [securityDeposit, setSecurityDeposit] = useState(0);

  const [redirect, setRedirect] = useState(false);
  const [saving, setSaving]     = useState(false);

  // ─── Load existing place for edit ─────────────────────────────────────────
  useEffect(() => {
    if (!id || id === 'new') return;
    axios.get('/places/' + id)
      .then(({ data }) => {
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
        setPrice(data.price || 500);
        if (data.capacity) {
          setMaxGuests(data.capacity.maxGuests || 1);
          setBedrooms(data.capacity.bedrooms || 1);
          setBeds(data.capacity.beds || 1);
          setBathrooms(data.capacity.bathrooms || 1);
        }
        if (data.pricing) {
          setCleaningFee(data.pricing.cleaningFee || 0);
          setServiceFee(data.pricing.serviceFee || 0);
          setSecurityDeposit(data.pricing.securityDeposit || 0);
        }
        if (data.location) {
          setLat(data.location.latitude);
          setLng(data.location.longitude);
        }
      })
      .catch(() => toast.error('İlan bilgileri yüklenemedi. Lütfen sayfayı yenileyin.'));
  }, [id]);

  // ─── Step navigation ───────────────────────────────────────────────────────
  const stateSnapshot = { title, description, city, district, neighborhood, addedPhotos, price };

  function goNext() {
    const error = validateStep(step, stateSnapshot);
    if (error) {
      toast.error(error, { icon: '⚠️', duration: 4000 });
      return;
    }
    setDirection(1);
    setStep(prev => prev + 1);
    window.scrollTo(0, 0);
  }

  function goPrev() {
    setDirection(-1);
    setStep(prev => prev - 1);
    window.scrollTo(0, 0);
  }

  // ─── Save ──────────────────────────────────────────────────────────────────
  async function savePlace() {
    const error = validateStep(5, stateSnapshot);
    if (error) {
      toast.error(error, { icon: '⚠️', duration: 4000 });
      return;
    }

    setSaving(true);
    const address = [neighborhood, district, city].filter(Boolean).join(', ');
    const placeData = {
      title, propertyType, city, district, neighborhood, street, address,
      addedPhotos, description, perks, extraInfo, price,
      latitude: lat, longitude: lng,
      maxGuests, bedrooms, beds, bathrooms,
      cleaningFee, serviceFee, securityDeposit,
    };

    try {
      if (id) {
        await axios.put('/places', { id, ...placeData });
        toast.success('İlan başarıyla güncellendi! ✅', { duration: 4000 });
      } else {
        await axios.post('/places', placeData);
        toast.success('İlanınız başarıyla yayınlandı! 🎉', { duration: 4000 });
      }
      setRedirect(true);
    } catch (err) {
      const msg = err.response?.data?.error || err.response?.data || err.message || 'Bilinmeyen hata oluştu';
      toast.error('Kayıt başarısız: ' + msg, { icon: '❌', duration: 5000 });
    } finally {
      setSaving(false);
    }
  }

  if (redirect) return <Navigate to={'/account/places'} />;

  // ─── Progress Bar ──────────────────────────────────────────────────────────
  function ProgressBar() {
    return (
      <div className="mb-10">
        <div className="flex items-center justify-between max-w-xl mx-auto px-2">
          {[1, 2, 3, 4, 5].map((s) => (
            <div key={s} className="flex items-center flex-1 last:flex-none">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all duration-300 border-2 text-sm"
                style={{
                  background:   step > s ? 'var(--primary-600)' : step === s ? 'var(--primary-600)' : 'var(--surface)',
                  borderColor:  step >= s ? 'var(--primary-600)' : 'var(--border)',
                  color:        step >= s ? 'white' : 'var(--on-surface-2)',
                  boxShadow:    step === s ? '0 0 0 4px rgba(37,99,235,0.15)' : 'none',
                }}
              >
                {step > s ? '✓' : s}
              </div>
              {s < 5 && (
                <div className="h-1 flex-1 mx-2 rounded-full transition-all duration-500" style={{
                  background: step > s ? 'var(--primary-600)' : 'var(--border)'
                }} />
              )}
            </div>
          ))}
        </div>
        <p className="text-center mt-3 text-sm font-semibold" style={{ color: 'var(--primary-600)' }}>
          {STEP_LABELS[step - 1]}
        </p>
      </div>
    );
  }

  // ─── Step header ──────────────────────────────────────────────────────────
  function StepHeader({ title: h, sub }) {
    return (
      <div className="mb-6">
        <h2 className="font-heading font-bold text-2xl" style={{ color: 'var(--on-surface)' }}>{h}</h2>
        {sub && <p className="text-sm mt-1" style={{ color: 'var(--on-surface-2)' }}>{sub}</p>}
      </div>
    );
  }

  // ─── Slide animation variants ─────────────────────────────────────────────
  const slideVariants = {
    enter:  (dir) => ({ opacity: 0, x: dir > 0 ? 40 : -40 }),
    center: { opacity: 1, x: 0 },
    exit:   (dir) => ({ opacity: 0, x: dir > 0 ? -40 : 40 }),
  };

  // ─── Render ────────────────────────────────────────────────────────────────
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

        <form onSubmit={e => e.preventDefault()}>
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={step}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.25, ease: 'easeInOut' }}
            >

              {/* ── Step 1: Basics ─────────────────────────────────────── */}
              {step === 1 && (
                <div className="space-y-6">
                  <StepHeader h="Temel Bilgiler" sub="İlanınız hakkında genel bir fikir verin" />

                  <div>
                    <label className="block text-sm font-semibold mb-2 ml-1" style={{ color: 'var(--on-surface)' }}>
                      İlan Başlığı <span style={{ color: 'red' }}>*</span>
                    </label>
                    <input
                      type="text"
                      value={title}
                      onChange={e => setTitle(e.target.value)}
                      placeholder="Örn: Boğaz Manzaralı Lüks Daire"
                      className="text-lg py-3"
                    />
                    {title.trim().length > 0 && title.trim().length < 5 && (
                      <p className="text-xs mt-1 flex items-center gap-1" style={{ color: 'var(--error)' }}>
                        <AlertCircle size={12} /> En az 5 karakter giriniz.
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold mb-3 ml-1" style={{ color: 'var(--on-surface)' }}>
                      Mülk Tipi
                    </label>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                      {PROPERTY_TYPES.map(pt => {
                        const Icon = pt.Icon;
                        const selected = propertyType === pt.value;
                        return (
                          <div
                            key={pt.value}
                            onClick={() => setPropertyType(pt.value)}
                            className="cursor-pointer border-2 rounded-2xl p-4 text-center transition-all duration-200 hover:scale-105 select-none"
                            style={{
                              borderColor: selected ? 'var(--primary-600)' : 'var(--border)',
                              background:  selected ? 'var(--primary-50)'  : 'var(--surface-2)',
                              color:       selected ? 'var(--primary-600)' : 'var(--on-surface-2)',
                            }}
                          >
                            <div className="flex justify-center mb-1">
                              <Icon size={28} />
                            </div>
                            <span className="text-xs font-bold uppercase tracking-wider">{pt.label}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold mb-2 ml-1" style={{ color: 'var(--on-surface)' }}>
                      Açıklama <span style={{ color: 'red' }}>*</span>
                    </label>
                    <textarea
                      value={description}
                      onChange={e => setDescription(e.target.value)}
                      placeholder="Evinizin öne çıkan özelliklerinden bahsedin... (en az 20 karakter)"
                      className="min-h-[150px]"
                    />
                    {description.trim().length > 0 && description.trim().length < 20 && (
                      <p className="text-xs mt-1 flex items-center gap-1" style={{ color: 'var(--error)' }}>
                        <AlertCircle size={12} /> En az 20 karakter giriniz.
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* ── Step 2: Location ───────────────────────────────────── */}
              {step === 2 && (
                <div className="space-y-6">
                  <StepHeader h="Konum Belirleme" sub="Misafirlerin sizi bulmasını sağlayın" />
                  <LocationSelector
                    city={city} district={district} neighborhood={neighborhood} street={street}
                    onChange={({ city: c, district: d, neighborhood: n, street: s }) => {
                      setCity(c); setDistrict(d); setNeighborhood(n); setStreet(s);
                    }}
                  />
                  <div className="mt-4">
                    <label className="block text-sm font-semibold mb-2 ml-1" style={{ color: 'var(--on-surface)' }}>
                      Haritada İşaretleyin
                    </label>
                    <Map
                      position={{ lat, lng }}
                      setPosition={p => { setLat(p.lat); setLng(p.lng); }}
                      isEditable={true}
                    />
                    <p className="text-xs mt-2 italic" style={{ color: 'var(--on-surface-2)' }}>
                      Daha kesin konum için haritaya tıklayabilirsiniz.
                    </p>
                  </div>
                </div>
              )}

              {/* ── Step 3: Photos & Perks ─────────────────────────────── */}
              {step === 3 && (
                <div className="space-y-8">
                  <StepHeader h="Görseller & Olanaklar" sub="Kaliteli fotoğraflar daha fazla misafir çeker" />
                  <div>
                    <label className="block text-sm font-semibold mb-3 ml-1" style={{ color: 'var(--on-surface)' }}>
                      Fotoğraflar <span style={{ color: 'red' }}>*</span>
                    </label>
                    <PhotosUploader addedPhotos={addedPhotos} onChange={setAddedPhotos} />
                    {addedPhotos.length === 0 && (
                      <p className="text-xs mt-2 flex items-center gap-1" style={{ color: 'var(--on-surface-2)' }}>
                        <AlertCircle size={12} /> En az 1 fotoğraf yüklemeniz gerekmektedir.
                      </p>
                    )}
                  </div>
                  <div className="pt-8" style={{ borderTopColor: 'var(--border)', borderTopWidth: '1px' }}>
                    <label className="block text-sm font-semibold mb-4 ml-1" style={{ color: 'var(--on-surface)' }}>
                      Sunulan Olanaklar
                    </label>
                    <Perks selected={perks} onChange={setPerks} />
                  </div>
                </div>
              )}

              {/* ── Step 4: Capacity & Rules ───────────────────────────── */}
              {step === 4 && (
                <div className="grid gap-8">
                  <StepHeader h="Kapasite & Kurallar" sub="Sınırları ve ev kurallarını belirleyin" />

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Counter label="Max Misafir"  value={maxGuests}  onChange={setMaxGuests}  Icon={Users} min={1} />
                    <Counter label="Yatak Odası"  value={bedrooms}   onChange={setBedrooms}   Icon={Bed}   min={1} />
                    <Counter label="Yatak Sayısı" value={beds}       onChange={setBeds}       Icon={Bed}   min={1} />
                    <Counter label="Banyo Sayısı" value={bathrooms}  onChange={setBathrooms}  Icon={Bath}  min={1} />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold mb-2 ml-1" style={{ color: 'var(--on-surface)' }}>
                      Ek Bilgiler & Ev Kuralları
                    </label>
                    <textarea
                      value={extraInfo}
                      onChange={e => setExtraInfo(e.target.value)}
                      placeholder="Evcil hayvan politikası, sigara kullanımı, sessiz saatler vb..."
                    />
                  </div>
                </div>
              )}

              {/* ── Step 5: Pricing ────────────────────────────────────── */}
              {step === 5 && (
                <div className="grid gap-8">
                  <StepHeader h="Finansal Detaylar" sub="Kazancınızı planlayın" />

                  <div className="p-6 rounded-3xl border" style={{
                    background: 'var(--primary-50)',
                    borderColor: 'var(--primary-600)',
                  }}>
                    <label className="block font-bold mb-3" style={{ color: 'var(--primary-600)' }}>
                      Gecelik Temel Fiyat (₺) <span style={{ color: 'red' }}>*</span>
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={price}
                      onChange={e => setPrice(Math.max(1, Number(e.target.value)))}
                      className="text-3xl font-black w-full rounded-lg p-3"
                      style={{ color: 'var(--primary-600)' }}
                    />
                    {Number(price) < 1 && (
                      <p className="text-xs mt-2 flex items-center gap-1" style={{ color: 'var(--error)' }}>
                        <AlertCircle size={12} /> Gecelik fiyat en az ₺1 olmalıdır.
                      </p>
                    )}
                  </div>

                  <div className="grid md:grid-cols-3 gap-6">
                    {[
                      { label: 'Temizlik Ücreti (₺)',  val: cleaningFee,    set: setCleaningFee    },
                      { label: 'Hizmet Bedeli (₺)',    val: serviceFee,     set: setServiceFee     },
                      { label: 'Depozito (₺)',         val: securityDeposit, set: setSecurityDeposit },
                    ].map(item => (
                      <div key={item.label}>
                        <label className="block text-sm font-semibold mb-2 ml-1" style={{ color: 'var(--on-surface-2)' }}>
                          {item.label}
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={item.val}
                          onChange={e => item.set(Math.max(0, Number(e.target.value)))}
                        />
                      </div>
                    ))}
                  </div>

                  {/* Summary card */}
                  <div className="p-5 rounded-2xl" style={{ background: 'var(--surface-2)', borderColor: 'var(--border)', border: '1px solid var(--border)' }}>
                    <p className="font-bold mb-3" style={{ color: 'var(--on-surface)' }}>Misafirin Göreceği Özet</p>
                    <div className="space-y-2 text-sm" style={{ color: 'var(--on-surface-2)' }}>
                      <div className="flex justify-between">
                        <span>Gecelik fiyat</span>
                        <span className="font-semibold">₺{price}</span>
                      </div>
                      {cleaningFee > 0 && (
                        <div className="flex justify-between">
                          <span>Temizlik ücreti</span>
                          <span>₺{cleaningFee}</span>
                        </div>
                      )}
                      {serviceFee > 0 && (
                        <div className="flex justify-between">
                          <span>Hizmet bedeli</span>
                          <span>₺{serviceFee}</span>
                        </div>
                      )}
                      {securityDeposit > 0 && (
                        <div className="flex justify-between">
                          <span>Depozito</span>
                          <span>₺{securityDeposit}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

            </motion.div>
          </AnimatePresence>

          {/* ── Navigation Buttons ──────────────────────────────────────── */}
          <div className="mt-12 flex items-center justify-between pt-8" style={{ borderTopColor: 'var(--border)', borderTopWidth: '1px' }}>
            {step > 1 ? (
              <button
                type="button"
                onClick={goPrev}
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
                onClick={goNext}
                className="primary px-10 py-4 text-lg hover:scale-105 active:scale-95 transition-all"
              >
                Devam Et →
              </button>
            ) : (
              <button
                type="button"
                onClick={savePlace}
                disabled={saving}
                className="px-10 py-4 text-lg font-bold text-white rounded-2xl flex items-center gap-2 hover:scale-105 active:scale-95 transition-all"
                style={{ background: saving ? 'var(--border)' : 'var(--success-600)', cursor: saving ? 'not-allowed' : 'pointer' }}
              >
                {saving ? (
                  <>
                    <span className="animate-spin inline-block w-5 h-5 border-2 border-white border-t-transparent rounded-full" />
                    Yayınlanıyor...
                  </>
                ) : (
                  <>
                    <Rocket size={20} />
                    {id ? 'İlanı Güncelle' : 'İlanı Yayınla'}
                  </>
                )}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}