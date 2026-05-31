import { createContext, useContext, useState } from 'react';

export const SearchContext = createContext({});

export function SearchProvider({ children }) {
    const [filterCity,         setFilterCity]         = useState('');
    const [filterDistrict,     setFilterDistrict]     = useState('');
    const [filterNeighborhood, setFilterNeighborhood] = useState('');
    const [filterTypes,        setFilterTypes]        = useState([]); // multi-select array
    const [filterMinPrice,     setFilterMinPrice]     = useState(0);
    const [filterMaxPrice,     setFilterMaxPrice]     = useState(0); // 0 = no limit
    const [sortBy,             setSortBy]             = useState('newest');
    const [drawerOpen,         setDrawerOpen]         = useState(false);

    function clearFilters() {
        setFilterCity('');
        setFilterDistrict('');
        setFilterNeighborhood('');
        setFilterTypes([]);
        setFilterMinPrice(0);
        setFilterMaxPrice(0);
        setSortBy('newest');
    }

    const activeCount =
        (filterCity         ? 1 : 0) +
        (filterDistrict     ? 1 : 0) +
        (filterNeighborhood ? 1 : 0) +
        filterTypes.length +
        (filterMinPrice > 0 || filterMaxPrice > 0 ? 1 : 0) +
        (sortBy !== 'newest' ? 1 : 0);

    return (
        <SearchContext.Provider value={{
            filterCity,         setFilterCity,
            filterDistrict,     setFilterDistrict,
            filterNeighborhood, setFilterNeighborhood,
            filterTypes,        setFilterTypes,
            filterMinPrice,     setFilterMinPrice,
            filterMaxPrice,     setFilterMaxPrice,
            sortBy,             setSortBy,
            drawerOpen,         setDrawerOpen,
            clearFilters,
            activeCount,
        }}>
            {children}
        </SearchContext.Provider>
    );
}

export function useSearch() {
    return useContext(SearchContext);
}
