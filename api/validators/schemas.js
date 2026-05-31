const { z } = require('zod');

// SECURITY: role field removed — users cannot self-assign roles on registration.
const registerSchema = z.object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Invalid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
});

const loginSchema = z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(1, 'Password is required'),
});

const placeSchema = z.object({
    id: z.string().optional(),
    title: z.string().min(3, 'Title must be at least 3 characters').optional(),
    propertyType: z.string().optional(),
    city: z.string().optional(),
    district: z.string().optional(),
    neighborhood: z.string().optional(),
    street: z.string().optional(),
    address: z.string().optional(),
    latitude: z.coerce.number().optional(),
    longitude: z.coerce.number().optional(),
    addedPhotos: z.array(z.string()).optional(),
    description: z.string().optional(),
    perks: z.array(z.string()).optional(),
    extraInfo: z.string().optional(),
    checkIn: z.any().optional(),
    checkOut: z.any().optional(),
    price: z.coerce.number().min(0).optional(),
    cleaningFee: z.coerce.number().min(0).optional(),
    serviceFee: z.coerce.number().min(0).optional(),
    securityDeposit: z.coerce.number().min(0).optional(),
    maxGuests: z.coerce.number().int().min(1).optional(),
    bedrooms: z.coerce.number().int().min(0).optional(),
    beds: z.coerce.number().int().min(1).optional(),
    bathrooms: z.coerce.number().int().min(1).optional(),
});

const validate = (schema) => (req, res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
        const issues = result.error?.issues || [];
        return res.status(400).json({
            error: issues.map(i => i.message).join(', '),
            details: issues,
        });
    }
    req.body = result.data;
    next();
};

module.exports = { validate, registerSchema, loginSchema, placeSchema };
