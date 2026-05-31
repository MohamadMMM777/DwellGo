const prisma = require('../prismaClient');
const { nextShortId } = require('../utils/shortId');

// ── Shared helpers ────────────────────────────────────────────────────────────

const fullInclude = {
    location: true,
    pricing: true,
    capacity: true,
    photos: true,
    amenities: { include: { amenity: true } }
};

const mapPlaceData = (p) => {
    if (!p) return null;
    return {
        ...p,
        _id: p.id,
        owner: p.ownerId,
        photos: p.photos?.map(ph => ph?.url).filter(Boolean) || [],
        perks: p.amenities?.map(pa => pa?.amenity?.name).filter(Boolean) || [],
        city: p.location?.city || '',
        district: p.location?.district || '',
        neighborhood: p.location?.neighborhood || '',
        street: p.location?.street || '',
        address: p.location?.address || '',
        lat: p.location?.latitude || 0,
        lng: p.location?.longitude || 0,
        price: p.pricing?.basePrice || 0,
        cleaningFee: p.pricing?.cleaningFee || 0,
        serviceFee: p.pricing?.serviceFee || 0,
        securityDeposit: p.pricing?.securityDeposit || 0,
        maxGuests: p.capacity?.maxGuests || 1,
        bedrooms: p.capacity?.bedrooms || 1,
        beds: p.capacity?.beds || 1,
        bathrooms: p.capacity?.bathrooms || 1
    };
};

const getHour = (str) => {
    if (str === null || str === undefined || str === '') return null;
    const match = String(str).match(/^(\d+)/);
    return match ? parseInt(match[1], 10) : null;
};

// ── getAllPlaces (public) ─────────────────────────────────────────────────────
// Only returns PUBLISHED places owned by non-banned users.

const getAllPlaces = async (req, res) => {
    try {
        const { city, district, neighborhood, street, minPrice, maxPrice, propertyType, minGuests } = req.query;

        const where = {
            status: 'PUBLISHED',       // NEVER expose DRAFT or UNLISTED
            owner: { isBanned: false } // hide places from banned hosts
        };

        if (propertyType) where.propertyType = propertyType;

        if (city || district || neighborhood || street) {
            where.location = {};
            if (city) where.location.city = { contains: city };
            if (district) where.location.district = { contains: district };
            if (neighborhood) where.location.neighborhood = { contains: neighborhood };
            if (street) where.location.street = { contains: street };
        }

        if (minPrice || maxPrice) {
            where.pricing = {};
            if (minPrice) where.pricing.basePrice = { gte: Number(minPrice) };
            if (maxPrice) {
                where.pricing.basePrice = {
                    ...(where.pricing.basePrice || {}),
                    lte: Number(maxPrice)
                };
            }
        }

        if (minGuests) {
            where.capacity = { maxGuests: { gte: Number(minGuests) } };
        }

        const places = await prisma.place.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            include: fullInclude
        });

        res.json(places.map(mapPlaceData));
    } catch (err) {
        console.error('getAllPlaces error:', err);
        res.status(500).json({ error: 'Failed to fetch places' });
    }
};

// ── getPlaceById (public) ─────────────────────────────────────────────────────

const getPlaceById = async (req, res) => {
    try {
        const place = await prisma.place.findUnique({
            where: { id: req.params.id },
            include: {
                ...fullInclude,
                owner: {
                    select: {
                        id: true,
                        isHost: true,
                        hostSince: true,
                        profile: { select: { name: true, bio: true, avatarUrl: true } }
                    }
                }
            }
        });
        if (!place) return res.status(404).json({ error: 'Place not found' });

        // Allow owner or admin to see their own non-published places
        if (place.status !== 'PUBLISHED') {
            const isOwnerOrAdmin =
                req.user && (req.user.id === place.ownerId || req.user.role === 'ADMIN');
            if (!isOwnerOrAdmin) {
                return res.status(404).json({ error: 'Place not found' });
            }
        }

        const mapped = mapPlaceData(place);
        mapped.ownerName = place.owner?.profile?.name || 'DwellGo Host';
        mapped.ownerBio = place.owner?.profile?.bio || '';
        mapped.ownerAvatar = place.owner?.profile?.avatarUrl || '';
        res.json(mapped);
    } catch (err) {
        console.error('getPlaceById error:', err);
        res.status(500).json({ error: 'Failed to get place' });
    }
};

// ── createPlace (auth + not admin) ───────────────────────────────────────────

const createPlace = async (req, res) => {
    try {
        const userDoc = req.user;

        // Admin is NEVER allowed to create a listing
        if (userDoc.role === 'ADMIN') {
            return res.status(403).json({ error: 'Admins cannot create listings' });
        }

        const {
            title, propertyType, city, district, neighborhood, street, address,
            addedPhotos, description, perks, extraInfo, checkIn, checkOut, price,
            latitude, longitude, maxGuests, bedrooms, beds, bathrooms,
            cleaningFee, serviceFee, securityDeposit
        } = req.body;

        // Basic validation
        if (!title || title.trim().length < 3) {
            return res.status(400).json({ error: 'Title must be at least 3 characters' });
        }
        if (!city || city.trim().length === 0) {
            return res.status(400).json({ error: 'City is required' });
        }
        if (!price || Number(price) <= 0) {
            return res.status(400).json({ error: 'Price must be greater than 0' });
        }
        if (!addedPhotos || addedPhotos.length === 0) {
            return res.status(400).json({ error: 'At least one photo is required' });
        }

        const photosData = addedPhotos.map((url, idx) => ({ url, isMain: idx === 0 }));
        const amenitiesData = (perks || []).map(perk => ({
            amenity: {
                connectOrCreate: {
                    where: { name: perk },
                    create: { name: perk, icon: '' }
                }
            }
        }));

        // Ensure owner has isHost=true (failsafe in case become-host was skipped)
        if (!userDoc.isHost) {
            await prisma.user.update({
                where: { id: userDoc.id },
                data: { isHost: true, hostSince: new Date() }
            });
        }

        const shortId = await nextShortId('place');
        const placeDoc = await prisma.place.create({
            data: {
                ownerId: userDoc.id,
                shortId,
                title: title.trim(),
                propertyType: propertyType || 'apartment',
                description: description || '',
                status: 'PUBLISHED',
                extraInfo: extraInfo || '',
                checkIn: getHour(checkIn),
                checkOut: getHour(checkOut),
                location: {
                    create: {
                        city: city.trim(),
                        district: district || '',
                        neighborhood: neighborhood || '',
                        street: street || '',
                        address: address || '',
                        latitude: Number(latitude) || 0,
                        longitude: Number(longitude) || 0
                    }
                },
                pricing: {
                    create: {
                        basePrice: Number(price) || 0,
                        cleaningFee: Number(cleaningFee) || 0,
                        serviceFee: Number(serviceFee) || 0,
                        securityDeposit: Number(securityDeposit) || 0
                    }
                },
                capacity: {
                    create: {
                        maxGuests: Math.max(1, Number(maxGuests) || 1),
                        bedrooms: Math.max(0, Number(bedrooms) || 1),
                        beds: Math.max(1, Number(beds) || 1),
                        bathrooms: Math.max(1, Number(bathrooms) || 1)
                    }
                },
                photos: { create: photosData },
                amenities: { create: amenitiesData }
            },
            include: fullInclude
        });

        res.status(201).json(mapPlaceData(placeDoc));
    } catch (err) {
        console.error('createPlace error:', err);
        res.status(500).json({ error: 'Failed to create listing. Please try again.' });
    }
};

// ── getUserPlaces (auth required) ─────────────────────────────────────────────

const getUserPlaces = async (req, res) => {
    try {
        const places = await prisma.place.findMany({
            where: { ownerId: req.user.id },
            orderBy: { createdAt: 'desc' },
            include: fullInclude
        });
        res.json(places.map(mapPlaceData));
    } catch (err) {
        console.error('getUserPlaces error:', err);
        res.status(500).json({ error: 'Failed to fetch your listings' });
    }
};

// ── updatePlace (auth + owner only) ──────────────────────────────────────────

const updatePlace = async (req, res) => {
    try {
        const userDoc = req.user;
        const {
            id, title, propertyType, city, district, neighborhood, street, address,
            addedPhotos, description, perks, extraInfo, checkIn, checkOut, price,
            latitude, longitude, maxGuests, bedrooms, beds, bathrooms,
            cleaningFee, serviceFee, securityDeposit
        } = req.body;

        if (!id) return res.status(400).json({ error: 'Place ID is required' });

        const placeDoc = await prisma.place.findUnique({ where: { id } });
        if (!placeDoc) return res.status(404).json({ error: 'Place not found' });

        // Only the owner can update their own place (admin edit blocked intentionally)
        if (userDoc.id !== placeDoc.ownerId) {
            return res.status(403).json({ error: 'You can only edit your own listings' });
        }

        // Re-create photos and amenities for simplicity
        await prisma.placePhoto.deleteMany({ where: { placeId: id } });
        await prisma.placeAmenity.deleteMany({ where: { placeId: id } });

        const photosData = (addedPhotos || []).map((url, idx) => ({ url, isMain: idx === 0 }));
        const amenitiesData = (perks || []).map(perk => ({
            amenity: {
                connectOrCreate: {
                    where: { name: perk },
                    create: { name: perk, icon: '' }
                }
            }
        }));

        const updated = await prisma.place.update({
            where: { id },
            data: {
                title: title?.trim(),
                propertyType,
                description,
                extraInfo,
                checkIn: getHour(checkIn),
                checkOut: getHour(checkOut),
                location: {
                    upsert: {
                        create: { city, district, neighborhood, street, address, latitude: Number(latitude) || 0, longitude: Number(longitude) || 0 },
                        update: { city, district, neighborhood, street, address, latitude: Number(latitude) || 0, longitude: Number(longitude) || 0 }
                    }
                },
                pricing: {
                    upsert: {
                        create: { basePrice: Number(price) || 0, cleaningFee: Number(cleaningFee) || 0, serviceFee: Number(serviceFee) || 0, securityDeposit: Number(securityDeposit) || 0 },
                        update: { basePrice: Number(price) || 0, cleaningFee: Number(cleaningFee) || 0, serviceFee: Number(serviceFee) || 0, securityDeposit: Number(securityDeposit) || 0 }
                    }
                },
                capacity: {
                    upsert: {
                        create: { maxGuests: Math.max(1, Number(maxGuests) || 1), bedrooms: Math.max(0, Number(bedrooms) || 1), beds: Math.max(1, Number(beds) || 1), bathrooms: Math.max(1, Number(bathrooms) || 1) },
                        update: { maxGuests: Math.max(1, Number(maxGuests) || 1), bedrooms: Math.max(0, Number(bedrooms) || 1), beds: Math.max(1, Number(beds) || 1), bathrooms: Math.max(1, Number(bathrooms) || 1) }
                    }
                },
                photos: { create: photosData },
                amenities: { create: amenitiesData }
            },
            include: fullInclude
        });

        res.json(mapPlaceData(updated));
    } catch (err) {
        console.error('updatePlace error:', err);
        res.status(500).json({ error: 'Failed to update listing' });
    }
};

// ── deletePlace (auth + owner OR admin) ──────────────────────────────────────

const deletePlace = async (req, res) => {
    try {
        const userDoc = req.user;
        const placeDoc = await prisma.place.findUnique({ where: { id: req.params.id } });
        if (!placeDoc) return res.status(404).json({ error: 'Place not found' });

        if (placeDoc.ownerId !== userDoc.id && userDoc.role !== 'ADMIN') {
            return res.status(403).json({ error: 'Not permitted' });
        }

        // Block deletion if there are active bookings
        const activeBookings = await prisma.booking.count({
            where: {
                placeId: req.params.id,
                status: { in: ['PENDING', 'APPROVED', 'CONFIRMED'] }
            }
        });
        if (activeBookings > 0) {
            return res.status(409).json({
                error: `Bu ilanda ${activeBookings} aktif rezervasyon var. Silmeden önce tüm aktif rezervasyonları iptal edin.`
            });
        }

        // Prisma's onDelete: Cascade handles all related records automatically
        await prisma.place.delete({ where: { id: req.params.id } });
        res.json({ message: 'Listing deleted successfully' });
    } catch (err) {
        console.error('deletePlace error:', err);
        res.status(500).json({ error: 'Failed to delete listing' });
    }
};

module.exports = { createPlace, getUserPlaces, getPlaceById, updatePlace, deletePlace, getAllPlaces };
