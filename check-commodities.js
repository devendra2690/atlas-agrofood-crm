const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        const commodities = await prisma.commodity.findMany({ select: { name: true } });
        console.log("Commodities:", commodities.map(c => c.name).join(", "));
    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
