const prisma = require('../prismaClient');

const toggleWishlist = async (req, res) => {
    try {
        const userId = req.user.id;
        const { placeId } = req.body;

        const existing = await prisma.wishlist.findUnique({
            where: { userId_placeId: { userId, placeId } }
        });

        if (existing) {
            await prisma.wishlist.delete({
                where: { userId_placeId: { userId, placeId } }
            });
            return res.json({ status: 'removed' });
        } else {
            await prisma.wishlist.create({
                data: { userId, placeId }
            });
            return res.json({ status: 'added' });
        }
    } catch (err) {
        console.error(err);
        res.status(500).json('Wishlist operation failed');
    }
};

const getWishlist = async (req, res) => {
    try {
        const userId = req.user.id;
        const wishlisted = await prisma.wishlist.findMany({
            where: { userId },
            include: {
                place: {
                    include: {
                        location: true,
                        pricing: true,
                        photos: true
                    }
                }
            }
        });

        // Map data to match frontend expectations
        const mappedPlaces = wishlisted.map(w => {
            const p = w.place;
            return {
                ...p,
                _id: p.id,
                photos: p.photos.map(ph => ph.url),
                city: p.location?.city || '',
                district: p.location?.district || '',
                price: p.pricing?.basePrice || 0,
            };
        });

        res.json(mappedPlaces);
    } catch (err) {
        console.error(err);
        res.status(500).json('Failed to fetch wishlist');
    }
};

module.exports = { toggleWishlist, getWishlist };
