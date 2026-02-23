import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('⚡️ Starting Base Energy Profile Seeding...');

    // Get all commodities
    const commodities = await prisma.commodity.findMany();
    console.log(`Found ${commodities.length} commodities in the database.`);

    let updatedCount = 0;

    for (const item of commodities) {
        const name = item.name.toLowerCase();

        // Default fallback values
        let category = "Other";
        let baseUnits = 150.0;

        // Classification Logic matching the Pricing Engine assumptions
        if (
            name.includes('spinach') ||
            name.includes('coriander') ||
            name.includes('mint') ||
            name.includes('fenugreek') ||
            name.includes('curry') ||
            name.includes('cabbage')
        ) {
            category = "Leafy";
            baseUnits = 70.0;
        } else if (
            name.includes('onion') ||
            name.includes('garlic')
        ) {
            category = "Bulb";
            baseUnits = name.includes('onion') ? 130.0 : 115.0;
        } else if (
            name.includes('potato') ||
            name.includes('beet') ||
            name.includes('carrot') ||
            name.includes('ginger') ||
            name.includes('turmeric') ||
            name.includes('sweet potato') ||
            name.includes('radish') ||
            name.includes('turnip')
        ) {
            category = "Root";
            baseUnits = 150.0;
        } else if (
            name.includes('mango') ||
            name.includes('banana') ||
            name.includes('tomato') ||
            name.includes('apple') ||
            name.includes('papaya') ||
            name.includes('guava') ||
            name.includes('orange') ||
            name.includes('pineapple') ||
            name.includes('lemon') ||
            name.includes('pomegranate') ||
            name.includes('grapes') ||
            name.includes('watermelon') ||
            name.includes('muskmelon') ||
            name.includes('strawberry') ||
            name.includes('litchi') ||
            name.includes('sapota') ||
            name.includes('custard apple') ||
            name.includes('jackfruit') ||
            name.includes('plum') ||
            name.includes('peach')
        ) {
            category = "Fruit";
            baseUnits = 220.0;
        } else if (
            name.includes('peanut') ||
            name.includes('cashew') ||
            name.includes('almond') ||
            name.includes('walnut')
        ) {
            category = "Nut";
            baseUnits = 60.0; // Nuts require less dehydration
        } else if (
            name.includes('cumin') ||
            name.includes('chilli') ||
            name.includes('tamarind')
        ) {
            category = "Spice";
            baseUnits = 80.0;
        }

        // Always update to ensure UI is completely populated
        await prisma.commodity.update({
            where: { id: item.id },
            data: {
                category: category,
                baseBatchElectricityUnits: baseUnits
            }
        });

        updatedCount++;
        console.log(`Updated ${item.name}: Category='${category}', Base Units=${baseUnits}`);
    }

    console.log(`\n✅ Successfully configured ${updatedCount} commodity energy profiles!`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
