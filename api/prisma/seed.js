/**
 * DwellGo Database Seed — v2
 * Run: cd api && npx prisma db push && node prisma/seed.js
 *
 * Creates:
 *  - 1 Admin
 *  - 2 Hosts (each with 2 listings)
 *  - 2 Guests
 *  - Sample bookings in different statuses
 */

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();
const salt = bcrypt.genSaltSync(10);
const hash = (pw) => bcrypt.hashSync(pw, salt);

async function main() {
    console.log('🌱 Seeding DwellGo database...');

    // ── 0. Reset counters ─────────────────────────────────────────────────────
    await prisma.counter.upsert({ where: { name: 'user' },    update: { value: 0 }, create: { name: 'user',    value: 0 } });
    await prisma.counter.upsert({ where: { name: 'place' },   update: { value: 0 }, create: { name: 'place',   value: 0 } });
    await prisma.counter.upsert({ where: { name: 'booking' }, update: { value: 0 }, create: { name: 'booking', value: 0 } });

    // ── 1. Admin ──────────────────────────────────────────────────────────────
    const admin = await prisma.user.upsert({
        where: { email: 'admin@dwellgo.com' },
        update: { password: hash('DwellGo_Admin_#2024!Complex') },
        create: {
            id: 'U_ADMIN',
            shortId: 1,
            email: 'admin@dwellgo.com',
            password: hash('DwellGo_Admin_#2024!Complex'),
            role: 'ADMIN',
            isHost: false,
            isVerified: true,
            profile: { create: { id: 'PROF_ADMIN', name: 'DwellGo Admin' } }
        }
    });

    // ── 2. Hosts ──────────────────────────────────────────────────────────────
    const host1 = await prisma.user.upsert({
        where: { email: 'host1@dwellgo.com' },
        update: { password: hash('DwellGo_Host1_#2024!Complex') },
        create: {
            id: 'U_HOST1',
            shortId: 2,
            email: 'host1@dwellgo.com',
            password: hash('DwellGo_Host1_#2024!Complex'),
            role: 'USER',
            isHost: true,
            hostSince: new Date(),
            isVerified: true,
            profile: { create: { id: 'PROF_HOST1', name: 'Ahmed Al-Rashid', phone: '+966501234567', bio: 'Professional host with 5 years of experience.' } }
        }
    });

    const host2 = await prisma.user.upsert({
        where: { email: 'host2@dwellgo.com' },
        update: { password: hash('DwellGo_Host2_#2024!Complex') },
        create: {
            id: 'U_HOST2',
            shortId: 3,
            email: 'host2@dwellgo.com',
            password: hash('DwellGo_Host2_#2024!Complex'),
            role: 'USER',
            isHost: true,
            hostSince: new Date(),
            isVerified: true,
            profile: { create: { id: 'PROF_HOST2', name: 'Fatima Al-Zahra', phone: '+966509876543', bio: 'I love welcoming guests to my beautiful properties.' } }
        }
    });

    // ── 3. Guests ─────────────────────────────────────────────────────────────
    const guest1 = await prisma.user.upsert({
        where: { email: 'guest1@dwellgo.com' },
        update: { password: hash('DwellGo_Guest1_#2024!Complex') },
        create: {
            id: 'U_GUEST1',
            shortId: 4,
            email: 'guest1@dwellgo.com',
            password: hash('DwellGo_Guest1_#2024!Complex'),
            role: 'USER',
            isHost: false,
            profile: { create: { id: 'PROF_GUEST1', name: 'Sara Johnson', phone: '+966502222333' } }
        }
    });

    const guest2 = await prisma.user.upsert({
        where: { email: 'guest2@dwellgo.com' },
        update: { password: hash('DwellGo_Guest2_#2024!Complex') },
        create: {
            id: 'U_GUEST2',
            shortId: 5,
            email: 'guest2@dwellgo.com',
            password: hash('DwellGo_Guest2_#2024!Complex'),
            role: 'USER',
            isHost: false,
            profile: { create: { id: 'PROF_GUEST2', name: 'Khalid Mansour', phone: '+966503333444' } }
        }
    });

    // Update counter to reflect seeded users
    await prisma.counter.update({ where: { name: 'user' }, data: { value: 5 } });

    // ── 4. Places ─────────────────────────────────────────────────────────────
    const place1 = await prisma.place.upsert({
        where: { id: 'P_001' },
        update: {},
        create: {
            id: 'P_001',
            shortId: 1,
            ownerId: host1.id,
            title: 'Luxury Apartment in Riyadh',
            description: 'A stunning modern apartment in the heart of Riyadh with breathtaking city views. Features include a fully equipped kitchen, high-speed WiFi, and 24/7 security.',
            propertyType: 'apartment',
            status: 'PUBLISHED',
            checkIn: 14,
            checkOut: 11,
            extraInfo: 'No smoking. Pets not allowed. Quiet hours after 10 PM.',
            location: { create: { id: 'LOC_P001', city: 'Riyadh', district: 'Al Olaya', neighborhood: 'Olaya District', street: 'King Fahd Road', address: 'King Fahd Road, Al Olaya, Riyadh', latitude: 24.7136, longitude: 46.6753 } },
            pricing: { create: { id: 'PRI_P001', basePrice: 450, cleaningFee: 50, serviceFee: 30, securityDeposit: 200 } },
            capacity: { create: { id: 'CAP_P001', maxGuests: 4, bedrooms: 2, beds: 3, bathrooms: 2 } },
            photos: {
                create: [
                    { id: 'PH_P001_1', url: 'modern_apt_1.jpg', isMain: true },
                    { id: 'PH_P001_2', url: 'placeholder.jpg', isMain: false },
                    { id: 'PH_P001_3', url: 'placeholder.jpg', isMain: false }
                ]
            }
        }
    });

    const place2 = await prisma.place.upsert({
        where: { id: 'P_002' },
        update: {},
        create: {
            id: 'P_002',
            shortId: 2,
            ownerId: host1.id,
            title: 'Cozy Studio Near King Abdullah Park',
            description: 'A perfectly located studio apartment ideal for solo travelers or couples visiting Riyadh. Walking distance to King Abdullah Park and major shopping centres.',
            propertyType: 'studio',
            status: 'PUBLISHED',
            checkIn: 15,
            checkOut: 12,
            extraInfo: 'Free parking available. Self check-in with key lockbox.',
            location: { create: { id: 'LOC_P002', city: 'Riyadh', district: 'Al Malaz', neighborhood: 'Malaz District', street: 'Imam Turki Street', address: 'Imam Turki St, Al Malaz, Riyadh', latitude: 24.6877, longitude: 46.7219 } },
            pricing: { create: { id: 'PRI_P002', basePrice: 220, cleaningFee: 30, serviceFee: 15, securityDeposit: 100 } },
            capacity: { create: { id: 'CAP_P002', maxGuests: 2, bedrooms: 1, beds: 1, bathrooms: 1 } },
            photos: {
                create: [
                    { id: 'PH_P002_1', url: 'placeholder.jpg', isMain: true },
                    { id: 'PH_P002_2', url: 'placeholder.jpg', isMain: false }
                ]
            }
        }
    });

    const place3 = await prisma.place.upsert({
        where: { id: 'P_003' },
        update: {},
        create: {
            id: 'P_003',
            shortId: 3,
            ownerId: host2.id,
            title: 'Traditional Villa in Jeddah Corniche',
            description: 'Experience authentic Saudi hospitality in this beautifully restored traditional villa right on the Jeddah Corniche. Stunning sea views, private pool, and lush garden.',
            propertyType: 'villa',
            status: 'PUBLISHED',
            checkIn: 14,
            checkOut: 12,
            extraInfo: 'Minimum 3-night stay required. Driver service available upon request.',
            location: { create: { id: 'LOC_P003', city: 'Jeddah', district: 'Al Hamra', neighborhood: 'Corniche', street: 'Corniche Road', address: 'Corniche Rd, Al Hamra, Jeddah', latitude: 21.5433, longitude: 39.1728 } },
            pricing: { create: { id: 'PRI_P003', basePrice: 900, cleaningFee: 100, serviceFee: 60, securityDeposit: 500 } },
            capacity: { create: { id: 'CAP_P003', maxGuests: 10, bedrooms: 4, beds: 5, bathrooms: 3 } },
            photos: {
                create: [
                    { id: 'PH_P003_1', url: 'luxury_villa_1.jpg', isMain: true },
                    { id: 'PH_P003_2', url: 'villa_1.png', isMain: false },
                    { id: 'PH_P003_3', url: 'villa_2.png', isMain: false }
                ]
            }
        }
    });

    const place4 = await prisma.place.upsert({
        where: { id: 'P_004' },
        update: {},
        create: {
            id: 'P_004',
            shortId: 4,
            ownerId: host2.id,
            title: 'Modern Townhouse in Khobar',
            description: 'Stylish townhouse in the vibrant Al Khobar area. Perfect for families or business travelers. Close to ARAMCO headquarters and shopping malls.',
            propertyType: 'townhouse',
            status: 'PUBLISHED',
            checkIn: 15,
            checkOut: 11,
            extraInfo: 'BBQ area available. Smart TV with streaming services included.',
            location: { create: { id: 'LOC_P004', city: 'Al Khobar', district: 'Al Aqrabiyah', neighborhood: 'Downtown', street: 'Prince Faisal Bin Fahd Road', address: 'Prince Faisal Bin Fahd Rd, Khobar', latitude: 26.2172, longitude: 50.1971 } },
            pricing: { create: { id: 'PRI_P004', basePrice: 600, cleaningFee: 70, serviceFee: 40, securityDeposit: 300 } },
            capacity: { create: { id: 'CAP_P004', maxGuests: 6, bedrooms: 3, beds: 4, bathrooms: 2 } },
            photos: {
                create: [
                    { id: 'PH_P004_1', url: 'villa_3.png', isMain: true },
                    { id: 'PH_P004_2', url: 'villa_4.png', isMain: false }
                ]
            }
        }
    });

    // ── 5. Sample Bookings ────────────────────────────────────────────────────
    const futureDate = (days) => {
        const d = new Date();
        d.setDate(d.getDate() + days);
        return d;
    };

    const pastDate = (days) => {
        const d = new Date();
        d.setDate(d.getDate() - days);
        return d;
    };

    // Update place counter
    await prisma.counter.update({ where: { name: 'place' }, data: { value: 4 } });

    // ── 5. Sample Bookings ────────────────────────────────────────────────────
    // Booking 1: PENDING (guest1 wants place3)
    await prisma.booking.upsert({
        where: { id: 'B_001' },
        update: {},
        create: {
            id: 'B_001',
            shortId: 1,
            placeId: place3.id,
            userId: guest1.id,
            checkIn: futureDate(10),
            checkOut: futureDate(15),
            name: 'Sara Johnson',
            phone: '+966502222333',
            guestsCount: 3,
            totalPrice: 4500,
            status: 'PENDING',
            paymentStatus: 'UNPAID'
        }
    });

    // Booking 2: CONFIRMED (guest2 booked place1)
    await prisma.booking.upsert({
        where: { id: 'B_002' },
        update: {},
        create: {
            id: 'B_002',
            shortId: 2,
            placeId: place1.id,
            userId: guest2.id,
            checkIn: futureDate(5),
            checkOut: futureDate(8),
            name: 'Khalid Mansour',
            phone: '+966503333444',
            guestsCount: 2,
            totalPrice: 1450,
            status: 'CONFIRMED',
            paymentStatus: 'PAID',
            transactionId: 'TXN_DEMO_001',
            approvedAt: new Date(),
            paidAt: new Date()
        }
    });

    // Booking 3: COMPLETED — guest1 booked place1 in the past (enables review)
    const completedBooking = await prisma.booking.upsert({
        where: { id: 'B_003' },
        update: {},
        create: {
            id: 'B_003',
            shortId: 3,
            placeId: place1.id,
            userId: guest1.id,
            checkIn: pastDate(20),
            checkOut: pastDate(17),
            name: 'Sara Johnson',
            phone: '+966502222333',
            guestsCount: 2,
            totalPrice: 1350,
            status: 'COMPLETED',
            paymentStatus: 'PAID',
            transactionId: 'TXN_DEMO_002',
            approvedAt: pastDate(22),
            paidAt: pastDate(22)
        }
    });

    // Update booking counter
    await prisma.counter.update({ where: { name: 'booking' }, data: { value: 3 } });

    // ── 6. Sample Review (on completed booking) ───────────────────────────────
    await prisma.review.upsert({
        where: { id: 'REV_001' },
        update: {},
        create: {
            id: 'REV_001',
            userId: guest1.id,
            placeId: place1.id,
            bookingId: completedBooking.id,
            rating: 5,
            cleanliness: 5,
            communication: 5,
            locationScore: 4,
            valueScore: 4,
            comment: 'Amazing stay! The apartment was spotless and Ahmed was a wonderful host. The view was breathtaking. Highly recommend!'
        }
    });

    console.log('✅ Seed complete!');
    console.log('');
    console.log('📋 Test Accounts:');
    console.log('  Admin  → admin@dwellgo.com  / DwellGo_Admin_#2024!Complex');
    console.log('  Host 1 → host1@dwellgo.com  / DwellGo_Host1_#2024!Complex');
    console.log('  Host 2 → host2@dwellgo.com  / DwellGo_Host2_#2024!Complex');
    console.log('  Guest 1→ guest1@dwellgo.com / DwellGo_Guest1_#2024!Complex');
    console.log('  Guest 2→ guest2@dwellgo.com / DwellGo_Guest2_#2024!Complex');
}

main()
    .catch((e) => { console.error('❌ Seed failed:', e); process.exit(1); })
    .finally(async () => { await prisma.$disconnect(); });
