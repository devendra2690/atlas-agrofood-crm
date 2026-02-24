import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    console.log('🌟 Adding Moringa Leaves to Database...');

    // We will upsert Moringa Leaves to run safely multiple times
    let moringa = await prisma.commodity.findFirst({
        where: { name: { equals: 'Moringa Leaves', mode: 'insensitive' } }
    });

    if (moringa) {
        moringa = await prisma.commodity.update({
            where: { id: moringa.id },
            data: {
                baseBatchElectricityUnits: 70,
                wastagePercentage: 10,
                category: 'Leafy'
            }
        });
        console.log(`✅ Updated existing Moringa Leaves: 70 units, 10% cleaning`);
    } else {
        moringa = await prisma.commodity.create({
            data: {
                name: 'Moringa Leaves',
                baseBatchElectricityUnits: 70,
                category: 'Leafy',
                wastagePercentage: 10,
                yieldPercentage: 100 // default placeholder
            }
        });
        console.log(`✅ Created Moringa Leaves: 70 units, 10% cleaning`);
    }

    // Now upsert the Powder form
    let powderForm = await prisma.varietyForm.findFirst({
        where: {
            commodityId: moringa.id,
            formName: { contains: 'Powder', mode: 'insensitive' }
        } as any
    });

    if (powderForm) {
        await prisma.varietyForm.update({
            where: { id: powderForm.id },
            data: {
                wastagePercentage: 35,
                yieldPercentage: 24
            }
        });
        console.log(`✅ Moringa Powder Form updated: 35% prep wastage, 24% yield.`);
    } else {
        await prisma.varietyForm.create({
            data: {
                commodityId: moringa.id,
                formName: 'Powder',
                wastagePercentage: 35,
                yieldPercentage: 24
            } as any
        });
        console.log(`✅ Moringa Powder Form created: 35% prep wastage, 24% yield.`);
    }
}

main().finally(() => prisma.$disconnect());
