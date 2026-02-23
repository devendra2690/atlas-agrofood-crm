import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const defaultWastages = [
    // Fruits
    { commodityName: "Mango", defaultWastagePercentage: 40 }, // Peel, stone
    { commodityName: "Banana", defaultWastagePercentage: 35 }, // Peel
    { commodityName: "Papaya", defaultWastagePercentage: 30 }, // Peel, seeds
    { commodityName: "Guava", defaultWastagePercentage: 15 }, // Ends, sometimes seeds
    { commodityName: "Apple", defaultWastagePercentage: 15 }, // Core, peel
    { commodityName: "Orange", defaultWastagePercentage: 50 }, // Peel, seed, rag
    { commodityName: "Kinoo", defaultWastagePercentage: 45 },
    { commodityName: "Sweet Lime", defaultWastagePercentage: 45 }, // Mosambi
    { commodityName: "Pineapple", defaultWastagePercentage: 45 }, // Crown, peel, core
    { commodityName: "Pomegranate", defaultWastagePercentage: 50 }, // Rind, membrane
    { commodityName: "Watermelon", defaultWastagePercentage: 45 }, // Rind, seeds
    { commodityName: "Muskmelon", defaultWastagePercentage: 35 }, // Rind, seeds
    { commodityName: "Grapes", defaultWastagePercentage: 10 }, // Stems
    { commodityName: "Litchi", defaultWastagePercentage: 45 }, // Peel, seed
    { commodityName: "Sapota", defaultWastagePercentage: 20 }, // Chikoo peel, seeds
    { commodityName: "Custard Apple", defaultWastagePercentage: 55 }, // Sitafal skin, seeds
    { commodityName: "Strawberry", defaultWastagePercentage: 5 }, // Calyx
    { commodityName: "Lemon", defaultWastagePercentage: 55 }, // Peel, seeds (if juicing)
    { commodityName: "Coconut", defaultWastagePercentage: 55 }, // Shell, husk
    { commodityName: "Coconut (Tender)", defaultWastagePercentage: 70 }, // Heavy husk
    { commodityName: "Amla", defaultWastagePercentage: 15 }, // Indian Gooseberry stone
    { commodityName: "Jackfruit", defaultWastagePercentage: 60 }, // Thick rind, rags
    { commodityName: "Plum", defaultWastagePercentage: 10 }, // Stone
    { commodityName: "Peach", defaultWastagePercentage: 15 }, // Stone, peel

    // Vegetables
    { commodityName: "Tomato", defaultWastagePercentage: 10 }, // Spoilage, ends, sometimes skin/seeds
    { commodityName: "Onion", defaultWastagePercentage: 15 }, // Skin, root/shoot
    { commodityName: "Garlic", defaultWastagePercentage: 20 }, // Skin, root, shriveled cloves
    { commodityName: "Potato", defaultWastagePercentage: 18 }, // Peel, eyes
    { commodityName: "Carrot", defaultWastagePercentage: 18 }, // Peel, crown, tip
    { commodityName: "Ginger", defaultWastagePercentage: 20 }, // Peeling, trimming, dirt
    { commodityName: "Cabbage", defaultWastagePercentage: 25 }, // Outer leaves, core
    { commodityName: "Cauliflower", defaultWastagePercentage: 50 }, // Outer leaves, core stem
    { commodityName: "Green Peas", defaultWastagePercentage: 55 }, // Pods (unshelled)
    { commodityName: "Green Peas (Peeled)", defaultWastagePercentage: 2 }, // Just sorting
    { commodityName: "Spinach", defaultWastagePercentage: 20 }, // Palak stems, roots, spoiled leaves
    { commodityName: "Okra", defaultWastagePercentage: 15 }, // Bhindi crown, tip
    { commodityName: "Bottle Gourd", defaultWastagePercentage: 20 }, // Lauki peel, ends
    { commodityName: "Bitter Gourd", defaultWastagePercentage: 15 }, // Karela ends, sometimes seeds
    { commodityName: "Brinjal", defaultWastagePercentage: 15 }, // Eggplant calyx/stem
    { commodityName: "Green Chilli", defaultWastagePercentage: 8 }, // Stem
    { commodityName: "Capsicum", defaultWastagePercentage: 20 }, // Bell pepper core, seeds, stem
    { commodityName: "Cucumber", defaultWastagePercentage: 20 }, // Ends, sometimes peel
    { commodityName: "Radish", defaultWastagePercentage: 25 }, // Mooli leaves, peel, root tip
    { commodityName: "Turnip", defaultWastagePercentage: 20 }, // Shalgam peel, ends
    { commodityName: "Beetroot", defaultWastagePercentage: 25 }, // Peel, crown, root
    { commodityName: "Pumpkin", defaultWastagePercentage: 30 }, // Rind, seeds, fibrous pulp
    { commodityName: "Ash Gourd", defaultWastagePercentage: 30 }, // Petha rind, seeds
    { commodityName: "Ridge Gourd", defaultWastagePercentage: 25 }, // Turai sharp ridges, ends
    { commodityName: "Sponge Gourd", defaultWastagePercentage: 20 }, // Nenua/Gilki peel, ends
    { commodityName: "Pointed Gourd", defaultWastagePercentage: 15 }, // Parwal ends, light scraping
    { commodityName: "Ivy Gourd", defaultWastagePercentage: 10 }, // Tindora ends
    { commodityName: "French Beans", defaultWastagePercentage: 10 }, // Ends, string
    { commodityName: "Cluster Beans", defaultWastagePercentage: 15 }, // Gavarfali ends
    { commodityName: "Drumstick", defaultWastagePercentage: 40 }, // Moringa thick peel/fibers
    { commodityName: "Sweet Potato", defaultWastagePercentage: 15 }, // Peel, ends
    { commodityName: "Yam", defaultWastagePercentage: 20 }, // Suran thick peel
    { commodityName: "Colocasia", defaultWastagePercentage: 25 }, // Arbi peel
    { commodityName: "Coriander Leaves", defaultWastagePercentage: 25 }, // Roots, thick yellow stems
    { commodityName: "Mint Leaves", defaultWastagePercentage: 35 }, // Thick stems
    { commodityName: "Fenugreek Leaves", defaultWastagePercentage: 40 }, // Methi hard stems, roots
    { commodityName: "Curry Leaves", defaultWastagePercentage: 30 }, // Stems
    { commodityName: "Mushroom", defaultWastagePercentage: 15 }, // Stem ends, dirt scraping

    // Spices & Others
    { commodityName: "Turmeric (Raw)", defaultWastagePercentage: 20 }, // Rhizome peeling, dirt
    { commodityName: "Tamarind", defaultWastagePercentage: 40 }, // Shell, seeds, fibers
    { commodityName: "Red Chilli (Dry)", defaultWastagePercentage: 5 }, // Stems
    { commodityName: "Cumin", defaultWastagePercentage: 2 }, // Cleaning/winnowing dirt
    { commodityName: "Coriander Seeds", defaultWastagePercentage: 3 }, // Cleaning
    { commodityName: "Peanut (In shell)", defaultWastagePercentage: 30 }, // Shells
    { commodityName: "Peanut (Kernel)", defaultWastagePercentage: 5 }, // Red skin (if blanched), sorting
    { commodityName: "Cashew (Raw)", defaultWastagePercentage: 75 }, // Shell, CNSL liquid, testa
    { commodityName: "Almond (In shell)", defaultWastagePercentage: 40 }, // Shell
    { commodityName: "Walnut (In shell)", defaultWastagePercentage: 50 }, // Shell
];

async function main() {
    console.log('🌱 Seeding Default Wastage Reference Table...');
    let added = 0;
    let updated = 0;

    for (const item of defaultWastages) {
        const existing = await prisma.defaultWastageReference.findUnique({
            where: { commodityName: item.commodityName }
        });

        if (existing) {
            if (existing.defaultWastagePercentage !== item.defaultWastagePercentage) {
                await prisma.defaultWastageReference.update({
                    where: { id: existing.id },
                    data: { defaultWastagePercentage: item.defaultWastagePercentage }
                });
                updated++;
            }
        } else {
            await prisma.defaultWastageReference.create({
                data: item
            });
            added++;
        }
    }

    console.log(`✅ Seed complete! Added: ${added}, Updated: ${updated}`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
