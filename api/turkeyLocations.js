const { getCities, getDistrictsByCityCode, getNeighbourhoodsByCityCodeAndDistrict } = require('turkey-neighbourhoods');

const turkeyLocations = {};

// Build the complete hierarchy for all 81 cities
for (const city of getCities()) {
    const cityName = city.name;
    turkeyLocations[cityName] = {};
    const districts = getDistrictsByCityCode(city.code);
    for (const district of districts) {
        turkeyLocations[cityName][district] = getNeighbourhoodsByCityCodeAndDistrict(city.code, district);
    }
}

module.exports = turkeyLocations;
