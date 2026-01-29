const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        const vendors = await prisma.company.count({ where: { type: "VENDOR" } });
        const varieties = await prisma.commodityVariety.count();
        const states = await prisma.state.count();

        console.log("Vendors:", vendors);
        console.log("Varieties:", varieties);
        console.log("States:", states);
    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
