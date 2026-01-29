const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const DATA = {
    "Banana": ["G9 Cavendish", "Robusta", "Elakki"],
    "Mango": ["Alphonso", "Kesar", "Totapuri"],
    "Onion": ["Nashik Red", "White Onion", "Garwa"],
    "Garlic": ["Ooty", "Desi", "G2"],
    "Ginger": ["Mahim", "Varada", "Rio de Janeiro"],
    "Turmeric": ["Salem", "Rajapuri", "Pratibha"]
};

const STATES = [
    "Maharashtra", "Gujarat", "Karnataka", "Madhya Pradesh", "Tamil Nadu", "Andhra Pradesh"
];

async function main() {
    console.log("Seeding Matrix Data...");

    // 1. Seed States
    let country = await prisma.country.findUnique({ where: { name: "India" } });
    if (!country) {
        country = await prisma.country.create({ data: { name: "India" } });
    }

    for (const stateName of STATES) {
        await prisma.state.upsert({
            where: { name_countryId: { name: stateName, countryId: country.id } },
            update: {},
            create: { name: stateName, countryId: country.id }
        });
    }
    console.log("States seeded.");

    // 2. Seed Varieties
    for (const [commodityName, varieties] of Object.entries(DATA)) {
        const commodity = await prisma.commodity.findUnique({ where: { name: commodityName } });
        if (commodity) {
            for (const varName of varieties) {
                await prisma.commodityVariety.upsert({
                    where: { name_commodityId: { name: varName, commodityId: commodity.id } },
                    update: {},
                    create: { name: varName, commodityId: commodity.id }
                });
            }
        }
    }
    console.log("Varieties seeded.");
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
