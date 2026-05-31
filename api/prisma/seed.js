const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();
const salt = bcrypt.genSaltSync(10);
const hash = (pw) => bcrypt.hashSync(pw, salt);

async function main() {
    console.log('🌱 Starting comprehensive DwellGo Turkish Database Seeding...');

    // ── 1. Clean Database in Order of Dependencies ────────────────────────────
    console.log('🧹 Clearing old database records...');
    await prisma.report.deleteMany({});
    await prisma.notification.deleteMany({});
    await prisma.review.deleteMany({});
    await prisma.wishlist.deleteMany({});
    await prisma.message.deleteMany({});
    await prisma.conversationParticipant.deleteMany({});
    await prisma.conversation.deleteMany({});
    await prisma.placePhoto.deleteMany({});
    await prisma.placeAmenity.deleteMany({});
    await prisma.amenity.deleteMany({});
    await prisma.location.deleteMany({});
    await prisma.pricing.deleteMany({});
    await prisma.capacity.deleteMany({});
    await prisma.place.deleteMany({});
    await prisma.profile.deleteMany({});
    await prisma.user.deleteMany({});
    await prisma.counter.deleteMany({});

    console.log('✨ Database cleared. Seeding fresh data...');

    // ── 2. Create Users (Hosts & Guests) ──────────────────────────────────────
    const passwordHash = hash('123'); // Simple password '123' for ease of testing
    const adminPassword = hash('DwellGo_Admin_#2024!Complex');
    const host1Password = hash('DwellGo_Host1_#2024!Complex');
    const host2Password = hash('DwellGo_Host2_#2024!Complex');
    const guest1Password = hash('DwellGo_Guest1_#2024!Complex');
    const guest2Password = hash('DwellGo_Guest2_#2024!Complex');

    // Admin
    const admin = await prisma.user.create({
        data: {
            id: 'U_ADMIN',
            shortId: 1,
            email: 'admin@dwellgo.com',
            password: adminPassword,
            role: 'ADMIN',
            isHost: false,
            isVerified: true,
            profile: { create: { name: 'DwellGo Yönetici', phone: '0555 000 0000', bio: 'DwellGo Platform Yöneticisi.' } }
        }
    });

    // Hosts
    const musa = await prisma.user.create({
        data: {
            id: 'U_MUSA',
            shortId: 2,
            email: 'musa@dwellgo.com',
            password: passwordHash,
            role: 'USER',
            isHost: true,
            hostSince: new Date(),
            isVerified: true,
            profile: { create: { name: 'Musa Yılmaz', phone: '0555 123 4561', bio: 'Bodrum ve İstanbul\'da lüks villalar işletiyorum. Temizlik ve konfor önceliğimdir.' } }
        }
    });

    const illay = await prisma.user.create({
        data: {
            id: 'U_ILKAY',
            shortId: 3,
            email: 'illay@dwellgo.com',
            password: passwordHash,
            role: 'USER',
            isHost: true,
            hostSince: new Date(),
            isVerified: true,
            profile: { create: { name: 'İlkay Kaya', phone: '0555 123 4562', bio: 'Alaçatı ve Çeşme aşığı. Sizleri taş evlerimizde ağırlamaktan mutluluk duyuyorum.' } }
        }
    });

    const ali = await prisma.user.create({
        data: {
            id: 'U_ALI',
            shortId: 4,
            email: 'ali@dwellgo.com',
            password: passwordHash,
            role: 'USER',
            isHost: true,
            hostSince: new Date(),
            isVerified: true,
            profile: { create: { name: 'Ali Demir', phone: '0555 123 4563', bio: 'Doğa konaklamaları ve otantik taş odalar işletmecisiyim. Rehberlik konusunda yardımcı olabilirim.' } }
        }
    });

    const host1 = await prisma.user.create({
        data: {
            id: 'U_HOST1',
            shortId: 5,
            email: 'host1@dwellgo.com',
            password: host1Password,
            role: 'USER',
            isHost: true,
            hostSince: new Date(),
            isVerified: true,
            profile: { create: { name: 'Ahmet Tekin', phone: '0555 123 4564', bio: 'Profesyonel konaklama hizmetleri sunmaktayım.' } }
        }
    });

    const host2 = await prisma.user.create({
        data: {
            id: 'U_HOST2',
            shortId: 6,
            email: 'host2@dwellgo.com',
            password: host2Password,
            role: 'USER',
            isHost: true,
            hostSince: new Date(),
            isVerified: true,
            profile: { create: { name: 'Fatma Şahin', phone: '0555 123 4565', bio: 'İstanbul\'un merkezinde tarihi ve şık mekanları sizinle buluşturuyorum.' } }
        }
    });

    // Guests
    const guest1 = await prisma.user.create({
        data: {
            id: 'U_GUEST1',
            shortId: 7,
            email: 'guest1@dwellgo.com',
            password: guest1Password,
            role: 'USER',
            isHost: false,
            isVerified: true,
            profile: { create: { name: 'Selin Yılmaz', phone: '0555 222 3344', bio: 'Gezmeyi ve yeni yerler keşfetmeyi seviyorum.' } }
        }
    });

    const guest2 = await prisma.user.create({
        data: {
            id: 'U_GUEST2',
            shortId: 8,
            email: 'guest2@dwellgo.com',
            password: guest2Password,
            role: 'USER',
            isHost: false,
            isVerified: true,
            profile: { create: { name: 'Halit Demir', phone: '0555 333 4455', bio: 'İş seyahatleri ve hafta sonu kaçamakları için konaklama arıyorum.' } }
        }
    });

    const mehmet = await prisma.user.create({
        data: {
            id: 'U_MEHMET',
            shortId: 9,
            email: 'mehmet@dwellgo.com',
            password: passwordHash,
            role: 'USER',
            isHost: false,
            isVerified: true,
            profile: { create: { name: 'Mehmet Çelik', phone: '0555 444 5566', bio: 'Yaz tatillerimi Ege sahillerinde geçiren bir doğasever.' } }
        }
    });

    console.log('✅ Users registered successfully.');

    // ── 3. Create Places (Turkish properties with real photos from uploads) ─────
    const placesData = [
        {
            id: 'P_001',
            shortId: 1,
            ownerId: musa.id,
            title: 'Beşiktaş\'ta Boğaz Manzaralı Lüks Daire',
            description: 'İstanbul Beşiktaş\'ın kalbinde, eşsiz Boğaz manzarasına sahip ultra lüks daire. Geniş salonu, modern mutfağı ve 24 saat güvenliği bulunmaktadır. Vapur iskelesine ve kafe/restoranlara yürüyerek 5 dakika mesafededir.',
            propertyType: 'Daire',
            checkIn: 14,
            checkOut: 11,
            extraInfo: 'Evcil hayvan kabul edilir. Parti düzenlenemez. Gece 10\'dan sonra gürültü yapılmaması rica olunur.',
            city: 'İstanbul', district: 'Beşiktaş', neighborhood: 'Ortaköy', street: 'Dereboyu Caddesi', address: 'Dereboyu Cd. No:12, Ortaköy, Beşiktaş, İstanbul',
            latitude: 41.0473, longitude: 29.0204,
            basePrice: 2200, cleaningFee: 250, serviceFee: 120, securityDeposit: 1500,
            maxGuests: 4, bedrooms: 2, beds: 3, bathrooms: 1,
            photos: ['modern_apt_1.jpg', 'downloaded_12b16b065281c6553a2073ddefb36119.jpg']
        },
        {
            id: 'P_002',
            shortId: 2,
            ownerId: illay.id,
            title: 'Alaçatı Havuzlu Taş Ev - Şehir Merkezinde',
            description: 'Çeşme Alaçatı\'nın tarihi sokaklarına yürüme mesafesinde, geniş özel bahçeli ve havuzlu taş ev. Taş mimarinin serinliği ve modern mobilyaların konforu bir arada sunulmaktadır. Aileler için son derece uygundur.',
            propertyType: 'Müstakil Ev',
            checkIn: 15,
            checkOut: 12,
            extraInfo: 'Kendi özel havuzu vardır. Barbekü kullanımına uygundur.',
            city: 'İzmir', district: 'Çeşme', neighborhood: 'Alaçatı', street: 'Kemalpaşa Caddesi', address: 'Kemalpaşa Cd. 3001. Sokak No:4, Alaçatı, Çeşme, İzmir',
            latitude: 38.2811, longitude: 26.3742,
            basePrice: 3800, cleaningFee: 400, serviceFee: 200, securityDeposit: 2500,
            maxGuests: 6, bedrooms: 3, beds: 4, bathrooms: 2,
            photos: ['luxury_villa_1.jpg', 'downloaded_231bf3102936c561251a3508bd26a23c.jpg']
        },
        {
            id: 'P_003',
            shortId: 3,
            ownerId: ali.id,
            title: 'Kaş Merkezde Geniş Balkonlu Manzaralı Stüdyo',
            description: 'Antalya Kaş merkezinde, limana ve plajlara sadece yürüme mesafesinde yer alan şık stüdyo daire. Muhteşem gün batımı manzaralı geniş bir balkona sahiptir. Hızlı fiber internet mevcuttur, uzaktan çalışanlar için idealdir.',
            propertyType: 'Stüdyo',
            checkIn: 14,
            checkOut: 11,
            extraInfo: 'Dairemiz 3. kattadır ve asansör bulunmamaktadır. Akıllı kilit sistemi ile giriş mevcuttur.',
            city: 'Antalya', district: 'Kaş', neighborhood: 'Andifli', street: 'Hükümet Caddesi', address: 'Andifli Mh. Hükümet Cd. No:8, Kaş, Antalya',
            latitude: 36.1997, longitude: 29.6377,
            basePrice: 1200, cleaningFee: 150, serviceFee: 70, securityDeposit: 1000,
            maxGuests: 2, bedrooms: 1, beds: 1, bathrooms: 1,
            photos: ['villa_1.png', 'downloaded_24712809916ab7e59fb84c176f83149a.jpg']
        },
        {
            id: 'P_004',
            shortId: 4,
            ownerId: host1.id,
            title: 'Yalıkavak\'ta Deniz Manzaralı Müstakil Villa',
            description: 'Bodrum Yalıkavak Marina\'ya yakın konumda, sonsuzluk havuzuna sahip muhteşem deniz manzaralı lüks villa. Tam donanımlı mutfak, geniş veranda ve özel plaj erişimi bulunmaktadır. Lüks bir Bodrum tatili için aradığınız her şey burada.',
            propertyType: 'Villa',
            checkIn: 16,
            checkOut: 10,
            extraInfo: 'En az 3 gecelik konaklama şartı bulunmaktadır. Girişte hasar depozitosu nakit olarak alınır.',
            city: 'Muğla', district: 'Bodrum', neighborhood: 'Yalıkavak', street: 'Kudur Caddesi', address: 'Kudur Cd. 12. Sokak No:1, Yalıkavak, Bodrum, Muğla',
            latitude: 37.1086, longitude: 27.2889,
            basePrice: 6500, cleaningFee: 500, serviceFee: 350, securityDeposit: 5000,
            maxGuests: 8, bedrooms: 4, beds: 6, bathrooms: 3,
            photos: ['villa_2.png', 'downloaded_51f822b9f5d0b46dbde0cb96aed42575.jpg']
        },
        {
            id: 'P_005',
            shortId: 5,
            ownerId: host2.id,
            title: 'Karaköy\'de Tarihi Binada Endüstriyel Loft Daire',
            description: 'Karaköy\'ün restore edilmiş tarihi binalarından birinde, yüksek tavanlı ve endüstriyel tasarıma sahip loft daire. Galata Kulesi, tramvay istasyonu ve sanat galerilerine adımlar uzaklıktadır. İstanbul ruhunu yaşamak isteyenler için birebir.',
            propertyType: 'Daire',
            checkIn: 15,
            checkOut: 12,
            extraInfo: 'Yüksek tavanlı ve merdivenli asma kat yatak odası bulunmaktadır. Çocuklu aileler için uygun olmayabilir.',
            city: 'İstanbul', district: 'Beyoğlu', neighborhood: 'Karaköy', street: 'Kemankeş Caddesi', address: 'Kemankeş Cd. No:45, Karaköy, Beyoğlu, İstanbul',
            latitude: 41.0252, longitude: 28.9789,
            basePrice: 1900, cleaningFee: 200, serviceFee: 100, securityDeposit: 1200,
            maxGuests: 3, bedrooms: 1, beds: 2, bathrooms: 1,
            photos: ['villa_3.png', 'downloaded_5514e2457cf58b75e9725b2574360eaf.jpg']
        },
        {
            id: 'P_006',
            shortId: 6,
            ownerId: musa.id,
            title: 'Kalkan\'da Özel Jakuzili Balayı Villası',
            description: 'Antalya Kalkan\'ın yamaçlarında yer alan, dış gözlerden uzak, korunaklı havuz alanına sahip balayı villası. Yatak odasında ısıtmalı jakuzi ve muhteşem panoramik deniz manzarası mevcuttur. Muhafazakar aileler ve balayı çiftleri için mükemmel tercih.',
            propertyType: 'Villa',
            checkIn: 15,
            checkOut: 11,
            extraInfo: 'Havuz terası korunaklıdır, dışarıdan görünmez. Isıtmalı havuz ücreti fiyata dahildir.',
            city: 'Antalya', district: 'Kaş', neighborhood: 'Kalkan', street: 'Kışla Caddesi', address: 'Kışla Mh. Kışla Cd. No:22, Kalkan, Kaş, Antalya',
            latitude: 36.2625, longitude: 29.3941,
            basePrice: 4200, cleaningFee: 300, serviceFee: 220, securityDeposit: 3000,
            maxGuests: 2, bedrooms: 1, beds: 1, bathrooms: 2,
            photos: ['villa_4.png', 'downloaded_7908d67267a6f6bdccf5d243c2c2a9bf.jpg']
        },
        {
            id: 'P_007',
            shortId: 7,
            ownerId: illay.id,
            title: 'Çeşme Marina Yanında Lüks Dubleks Rezidans',
            description: 'Çeşme Marina\'ya sıfır konumda, havuzlu lüks rezidans kompleksi içerisinde yer alan geniş dubleks daire. 24 saat resepsiyon, spor salonu ve kapalı otopark gibi imkanlara sahiptir. Çeşme\'nin en prestijli bölgesinde konaklayın.',
            propertyType: 'Daire',
            checkIn: 14,
            checkOut: 12,
            extraInfo: 'Ortak havuz ve spor salonu kullanımı ücretsizdir. 1 araçlık kapalı otopark hakkınız bulunmaktadır.',
            city: 'İzmir', district: 'Çeşme', neighborhood: 'Musalla', street: '1016. Sokak', address: 'Musalla Mh. 1016. Sk. Rezidans Apt. No:2, Çeşme, İzmir',
            latitude: 38.3245, longitude: 26.3021,
            basePrice: 2800, cleaningFee: 300, serviceFee: 150, securityDeposit: 2000,
            maxGuests: 4, bedrooms: 2, beds: 2, bathrooms: 2,
            photos: ['villa_5.png', 'downloaded_8d2b2b23ed1ccf6678478b16475feb24.jpg']
        },
        {
            id: 'P_008',
            shortId: 8,
            ownerId: ali.id,
            title: 'Kapadokya Mağara Oda - Otantik Taş Konak',
            description: 'Kapadokya Ürgüp\'te, yüzlerce yıllık tarihi kaya odaların restore edilmesiyle oluşturulmuş otantik taş konak. Yazın serin, kışın sıcak tutan yapısı, geleneksel dekorasyonu ve şöminesiyle eşsiz bir Kapadokya atmosferi sunuyor.',
            propertyType: 'Otantik Ev',
            checkIn: 14,
            checkOut: 11,
            extraInfo: 'Şömine için odun temin edilmektedir. Balon kalkış saatlerinde terastan izleme imkanı vardır.',
            city: 'Nevşehir', district: 'Ürgüp', neighborhood: 'Cumhuriyet', street: 'Müze Caddesi', address: 'Cumhuriyet Mh. Müze Cd. No:19, Ürgüp, Nevşehir',
            latitude: 38.6291, longitude: 34.9122,
            basePrice: 1800, cleaningFee: 150, serviceFee: 90, securityDeposit: 1000,
            maxGuests: 3, bedrooms: 1, beds: 2, bathrooms: 1,
            photos: ['downloaded_c24e0b676f0d7a41eff87da37d1212cc.jpg', 'downloaded_c878106a35f5f6882e5113ffea03a77a.jpg']
        },
        {
            id: 'P_009',
            shortId: 9,
            ownerId: host1.id,
            title: 'Çankaya\'da Modern ve Şık Rezidans Dairesi',
            description: 'Ankara Çankaya\'da, büyükelçiliklere ve Tunalı Hilmi Caddesi\'ne yürüme mesafesinde son derece modern ve yeni dekore edilmiş daire. İş seyahatleri ve şehir ziyaretleri için yüksek konfor sağlar. Kapalı otoparkı vardır.',
            propertyType: 'Daire',
            checkIn: 14,
            checkOut: 11,
            extraInfo: 'Kendi kendine giriş yapılabilir. Hızlı internet mevcuttur.',
            city: 'Ankara', district: 'Çankaya', neighborhood: 'Kavaklıdere', street: 'Tunalı Hilmi Caddesi', address: 'Kavaklıdere Mh. Tunalı Hilmi Cd. No:82, Çankaya, Ankara',
            latitude: 39.9075, longitude: 32.8612,
            basePrice: 1500, cleaningFee: 150, serviceFee: 75, securityDeposit: 1000,
            maxGuests: 2, bedrooms: 1, beds: 1, bathrooms: 1,
            photos: ['downloaded_e3a6c394a31f832cc1376962bfee5086.jpg']
        }
    ];

    for (const p of placesData) {
        const { city, district, neighborhood, street, address, latitude, longitude, basePrice, cleaningFee, serviceFee, securityDeposit, maxGuests, bedrooms, beds, bathrooms, photos: pPhotos, checkIn, checkOut, ...placeInfo } = p;
        
        await prisma.place.create({
            data: {
                ...placeInfo,
                location: {
                    create: {
                        city, district, neighborhood, street, address, latitude, longitude
                    }
                },
                pricing: {
                    create: {
                        basePrice, cleaningFee, serviceFee, securityDeposit
                    }
                },
                capacity: {
                    create: {
                        maxGuests, bedrooms, beds, bathrooms
                    }
                },
                photos: {
                    create: pPhotos.map((url, index) => ({
                        url,
                        isMain: index === 0
                    }))
                }
            }
        });
    }

    console.log(`✅ Seeded ${placesData.length} places with Turkish locations and real photos (no black/placeholders).`);

    // ── 4. Create Bookings (Realistic timelines between the users) ─────────────
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

    const bookingsData = [
        // Booking 1: COMPLETED (Selin checked out Boğaz apartment)
        {
            id: 'B_001',
            shortId: 1,
            placeId: 'P_001',
            userId: guest1.id,
            checkIn: pastDate(25),
            checkOut: pastDate(21),
            name: 'Selin Yılmaz',
            phone: '0555 222 3344',
            guestsCount: 2,
            totalPrice: 9170, // (2200*4) + 250 + 120
            status: 'COMPLETED',
            paymentStatus: 'PAID',
            transactionId: 'TXN_DWELL_101',
            approvedAt: pastDate(27),
            paidAt: pastDate(27)
        },
        // Booking 2: CONFIRMED (Halit booked Alaçatı Stone house)
        {
            id: 'B_002',
            shortId: 2,
            placeId: 'P_002',
            userId: guest2.id,
            checkIn: futureDate(4),
            checkOut: futureDate(9),
            name: 'Halit Demir',
            phone: '0555 333 4455',
            guestsCount: 4,
            totalPrice: 19600, // (3800*5) + 400 + 200
            status: 'CONFIRMED',
            paymentStatus: 'PAID',
            transactionId: 'TXN_DWELL_102',
            approvedAt: pastDate(2),
            paidAt: pastDate(2)
        },
        // Booking 3: PENDING (Mehmet requested Bodrum Villa)
        {
            id: 'B_003',
            shortId: 3,
            placeId: 'P_004',
            userId: mehmet.id,
            checkIn: futureDate(12),
            checkOut: futureDate(16),
            name: 'Mehmet Çelik',
            phone: '0555 444 5566',
            guestsCount: 5,
            totalPrice: 26850, // (6500*4) + 500 + 350
            status: 'PENDING',
            paymentStatus: 'UNPAID'
        },
        // Booking 4: APPROVED (Selin booked Kaş Studio, awaiting payment)
        {
            id: 'B_004',
            shortId: 4,
            placeId: 'P_003',
            userId: guest1.id,
            checkIn: futureDate(2),
            checkOut: futureDate(5),
            name: 'Selin Yılmaz',
            phone: '0555 222 3344',
            guestsCount: 2,
            totalPrice: 3820, // (1200*3) + 150 + 70
            status: 'APPROVED',
            paymentStatus: 'UNPAID',
            approvedAt: pastDate(1)
        },
        // Booking 5: CANCELLED (Halit cancelled Kalkan Villa)
        {
            id: 'B_005',
            shortId: 5,
            placeId: 'P_006',
            userId: guest2.id,
            checkIn: pastDate(10),
            checkOut: pastDate(7),
            name: 'Halit Demir',
            phone: '0555 333 4455',
            guestsCount: 2,
            totalPrice: 13120, // (4200*3) + 300 + 220
            status: 'CANCELLED',
            paymentStatus: 'UNPAID',
            cancelledAt: pastDate(12),
            cancelReason: 'İş planlarımdaki değişiklik nedeniyle iptal etmek zorunda kaldım.'
        },
        // Booking 6: COMPLETED (Halit checked out Kaş Studio, enabling another review)
        {
            id: 'B_006',
            shortId: 6,
            placeId: 'P_003',
            userId: guest2.id,
            checkIn: pastDate(15),
            checkOut: pastDate(12),
            name: 'Halit Demir',
            phone: '0555 333 4455',
            guestsCount: 2,
            totalPrice: 3820, // (1200*3) + 150 + 70
            status: 'COMPLETED',
            paymentStatus: 'PAID',
            transactionId: 'TXN_DWELL_106',
            approvedAt: pastDate(17),
            paidAt: pastDate(17)
        }
    ];

    for (const b of bookingsData) {
        await prisma.booking.create({ data: b });
    }

    console.log(`✅ Seeded ${bookingsData.length} bookings successfully.`);

    // ── 5. Create Reviews (For completed bookings in Turkish) ──────────────────
    await prisma.review.create({
        data: {
            id: 'REV_001',
            userId: guest1.id,
            placeId: 'P_001', // Boğaz Dairesi
            bookingId: 'B_001',
            rating: 5,
            cleanliness: 5,
            communication: 5,
            locationScore: 5,
            valueScore: 4,
            comment: 'Harika bir deneyimdi! Balkondaki Boğaz manzarası nefes kesiciydi. Ev tertemizdi ve ihtiyacımız olan her şey mevcuttu. Ev sahibi Musa Bey çok ilgili ve nazik bir insan, kesinlikle tekrar geleceğiz.'
        }
    });

    await prisma.review.create({
        data: {
            id: 'REV_002',
            userId: guest2.id,
            placeId: 'P_003', // Kaş Stüdyo
            bookingId: 'B_006',
            rating: 4,
            cleanliness: 4,
            communication: 5,
            locationScore: 5,
            valueScore: 4,
            comment: 'Kaş merkezinde her yere yürüme mesafesinde şirin bir daire. Manzarası harikaydı. Tek sıkıntı banyonun biraz küçük olmasıydı ancak genel konfor ve konumu kesinlikle harika.'
        }
    });

    console.log('✅ Seeded reviews successfully.');

    // ── 6. Create Conversations & Messages (In Turkish between users) ─────────
    const conversations = [
        // Selin Yılmaz (Guest 1) ↔ Musa Yılmaz (Host Musa)
        {
            participants: [guest1.id, musa.id],
            messages: [
                { senderId: guest1.id, text: 'Merhaba Musa Bey, Ortaköy\'deki daireniz ile ilgileniyorum. Evcil hayvan kabul ediyor musunuz? Küçük bir köpeğim var.' },
                { senderId: musa.id, text: 'Merhaba Selin Hanım, evet eğitimli ve küçük evcil hayvanları kabul ediyoruz. Gürültü yapmaması ve temizliğine dikkat edilmesi yeterlidir.' },
                { senderId: guest1.id, text: 'Çok teşekkürler! Rezervasyon isteği gönderiyorum o halde.' },
                { senderId: musa.id, text: 'Harika, isteğinizi hemen onaylıyorum. Şimdiden keyifli bir konaklama dilerim!' }
            ]
        },
        // Halit Demir (Guest 2) ↔ İlkay Kaya (Host İlkay)
        {
            participants: [guest2.id, illay.id],
            messages: [
                { senderId: guest2.id, text: 'İlkay Bey merhaba, Alaçatı\'daki taş ev için otopark alanı bulunuyor mu? Aracımızla geleceğiz.' },
                { senderId: illay.id, text: 'Merhaba Halit Bey! Evimizin hemen önünde ve yan tarafında ücretsiz sokak otopark alanı mevcuttur. Park sorunu yaşamazsınız.' },
                { senderId: guest2.id, text: 'Harika bir haber. Rezervasyonu tamamlıyorum, teşekkürler.' },
                { senderId: illay.id, text: 'Rica ederim, rezervasyonunuz onaylandı. Giriş gününde görüşmek dileğiyle!' }
            ]
        },
        // Mehmet Çelik (Guest Mehmet) ↔ Ahmet Tekin (Host 1)
        {
            participants: [mehmet.id, host1.id],
            messages: [
                { senderId: mehmet.id, text: 'Ahmet Bey selamlar, Yalıkavak\'taki villanızda internet hızı nasıl? Uzaktan çalışacağım için internet benim için kritik önemde.' },
                { senderId: host1.id, text: 'Selamlar Mehmet Bey, villamızda 100 Mbps fiber internet bulunmakta ve evin her odasında çekim gücü mükemmeldir. Uzaktan çalışmak için oldukça rahattır.' },
                { senderId: mehmet.id, text: 'Çok iyi, rezervasyon talebini gönderdim.' },
                { senderId: host1.id, text: 'Talebinizi aldım, kontrol edip onaylıyorum.' }
            ]
        }
    ];

    for (const c of conversations) {
        const conversation = await prisma.conversation.create({ data: {} });
        
        for (const pid of c.participants) {
            await prisma.conversationParticipant.create({
                data: { userId: pid, conversationId: conversation.id }
            });
        }

        let timeOffset = c.messages.length * 60 * 60 * 1000; // stagger messages in hours
        for (const msg of c.messages) {
            await prisma.message.create({
                data: {
                    conversationId: conversation.id,
                    senderId: msg.senderId,
                    text: msg.text,
                    read: true,
                    createdAt: new Date(Date.now() - timeOffset)
                }
            });
            timeOffset -= 60 * 60 * 1000;
        }
    }

    console.log('✅ Seeded chats and Turkish conversations successfully.');

    // ── 7. Initialize/Sync DB Auto-Increment Counters ────────────────────────
    await prisma.counter.upsert({ where: { name: 'user' },    update: { value: 9 }, create: { name: 'user',    value: 9 } });
    await prisma.counter.upsert({ where: { name: 'place' },   update: { value: 9 }, create: { name: 'place',   value: 9 } });
    await prisma.counter.upsert({ where: { name: 'booking' }, update: { value: 6 }, create: { name: 'booking', value: 6 } });

    console.log('⚡ DB counters synchronized successfully to prevent unique constraints issues.');
    console.log('🎉 Seeding successfully completed! DwellGo database is fully set up with clean Turkish data.');
}

main()
    .catch((e) => {
        console.error('❌ Database seeding failed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
