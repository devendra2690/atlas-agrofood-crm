import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

const masterConfig = [
    {
        name: "Banana",
        baseUnits: 220,
        cleaningWastage: 5,
        forms: [
            { name: "Powder", prepWastage: 38, yield: 22 }
        ]
    },
    {
        name: "Onion",
        baseUnits: 130,
        cleaningWastage: 2,
        forms: [
            { name: "Powder", prepWastage: 18, yield: 11 }
        ]
    },
    {
        name: "Garlic",
        baseUnits: 115,
        cleaningWastage: 2,
        forms: [
            { name: "Powder", prepWastage: 15, yield: 19 }
        ]
    },
    {
        name: "Ginger",
        baseUnits: 150,
        cleaningWastage: 5,
        forms: [
            { name: "Powder", prepWastage: 12, yield: 20 }
        ]
    },
    {
        name: "Turmeric",
        baseUnits: 160,
        cleaningWastage: 8,
        forms: [
            { name: "Powder", prepWastage: 5, yield: 20 }
        ]
    },
    {
        name: "Beetroot",
        baseUnits: 150,
        cleaningWastage: 5,
        forms: [
            { name: "Powder", prepWastage: 18, yield: 11 }
        ]
    },
    {
        name: "Amla",
        baseUnits: 180,
        cleaningWastage: 3,
        forms: [
            { name: "Powder", prepWastage: 14, yield: 15 }
        ]
    },
    {
        name: "Spinach",
        baseUnits: 75,
        cleaningWastage: 10,
        forms: [
            { name: "Powder", prepWastage: 15, yield: 8 }
        ]
    },
    {
        name: "Moringa",
        baseUnits: 70,
        cleaningWastage: 10,
        forms: [
            { name: "Powder", prepWastage: 35, yield: 24 }
        ]
    },
    {
        name: "Chilli",
        baseUnits: 100,
        cleaningWastage: 5,
        forms: [
            { name: "Powder", prepWastage: 10, yield: 88 }
        ]
    },
    {
        name: "Tomato",
        baseUnits: 160,
        cleaningWastage: 5,
        forms: [
            { name: "Powder", prepWastage: 0, yield: 6 }
        ]
    },
    {
        name: "Mango",
        baseUnits: 220,
        cleaningWastage: 5,
        forms: [
            { name: "Powder", prepWastage: 42, yield: 18 }
        ]
    }
];

async function main() {
    console.log('🌟 Applying Master Configuration to Database...');

    for (const config of masterConfig) {
        // Find commodity
        const commodity = await prisma.commodity.findFirst({
            where: { name: { contains: config.name, mode: 'insensitive' } }
        });

        if (!commodity) {
            console.log(`⚠️ Commodity not found: ${config.name}`);
            continue;
        }

        // Update Base
        await prisma.commodity.update({
            where: { id: commodity.id },
            data: {
                baseBatchElectricityUnits: config.baseUnits,
                wastagePercentage: config.cleaningWastage
            }
        });
        console.log(`✅ Updated ${config.name} Base: ${config.baseUnits} units, ${config.cleaningWastage}% cleaning`);

        // Update Forms
        for (const f of config.forms) {
            const form = await prisma.varietyForm.findFirst({
                where: {
                    commodityId: commodity.id,
                    formName: { contains: f.name, mode: 'insensitive' }
                } as any
            });

            if (form) {
                await prisma.varietyForm.update({
                    where: { id: form.id },
                    data: {
                        wastagePercentage: f.prepWastage,
                        yieldPercentage: f.yield
                    }
                });
                console.log(`  -> Updated ${f.name} form: ${f.prepWastage}% prep, ${f.yield}% yield`);
            } else {
                console.log(`  ⚠️ Form ${f.name} not found for ${config.name}`);
            }
        }
    }
    console.log('🚀 Master Configuration Applied Successfully!');
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
