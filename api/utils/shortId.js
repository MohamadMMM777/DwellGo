/**
 * Atomic short ID generator using the Counter table.
 * Each entity type (user, place, booking) has its own counter.
 * Returns the next integer ID, e.g. 1, 2, 3 ...
 */
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function nextShortId(type) {
    const counter = await prisma.counter.upsert({
        where: { name: type },
        update: { value: { increment: 1 } },
        create: { name: type, value: 1 },
    });
    return counter.value;
}

module.exports = { nextShortId };
