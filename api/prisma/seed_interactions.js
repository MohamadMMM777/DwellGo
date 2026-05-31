/**
 * DwellGo — Interaction Seed
 * Adds: 2 guest users + bookings (all statuses) + reviews + conversations/messages
 * Run: cd api && node prisma/seed_interactions.js
 */

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();
const hash = (pw) => bcrypt.hashSync(pw, bcrypt.genSaltSync(10));

// ── Helpers ───────────────────────────────────────────────────────────────────

async function nextShortId(type) {
    const counter = await prisma.counter.upsert({
        where: { name: type },
        update: { value: { increment: 1 } },
        create: { name: type, value: 1 },
    });
    return counter.value;
}

function daysFromNow(n) {
    const d = new Date();
    d.setDate(d.getDate() + n);
    return d;
}

function daysAgo(n) {
    const d = new Date();
    d.setDate(d.getDate() - n);
    return d;
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
    console.log('🌱 Seeding interactions...\n');

    // ── 1. Ensure counters exist ──────────────────────────────────────────────
    await prisma.counter.upsert({ where: { name: 'user' },    update: {}, create: { name: 'user',    value: 10 } });
    await prisma.counter.upsert({ where: { name: 'place' },   update: {}, create: { name: 'place',   value: 30 } });
    await prisma.counter.upsert({ where: { name: 'booking' }, update: {}, create: { name: 'booking', value: 0  } });

    // ── 2. Add shortIds to existing places that don't have one ────────────────
    const placesWithoutShortId = await prisma.place.findMany({ where: { shortId: null }, select: { id: true } });
    for (const p of placesWithoutShortId) {
        const sid = await nextShortId('place');
        await prisma.place.update({ where: { id: p.id }, data: { shortId: sid } });
    }
    console.log(`✅ Assigned shortIds to ${placesWithoutShortId.length} places`);

    // ── 3. Ensure shortIds on existing users ──────────────────────────────────
    const usersWithoutShortId = await prisma.user.findMany({ where: { shortId: null }, select: { id: true } });
    let userCounter = 10;
    for (const u of usersWithoutShortId) {
        userCounter++;
        await prisma.user.update({ where: { id: u.id }, data: { shortId: userCounter } });
    }
    console.log(`✅ Assigned shortIds to ${usersWithoutShortId.length} users`);

    // ── 4. Create guest users ─────────────────────────────────────────────────
    const guest1 = await prisma.user.upsert({
        where: { email: 'guest1@dwellgo.com' },
        update: {},
        create: {
            id: 'U_G1',
            shortId: 201,
            email: 'guest1@dwellgo.com',
            password: hash('Guest@123'),
            role: 'USER',
            isHost: false,
            profile: { create: { name: 'Booking Test User', phone: '+90 555 111 2233' } }
        }
    });

    const guest2 = await prisma.user.upsert({
        where: { email: 'guest2@dwellgo.com' },
        update: {},
        create: {
            id: 'U_G2',
            shortId: 202,
            email: 'guest2@dwellgo.com',
            password: hash('Guest@123'),
            role: 'USER',
            isHost: false,
            profile: { create: { name: 'Guest User', phone: '+90 555 444 5566' } }
        }
    });
    console.log('✅ Guest users ready');

    // ── 5. Get some places for each host ──────────────────────────────────────
    const musaPlaces   = await prisma.place.findMany({ where: { ownerId: 'U2' }, take: 3 });
    const illayPlaces  = await prisma.place.findMany({ where: { ownerId: 'U3' }, take: 2 });
    const aliPlaces    = await prisma.place.findMany({ where: { ownerId: 'U4' }, take: 2 });
    const aysePlaces   = await prisma.place.findMany({ where: { ownerId: 'U5' }, take: 1 });
    const mehmetPlaces = await prisma.place.findMany({ where: { ownerId: 'U6' }, take: 1 });

    // ── 6. Create Bookings ────────────────────────────────────────────────────
    const bookingsData = [];

    // [A] COMPLETED bookings (past) — will get reviews
    if (musaPlaces[0]) bookingsData.push({
        placeId: musaPlaces[0].id, userId: guest1.id,
        checkIn: daysAgo(60), checkOut: daysAgo(54),
        name: 'Booking Test User', phone: '+90 555 111 2233',
        guestsCount: 2, totalPrice: 2400,
        status: 'COMPLETED', paymentStatus: 'PAID',
        approvedAt: daysAgo(65), paidAt: daysAgo(63),
        _reviewRating: 5, _reviewComment: 'Harika bir deneyimdi! Ev çok temiz ve konforluydu. Ev sahibi çok ilgili ve yardımseverdi.'
    });

    if (illayPlaces[0]) bookingsData.push({
        placeId: illayPlaces[0].id, userId: guest1.id,
        checkIn: daysAgo(45), checkOut: daysAgo(41),
        name: 'Booking Test User', phone: '+90 555 111 2233',
        guestsCount: 1, totalPrice: 1600,
        status: 'COMPLETED', paymentStatus: 'PAID',
        approvedAt: daysAgo(50), paidAt: daysAgo(47),
        _reviewRating: 4, _reviewComment: 'Güzel bir yer, temiz ve ferah. Konum mükemmeldi. Tekrar tercih ederim.'
    });

    if (aliPlaces[0]) bookingsData.push({
        placeId: aliPlaces[0].id, userId: guest2.id,
        checkIn: daysAgo(30), checkOut: daysAgo(26),
        name: 'Guest User', phone: '+90 555 444 5566',
        guestsCount: 3, totalPrice: 3200,
        status: 'COMPLETED', paymentStatus: 'PAID',
        approvedAt: daysAgo(35), paidAt: daysAgo(32),
        _reviewRating: 5, _reviewComment: 'Mükemmel konaklama! Her şey eksiksizdi. Kesinlikle tavsiye ederim.'
    });

    if (musaPlaces[1]) bookingsData.push({
        placeId: musaPlaces[1].id, userId: guest2.id,
        checkIn: daysAgo(20), checkOut: daysAgo(17),
        name: 'Guest User', phone: '+90 555 444 5566',
        guestsCount: 2, totalPrice: 1800,
        status: 'COMPLETED', paymentStatus: 'PAID',
        approvedAt: daysAgo(25), paidAt: daysAgo(22),
        _reviewRating: 4, _reviewComment: 'Çok güzel bir ev, her şey düşünülmüş. Sadece park sorunu vardı ama genel olarak harikaydı.'
    });

    // [B] CONFIRMED booking (paid, upcoming)
    if (illayPlaces[1]) bookingsData.push({
        placeId: illayPlaces[1].id, userId: guest1.id,
        checkIn: daysFromNow(10), checkOut: daysFromNow(15),
        name: 'Booking Test User', phone: '+90 555 111 2233',
        guestsCount: 2, totalPrice: 2000,
        status: 'CONFIRMED', paymentStatus: 'PAID',
        approvedAt: daysAgo(3), paidAt: daysAgo(2),
    });

    // [C] APPROVED booking (waiting for payment)
    if (aliPlaces[1]) bookingsData.push({
        placeId: aliPlaces[1].id, userId: guest2.id,
        checkIn: daysFromNow(20), checkOut: daysFromNow(25),
        name: 'Guest User', phone: '+90 555 444 5566',
        guestsCount: 1, totalPrice: 2500,
        status: 'APPROVED', paymentStatus: 'UNPAID',
        approvedAt: daysAgo(1),
    });

    // [D] PENDING bookings (waiting for host approval) — these BLOCK deletion
    if (musaPlaces[2]) bookingsData.push({
        placeId: musaPlaces[2].id, userId: guest1.id,
        checkIn: daysFromNow(30), checkOut: daysFromNow(34),
        name: 'Booking Test User', phone: '+90 555 111 2233',
        guestsCount: 2, totalPrice: 1600,
        status: 'PENDING', paymentStatus: 'UNPAID',
    });

    if (aysePlaces[0]) bookingsData.push({
        placeId: aysePlaces[0].id, userId: guest2.id,
        checkIn: daysFromNow(5), checkOut: daysFromNow(9),
        name: 'Guest User', phone: '+90 555 444 5566',
        guestsCount: 4, totalPrice: 3600,
        status: 'PENDING', paymentStatus: 'UNPAID',
    });

    // [E] CANCELLED booking
    if (mehmetPlaces[0]) bookingsData.push({
        placeId: mehmetPlaces[0].id, userId: guest1.id,
        checkIn: daysAgo(10), checkOut: daysAgo(7),
        name: 'Booking Test User', phone: '+90 555 111 2233',
        guestsCount: 2, totalPrice: 2100,
        status: 'CANCELLED', paymentStatus: 'UNPAID',
        cancelledAt: daysAgo(12), cancelReason: 'Planlarım değişti',
    });

    // Insert bookings
    const createdBookings = [];
    for (const b of bookingsData) {
        const { _reviewRating, _reviewComment, ...bookingFields } = b;
        const shortId = await nextShortId('booking');
        const booking = await prisma.booking.create({
            data: { ...bookingFields, shortId }
        });
        createdBookings.push({ ...booking, _reviewRating, _reviewComment });
        console.log(`  ↳ Booking #${shortId}: ${booking.status} — place ${booking.placeId}`);
    }
    console.log(`✅ Created ${createdBookings.length} bookings`);

    // ── 7. Create Reviews for COMPLETED bookings ──────────────────────────────
    let reviewCount = 0;
    for (const b of createdBookings) {
        if (b.status !== 'COMPLETED' || !b._reviewRating) continue;

        // Check unique constraint
        const exists = await prisma.review.findFirst({ where: { userId: b.userId, placeId: b.placeId } });
        if (exists) continue;

        await prisma.review.create({
            data: {
                userId: b.userId,
                placeId: b.placeId,
                bookingId: b.id,
                rating: b._reviewRating,
                cleanliness: b._reviewRating,
                communication: Math.min(5, b._reviewRating + 1),
                locationScore: b._reviewRating,
                valueScore: Math.max(3, b._reviewRating - 1),
                comment: b._reviewComment,
            }
        });
        reviewCount++;
    }
    console.log(`✅ Created ${reviewCount} reviews`);

    // ── 8. Create Conversations & Messages ────────────────────────────────────
    const conversations = [
        // guest1 ↔ musa (U2) about musaPlaces[0]
        {
            participants: [guest1.id, 'U2'],
            messages: [
                { senderId: guest1.id, text: 'Merhaba! İlanınız hakkında birkaç sorum olacaktı. Evcil hayvan kabul ediyor musunuz?' },
                { senderId: 'U2', text: 'Merhaba! Evet, küçük evcil hayvanlar için uygunuz. Ne tür bir hayvanınız var?' },
                { senderId: guest1.id, text: 'Küçük bir köpeğim var, 5 kg. Sorun olur mu?' },
                { senderId: 'U2', text: 'Hayır, hiç sorun olmaz! Temizlik depozito alıyoruz sadece.' },
                { senderId: guest1.id, text: 'Harika! Rezervasyon yaptım, görüşürüz!' },
                { senderId: 'U2', text: 'Sizi bekliyoruz, keyifli tatiller!' },
            ]
        },
        // guest1 ↔ illay (U3)
        {
            participants: [guest1.id, 'U3'],
            messages: [
                { senderId: guest1.id, text: 'Merhaba, otoparkınız var mı?' },
                { senderId: 'U3', text: 'Evet, ücretsiz özel otopark mevcuttur.' },
                { senderId: guest1.id, text: 'Harika, teşekkürler! Rezervasyon yapacağım.' },
                { senderId: 'U3', text: 'Bekleriz, iyi tatiller!' },
            ]
        },
        // guest2 ↔ ali (U4)
        {
            participants: [guest2.id, 'U4'],
            messages: [
                { senderId: guest2.id, text: 'Selam, 3 kişilik bir grup için uygun mu bu yer?' },
                { senderId: 'U4', text: 'Evet, 3 kişi için fazlasıyla uygun! 2 yatak odası ve 2 banyo var.' },
                { senderId: guest2.id, text: 'Süper! Fiyat müzakeresi mümkün mü haftalık kalış için?' },
                { senderId: 'U4', text: '7 gece üzeri kalışlarda %10 indirim uyguluyorum.' },
                { senderId: guest2.id, text: 'Anlaştık! Hemen rezervasyon yapıyorum.' },
            ]
        },
        // guest2 ↔ musa (U2) — şikayet sonrası
        {
            participants: [guest2.id, 'U2'],
            messages: [
                { senderId: guest2.id, text: 'Merhaba, klima çalışmıyor ve çok sıcak!' },
                { senderId: 'U2', text: 'Özür dilerim! Hemen teknisyen göndereceğim.' },
                { senderId: guest2.id, text: 'Teşekkürler, acil yardım gerekiyor.' },
                { senderId: 'U2', text: '1 saat içinde çözüme kavuşacak, tekrar özür dilerim.' },
                { senderId: guest2.id, text: 'Tamam, teşekkürler. Bekliyorum.' },
            ]
        },
    ];

    let convCount = 0;
    for (const conv of conversations) {
        const conversation = await prisma.conversation.create({ data: {} });
        for (const uid of conv.participants) {
            await prisma.conversationParticipant.create({
                data: { userId: uid, conversationId: conversation.id }
            });
        }
        // stagger timestamps
        let msgDate = new Date(Date.now() - conv.messages.length * 3 * 60 * 60 * 1000);
        for (const msg of conv.messages) {
            msgDate = new Date(msgDate.getTime() + 3 * 60 * 60 * 1000);
            await prisma.message.create({
                data: {
                    conversationId: conversation.id,
                    senderId: msg.senderId,
                    text: msg.text,
                    read: true,
                    createdAt: msgDate,
                }
            });
        }
        convCount++;
    }
    console.log(`✅ Created ${convCount} conversations with messages`);

    // ── 9. Summary ────────────────────────────────────────────────────────────
    console.log('\n🎉 Done! Summary:');
    console.log(`  Bookings: ${await prisma.booking.count()}`);
    console.log(`  Reviews:  ${await prisma.review.count()}`);
    console.log(`  Messages: ${await prisma.message.count()}`);
    console.log('\n🔑 Guest accounts:');
    console.log('  guest1@dwellgo.com / Guest@123');
    console.log('  guest2@dwellgo.com / Guest@123');
    console.log('\n⚠️  Places with ACTIVE bookings (cannot delete):');
    const blocked = await prisma.place.findMany({
        where: { bookings: { some: { status: { in: ['PENDING','APPROVED','CONFIRMED'] } } } },
        select: { id: true, title: true }
    });
    blocked.forEach(p => console.log(`  - ${p.id}: ${p.title}`));
}

main()
    .catch(e => { console.error('❌ Error:', e); process.exit(1); })
    .finally(() => prisma.$disconnect());
