import { useContext, useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { UserContext } from '../contexts/UserContext.jsx';
import { useSearch } from '../contexts/SearchContext.jsx';
import HeroSection from "../components/HeroSection.jsx";
import PropertyCard from "../components/PropertyCard.jsx";
export default function IndexPage() {
  const { user } = useContext(UserContext);
  const navigate = useNavigate();
  const [places, setPlaces] = useState([]);

  const {
    filterCity, filterDistrict, filterNeighborhood,
    filterTypes, filterMinPrice, filterMaxPrice,
    sortBy, activeCount,
  } = useSearch();

  function handlePlaceClick(placeId) {
    if (!user) navigate('/login');
    else navigate('/place/' + placeId);
  }

  useEffect(() => {
    axios.get('/places').then(res => setPlaces(res.data)).catch(() => { });
  }, []);

  const filtered = places
    .filter(p => {
      const cityMatch         = !filterCity                     || p.city?.toLowerCase().includes(filterCity.toLowerCase());
      const districtMatch     = !filterDistrict                 || p.district?.toLowerCase() === filterDistrict.toLowerCase();
      const neighborhoodMatch = !filterNeighborhood             || p.neighborhood?.toLowerCase() === filterNeighborhood.toLowerCase();
      const typeMatch         = !filterTypes?.length            || filterTypes.includes(p.propertyType);
      const minMatch          = !filterMinPrice                 || (p.price || 0) >= filterMinPrice;
      const maxMatch          = !filterMaxPrice                 || (p.price || 0) <= filterMaxPrice;
      return cityMatch && districtMatch && neighborhoodMatch && typeMatch && minMatch && maxMatch;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'price_asc':   return (a.price || 0) - (b.price || 0);
        case 'price_desc':  return (b.price || 0) - (a.price || 0);
        case 'oldest':      return new Date(a.createdAt) - new Date(b.createdAt);
        case 'rating_desc': return (b.averageRating || 0) - (a.averageRating || 0);
        case 'rating_asc':  return (a.averageRating || 0) - (b.averageRating || 0);
        case 'newest':
        default:            return new Date(b.createdAt) - new Date(a.createdAt);
      }
    });

  const hasFilter = activeCount > 0;

  return (
    <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 pb-12">
      {/* Hero shown only when no filter is active */}
      {!hasFilter && <HeroSection />}

      {/* Filter summary bar */}
      <div className="flex justify-between items-center mb-6">
          <h2 className="font-heading font-bold text-xl" style={{ color: 'var(--on-surface)' }}>
            {activeCount > 0 ? `${filtered.length} Sonuç Bulundu` : 'Tüm İlanlar'}
          </h2>
          <span className="text-xs font-semibold px-3 py-1 rounded-full" style={{ background: 'var(--surface-2)', color: 'var(--on-surface-2)' }}>
            {filtered.length} ilan
          </span>
      </div>

      {/* Results Grid with Animation */}
      <div className="grid gap-x-6 gap-y-10 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 animate-fadeIn">
        {filtered.length > 0 ? filtered.map(place => (
          <PropertyCard
            key={place._id}
            place={place}
            user={user}
            onClick={handlePlaceClick}
          />
        )) : (
          <div className="col-span-full py-24 text-center">
            <div className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center opacity-20" style={{ background: 'var(--surface-2)' }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24" style={{ color: 'var(--on-surface-2)' }}><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 21v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21m0 0h4.5V3.545M12.75 21h7.5V10.75M2.25 21h1.5m18 0h-18M2.25 9l4.5-1.636M18.75 3l-1.5.545m0 6.205 3 1m1.5.5-1.5-.5M6.75 7.364V3h-3v18m3-13.636 10.5-3.819" /></svg>
            </div>
            <h3 className="font-heading font-bold text-xl" style={{ color: 'var(--on-surface)' }}>İlan Bulunamadı</h3>
            <p className="text-sm mt-2" style={{ color: 'var(--on-surface-2)' }}>Bu kategoride veya filtrelerde henüz bir ilan mevcut değil.</p>
          </div>
        )}
      </div>
    </div>
  );
}
