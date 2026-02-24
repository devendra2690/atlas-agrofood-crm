import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Helper to calc base yield
const calcBaseYield = (wastage: number) => 100 - wastage;

const commoditiesRaw = [
    // FRUITS
    {
        name: "Mango",
        baseWastage: 40,
        forms: [
            { formName: "Pulp", yield: 55, wastage: 40 },
            { formName: "IQF Dices", yield: 45, wastage: 45 },
            { formName: "Powder (Amchur)", yield: 18, wastage: 40 },
            { formName: "Dehydrated Slices", yield: 15, wastage: 40 }
        ]
    },
    {
        name: "Banana",
        baseWastage: 35,
        forms: [
            { formName: "Puree", yield: 60, wastage: 35 },
            { formName: "Powder", yield: 20, wastage: 35 },
            { formName: "Chips (Fried)", yield: 25, wastage: 35 }
        ]
    },
    {
        name: "Papaya",
        baseWastage: 30,
        forms: [
            { formName: "Puree/Pulp", yield: 65, wastage: 30 },
            { formName: "Tutti Frutti (Candied)", yield: 45, wastage: 35 },
            { formName: "IQF Dices", yield: 60, wastage: 35 }
        ]
    },
    {
        name: "Guava",
        baseWastage: 15,
        forms: [
            { formName: "Pulp (White)", yield: 80, wastage: 15 },
            { formName: "Pulp (Pink)", yield: 80, wastage: 15 },
            { formName: "Juice Concentrate", yield: 18, wastage: 15 }
        ]
    },
    {
        name: "Apple",
        baseWastage: 15,
        forms: [
            { formName: "Juice Concentrate", yield: 15, wastage: 15 },
            { formName: "Dehydrated Rings", yield: 12, wastage: 15 },
            { formName: "Puree", yield: 80, wastage: 15 }
        ]
    },
    {
        name: "Orange",
        baseWastage: 50,
        forms: [
            { formName: "Juice Concentrate", yield: 12, wastage: 55 },
            { formName: "Peel Extract / Oil", yield: 2, wastage: 90 }
        ]
    },
    {
        name: "Kinoo",
        baseWastage: 45,
        forms: [
            { formName: "Juice", yield: 45, wastage: 50 }
        ]
    },
    {
        name: "Sweet Lime",
        baseWastage: 45,
        forms: [
            { formName: "Juice", yield: 45, wastage: 50 }
        ]
    },
    {
        name: "Pineapple",
        baseWastage: 45,
        forms: [
            { formName: "Slices (Canned)", yield: 40, wastage: 50 },
            { formName: "Juice Concentrate", yield: 10, wastage: 45 },
            { formName: "IQF Tidbits", yield: 45, wastage: 50 }
        ]
    },
    {
        name: "Pomegranate",
        baseWastage: 50,
        forms: [
            { formName: "Arils (Fresh)", yield: 45, wastage: 50 },
            { formName: "Juice Concentrate", yield: 10, wastage: 55 },
            { formName: "Anardana (Dried)", yield: 15, wastage: 50 }
        ]
    },
    {
        name: "Watermelon",
        baseWastage: 45,
        forms: [
            { formName: "Juice", yield: 50, wastage: 45 }
        ]
    },
    {
        name: "Muskmelon",
        baseWastage: 35,
        forms: [
            { formName: "Pulp", yield: 60, wastage: 35 }
        ]
    },
    {
        name: "Grapes",
        baseWastage: 10,
        forms: [
            { formName: "Raisins", yield: 25, wastage: 15 },
            { formName: "Juice", yield: 75, wastage: 15 }
        ]
    },
    {
        name: "Litchi",
        baseWastage: 45,
        forms: [
            { formName: "Pulp", yield: 50, wastage: 45 },
            { formName: "Juice", yield: 45, wastage: 45 }
        ]
    },
    {
        name: "Sapota",
        baseWastage: 20,
        forms: [
            { formName: "Pulp", yield: 75, wastage: 20 }
        ]
    },
    {
        name: "Custard Apple",
        baseWastage: 55,
        forms: [
            { formName: "Pulp (De-seeded)", yield: 40, wastage: 55 }
        ]
    },
    {
        name: "Strawberry",
        baseWastage: 5,
        forms: [
            { formName: "IQF Whole", yield: 90, wastage: 5 },
            { formName: "Puree", yield: 92, wastage: 5 }
        ]
    },
    {
        name: "Lemon",
        baseWastage: 55,
        forms: [
            { formName: "Juice", yield: 40, wastage: 60 },
            { formName: "Peel Powder", yield: 15, wastage: 5 }
        ]
    },
    {
        name: "Coconut",
        baseWastage: 55,
        forms: [
            { formName: "Desiccated Powder", yield: 25, wastage: 60 },
            { formName: "Milk", yield: 40, wastage: 55 },
            { formName: "Virgin Oil", yield: 12, wastage: 60 }
        ]
    },
    {
        name: "Coconut (Tender)",
        baseWastage: 70,
        forms: [
            { formName: "Water", yield: 20, wastage: 75 },
            { formName: "Malai/Meat", yield: 5, wastage: 75 }
        ]
    },
    {
        name: "Amla",
        baseWastage: 15,
        forms: [
            { formName: "Juice", yield: 65, wastage: 20 },
            { formName: "Powder", yield: 15, wastage: 15 },
            { formName: "Candy/Murabba", yield: 75, wastage: 15 }
        ]
    },
    {
        name: "Jackfruit",
        baseWastage: 60,
        forms: [
            { formName: "Raw/Tender Canned", yield: 30, wastage: 65 },
            { formName: "Ripe Bulbs", yield: 35, wastage: 60 }
        ]
    },
    {
        name: "Plum",
        baseWastage: 10,
        forms: [
            { formName: "Puree", yield: 85, wastage: 12 }
        ]
    },
    {
        name: "Peach",
        baseWastage: 15,
        forms: [
            { formName: "Halves (Canned)", yield: 75, wastage: 20 },
            { formName: "Puree", yield: 80, wastage: 15 }
        ]
    },

    // VEGETABLES
    {
        name: "Tomato",
        baseWastage: 10,
        forms: [
            { formName: "Paste (28 Brix)", yield: 16, wastage: 12 },
            { formName: "Puree", yield: 40, wastage: 10 },
            { formName: "Powder", yield: 5, wastage: 10 },
            { formName: "Sun-Dried / Dehydrated", yield: 6, wastage: 10 }
        ]
    },
    {
        name: "Onion",
        baseWastage: 2, // 2% cleaning wastage
        forms: [
            { formName: "Dehydrated Flakes/Kibbled", yield: 10, wastage: 18 },
            { formName: "Powder", yield: 11, wastage: 18 }, // 18% peeling wastage, 11% yield
            { formName: "Minced", yield: 9, wastage: 18 },
            { formName: "Paste", yield: 80, wastage: 18 },
            { formName: "Fried (Birista)", yield: 25, wastage: 18 }
        ]
    },
    {
        name: "Garlic",
        baseWastage: 2,
        forms: [
            { formName: "Dehydrated Flakes", yield: 20, wastage: 15 },
            { formName: "Powder", yield: 19, wastage: 15 },
            { formName: "Paste", yield: 75, wastage: 15 },
            { formName: "Peeled Cloves", yield: 78, wastage: 15 }
        ]
    },
    {
        name: "Potato",
        baseWastage: 18,
        forms: [
            { formName: "Flakes/Powder", yield: 16, wastage: 18 },
            { formName: "IQF Fries/Wedges", yield: 60, wastage: 22 },
            { formName: "Starch", yield: 14, wastage: 18 }
        ]
    },
    {
        name: "Carrot",
        baseWastage: 18,
        forms: [
            { formName: "Powder", yield: 9, wastage: 18 },
            { formName: "IQF Dices", yield: 80, wastage: 20 },
            { formName: "Juice Concentrate", yield: 12, wastage: 18 }
        ]
    },
    {
        name: "Ginger",
        baseWastage: 5,
        forms: [
            { formName: "Powder (Dry Ginger/Saunth)", yield: 20, wastage: 12 },
            { formName: "Paste", yield: 75, wastage: 20 },
            { formName: "Dehydrated Flakes", yield: 18, wastage: 20 }
        ]
    },
    {
        name: "Cabbage",
        baseWastage: 25,
        forms: [
            { formName: "Dehydrated Flakes", yield: 7, wastage: 25 },
            { formName: "Powder", yield: 6, wastage: 25 }
        ]
    },
    {
        name: "Cauliflower",
        baseWastage: 50,
        forms: [
            { formName: "IQF Florets", yield: 45, wastage: 55 },
            { formName: "Rice (Minced)", yield: 45, wastage: 55 }
        ]
    },
    {
        name: "Green Peas",
        baseWastage: 55, // in pod
        forms: [
            { formName: "IQF Green Peas", yield: 40, wastage: 60 },
            { formName: "Dehydrated Peas", yield: 15, wastage: 55 }
        ]
    },
    {
        name: "Green Peas (Peeled)",
        baseWastage: 2,
        forms: [
            { formName: "IQF", yield: 95, wastage: 5 },
            { formName: "Dehydrated", yield: 20, wastage: 5 }
        ]
    },
    {
        name: "Spinach",
        baseWastage: 20,
        forms: [
            { formName: "Powder", yield: 8, wastage: 20 },
            { formName: "Dehydrated Flakes", yield: 9, wastage: 20 },
            { formName: "Puree", yield: 75, wastage: 25 },
            { formName: "IQF Blocks", yield: 75, wastage: 20 }
        ]
    },
    {
        name: "Okra",
        baseWastage: 15,
        forms: [
            { formName: "IQF Cut", yield: 80, wastage: 15 },
            { formName: "Dehydrated", yield: 12, wastage: 15 }
        ]
    },
    {
        name: "Bottle Gourd",
        baseWastage: 20,
        forms: [
            { formName: "Juice", yield: 65, wastage: 20 }
        ]
    },
    {
        name: "Bitter Gourd",
        baseWastage: 15,
        forms: [
            { formName: "Dehydrated Rings", yield: 12, wastage: 15 },
            { formName: "Juice", yield: 60, wastage: 20 },
            { formName: "Powder", yield: 10, wastage: 15 }
        ]
    },
    {
        name: "Brinjal",
        baseWastage: 15,
        forms: [
            { formName: "Roasted/Mashed (Bharta)", yield: 60, wastage: 20 }
        ]
    },
    {
        name: "Green Chilli",
        baseWastage: 8,
        forms: [
            { formName: "Paste", yield: 85, wastage: 10 },
            { formName: "Powder", yield: 15, wastage: 10 },
            { formName: "Pickle/Brine", yield: 90, wastage: 10 }
        ]
    },
    {
        name: "Capsicum",
        baseWastage: 20,
        forms: [
            { formName: "IQF Dices", yield: 75, wastage: 25 },
            { formName: "Dehydrated Flakes", yield: 8, wastage: 20 }
        ]
    },
    {
        name: "Cucumber",
        baseWastage: 20,
        forms: [
            { formName: "Pickled/Gherkins", yield: 85, wastage: 15 }
        ]
    },
    {
        name: "Radish",
        baseWastage: 25,
        forms: [
            { formName: "Shredded / Pickled", yield: 70, wastage: 25 }
        ]
    },
    {
        name: "Turnip",
        baseWastage: 20,
        forms: []
    },
    {
        name: "Beetroot",
        baseWastage: 25,
        forms: [
            { formName: "Powder", yield: 12, wastage: 25 },
            { formName: "Juice Concentrate", yield: 15, wastage: 25 },
            { formName: "IQF Dices", yield: 70, wastage: 25 }
        ]
    },
    {
        name: "Pumpkin",
        baseWastage: 30,
        forms: [
            { formName: "Puree", yield: 65, wastage: 30 },
            { formName: "Powder", yield: 10, wastage: 30 }
        ]
    },
    {
        name: "Ash Gourd",
        baseWastage: 30,
        forms: [
            { formName: "Candy (Petha)", yield: 55, wastage: 35 }
        ]
    },
    {
        name: "Ridge Gourd",
        baseWastage: 25,
        forms: []
    },
    {
        name: "Sponge Gourd",
        baseWastage: 20,
        forms: []
    },
    {
        name: "Pointed Gourd",
        baseWastage: 15,
        forms: []
    },
    {
        name: "Ivy Gourd",
        baseWastage: 10,
        forms: []
    },
    {
        name: "French Beans",
        baseWastage: 10,
        forms: [
            { formName: "IQF Cut", yield: 85, wastage: 12 },
            { formName: "Dehydrated", yield: 12, wastage: 12 }
        ]
    },
    {
        name: "Cluster Beans",
        baseWastage: 15,
        forms: [
            { formName: "Guar Gum (Powder)", yield: 28, wastage: 15 },
            { formName: "Dehydrated Clusters", yield: 18, wastage: 15 }
        ]
    },
    {
        name: "Drumstick",
        baseWastage: 40,
        forms: [
            { formName: "Scraped Pulp", yield: 25, wastage: 70 },
            { formName: "Leaf Powder (Moringa)", yield: 15, wastage: 10 }
        ]
    },
    {
        name: "Moringa Leaves",
        baseWastage: 10,
        forms: [
            { formName: "Powder", yield: 24, wastage: 35 }
        ]
    },
    {
        name: "Sweet Potato",
        baseWastage: 15,
        forms: [
            { formName: "Flakes/Powder", yield: 20, wastage: 15 },
            { formName: "Fries", yield: 75, wastage: 20 }
        ]
    },
    {
        name: "Yam",
        baseWastage: 20,
        forms: [
            { formName: "Powder", yield: 22, wastage: 20 },
            { formName: "Chips", yield: 25, wastage: 20 }
        ]
    },
    {
        name: "Colocasia",
        baseWastage: 25,
        forms: []
    },
    {
        name: "Coriander Leaves",
        baseWastage: 25,
        forms: [
            { formName: "Dehydrated Leaves", yield: 6, wastage: 25 },
            { formName: "Powder", yield: 5, wastage: 25 },
            { formName: "Paste", yield: 65, wastage: 30 }
        ]
    },
    {
        name: "Mint Leaves",
        baseWastage: 35,
        forms: [
            { formName: "Dehydrated Leaves", yield: 8, wastage: 35 },
            { formName: "Powder", yield: 7, wastage: 35 },
            { formName: "Paste", yield: 60, wastage: 35 }
        ]
    },
    {
        name: "Fenugreek Leaves",
        baseWastage: 40,
        forms: [
            { formName: "Kasuri Methi (Dehydrated)", yield: 8, wastage: 40 }
        ]
    },
    {
        name: "Curry Leaves",
        baseWastage: 30,
        forms: [
            { formName: "Dehydrated", yield: 10, wastage: 30 },
            { formName: "Powder", yield: 8, wastage: 30 }
        ]
    },
    {
        name: "Mushroom",
        baseWastage: 15,
        forms: [
            { formName: "Dehydrated Slices", yield: 10, wastage: 15 },
            { formName: "Powder", yield: 8, wastage: 15 },
            { formName: "IQF Sliced", yield: 80, wastage: 20 }
        ]
    },

    // SPICES & NUTS
    {
        name: "Turmeric (Raw)",
        baseWastage: 20,
        forms: [
            { formName: "Powder", yield: 18, wastage: 22 },
            { formName: "Polished Fingers", yield: 22, wastage: 20 }
        ]
    },
    {
        name: "Tamarind",
        baseWastage: 40,
        forms: [
            { formName: "Paste/Concentrate", yield: 45, wastage: 45 }
        ]
    },
    {
        name: "Red Chilli (Dry)",
        baseWastage: 5,
        forms: [
            { formName: "Stemless", yield: 92, wastage: 8 },
            { formName: "Powder", yield: 90, wastage: 10 },
            { formName: "Crushed/Flakes", yield: 90, wastage: 10 }
        ]
    },
    {
        name: "Cumin",
        baseWastage: 2,
        forms: [
            { formName: "Powder", yield: 95, wastage: 4 }
        ]
    },
    {
        name: "Coriander Seeds",
        baseWastage: 3,
        forms: [
            { formName: "Powder", yield: 94, wastage: 5 }
        ]
    },
    {
        name: "Peanut (In shell)",
        baseWastage: 30,
        forms: [
            { formName: "Kernels", yield: 70, wastage: 30 }
        ]
    },
    {
        name: "Peanut (Kernel)",
        baseWastage: 5,
        forms: [
            { formName: "Roasted & Blanched", yield: 90, wastage: 10 },
            { formName: "Peanut Butter", yield: 88, wastage: 12 }
        ]
    },
    {
        name: "Cashew (Raw)",
        baseWastage: 75,
        forms: [
            { formName: "Kernels", yield: 25, wastage: 75 },
            { formName: "Broken Kernels (LWP/SWP)", yield: 25, wastage: 75 }
        ]
    },
    {
        name: "Almond (In shell)",
        baseWastage: 40,
        forms: [
            { formName: "Kernels", yield: 60, wastage: 40 }
        ]
    },
    {
        name: "Walnut (In shell)",
        baseWastage: 50,
        forms: [
            { formName: "Kernels", yield: 50, wastage: 50 }
        ]
    }
];


async function main() {
    console.log('🌱 Seeding Full Commodity Catalog (Base + Forms)...');

    let commCount = 0;
    let formCount = 0;

    for (const item of commoditiesRaw) {
        const baseYield = calcBaseYield(item.baseWastage);

        // 1. Upsert the Base Commodity
        const commodity = await prisma.commodity.upsert({
            where: { name: item.name },
            update: {
                yieldPercentage: baseYield,
                wastagePercentage: item.baseWastage
            },
            create: {
                name: item.name,
                yieldPercentage: baseYield,
                wastagePercentage: item.baseWastage
            }
        });

        commCount++;

        // 2. Upsert the associated Forms
        for (const form of item.forms) {
            // Find existing
            const existingForm = await prisma.varietyForm.findFirst({
                where: {
                    commodityId: commodity.id,
                    formName: form.formName
                } as any
            });

            if (existingForm) {
                await prisma.varietyForm.update({
                    where: { id: existingForm.id },
                    data: {
                        yieldPercentage: form.yield,
                        wastagePercentage: form.wastage
                    }
                });
            } else {
                await prisma.varietyForm.create({
                    data: {
                        commodityId: commodity.id,
                        formName: form.formName,
                        yieldPercentage: form.yield,
                        wastagePercentage: form.wastage
                    } as any // Bypass strict TS checks for seed script
                });
                formCount++;
            }
        }
    }

    console.log(`✅ Commodity Seed Complete!`);
    console.log(`📈 Upserted ${commCount} Base Commodities.`);
    console.log(`📈 Added/Updated ${formCount} Form-level variations.`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
