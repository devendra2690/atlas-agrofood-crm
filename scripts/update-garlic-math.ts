import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    console.log('🧄 Connecting to database to update Garlic math...');
    
    // 1. Update Base Commodity
    const garlic = await prisma.commodity.findFirst({
        where: { name: { contains: 'Garlic', mode: 'insensitive' } }
    });

    if (!garlic) {
        console.log("Garlic not found in DB.");
        return;
    }

    await prisma.commodity.update({
        where: { id: garlic.id },
        data: { 
            wastagePercentage: 2, // 2% Cleaning Wastage
            baseBatchElectricityUnits: 115
        }
    });

    console.log('Updated Garlic Base: Wastage=2%, BaseUnits=115');

    // 2. Update Powder Form
    const powderForm = await prisma.varietyForm.findFirst({
        where: { 
            commodityId: garlic.id, 
            formName: { contains: 'Powder', mode: 'insensitive' } 
        }
    });

    if (powderForm) {
        await prisma.varietyForm.update({
            where: { id: powderForm.id },
            data: {
                wastagePercentage: 15, // 15% Peeling/Husk Wastage
                yieldPercentage: 19    // 19% Dehydration Yield
            }
        });
        console.log('Updated Garlic Powder Form: Wastage=15%, Yield=19%');
    } else {
        console.log("Powder form not found for Garlic.");
    }
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
