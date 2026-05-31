const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();
const bcryptSalt = bcrypt.genSaltSync(10);

// Use high-quality offline-ready local images
const photoUrls = [
    'modern_apt_1.jpg',
    'luxury_villa_1.jpg',
    'villa_1.png',
    'villa_2.png',
    'villa_3.png',
    'villa_4.png',
    'villa_5.png',
    'placeholder.jpg'
];

async function main() {
    console.log('--- Cleaning and Seeding Professional Database with Photos ---');
    
    // Clear existing data to ensure fresh sequential IDs
    await prisma.placePhoto.deleteMany({});
    await prisma.pricing.deleteMany({});
    await prisma.location.deleteMany({});
    await prisma.capacity.deleteMany({});
    await prisma.place.deleteMany({});
    await prisma.profile.deleteMany({});
    await prisma.user.deleteMany({});

    const password = await bcrypt.hash('123', bcryptSalt);

    // 1. Create Admin Account
    await prisma.user.create({
        data: {
            id: 'U1',
            email: 'admin@dwellgo.com',
            password: password,
            role: 'ADMIN',
            profile: {
                create: {
                    id: 'PROF1',
                    name: 'DwellGo Manager'
                }
            }
        }
    });

    // 2. Create the 5 Specific Users
    const usernames = ['musa', 'illay', 'ali', 'ayşe', 'mehmet'];
    const surnames = ['Yılmaz', 'Kaya', 'Demir', 'Şahin', 'Çelik'];
    
    for (let i = 0; i < usernames.length; i++) {
        const userId = `U${i + 2}`;
        const email = `${usernames[i]}@dwellgo.com`;
        const fullName = `${usernames[i].charAt(0).toUpperCase() + usernames[i].slice(1)} ${surnames[i]}`;
        
        await prisma.user.create({
            data: {
                id: userId,
                email: email,
                password: password,
                role: 'USER',
                profile: {
                    create: {
                        id: `PROF${i + 2}`,
                        name: fullName,
                        phone: `0555 123 45 0${i + 1}`,
                        bio: `2024'ten beri profesyonel ev sahibi olarak misafirlerine kaliteli konaklama sunuyor.`
                    }
                }
            }
        });

        // 3. Create 5 Listings for each (Total 25)
        for (let j = 1; j <= 5; j++) {
            const index = (i * 5) + j;
            const placeId = `P${index}`;
            const photoUrl = photoUrls[index % photoUrls.length];
            
            await prisma.place.create({
                data: {
                    id: placeId,
                    ownerId: userId,
                    title: `${fullName} - İlan #${j}`,
                    description: `${fullName} tarafından sunulan konforlu ve tam donanımlı bu ilanda keyifli bir konaklama deneyimi sizi bekliyor.`,
                    propertyType: j % 2 === 0 ? 'Daire' : 'Müstakil Ev',
                    status: 'PUBLISHED',
                    photos: {
                        create: {
                            id: `PH${index}`,
                            url: photoUrl,
                            isMain: true
                        }
                    },
                    pricing: {
                        create: {
                            id: `PRC${index}`,
                            basePrice: 450 + (index * 20),
                            cleaningFee: 40,
                            serviceFee: 15
                        }
                    },
                    location: {
                        create: {
                            id: `LOC${index}`,
                            city: 'İstanbul',
                            district: 'Karaköy',
                            neighborhood: 'Kemankeş'
                        }
                    },
                    capacity: {
                        create: {
                            id: `CAP${index}`,
                            maxGuests: 4,
                            bedrooms: 2,
                            beds: 2,
                            bathrooms: 1
                        }
                    }
                }
            });
        }
        console.log(`✓ User ${fullName} (${userId}) Created with 5 Photo-enabled Listings`);
    }

    console.log('\n--- Seeding Process Finished Successfully ---');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
