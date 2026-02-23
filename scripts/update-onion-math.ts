import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    console.log('🧅 Connecting to database to update Onion math...');
    
    const onion = await prisma.commodity.findFirst({
        where: { name: { contains: 'Onion', mode: 'insensitive' } }
    });

    if (!onion) {
        console.log("Onion not found in DB.");
        return;
    }

    // Update Base Wastage to exactly 2% and base units to 130
    await prisma.commodity.update({
        where: { id: onion.id },
        data: { 
            wastagePercentage: 2,
            baseBatchElectricityUnits: 130
        }
    });

    console.log('Updated Onion Base: Wastage=2%, BaseUnits=130');

    // Update the Powder Form specifically
    const powderForm = await prisma.varietyForm.findFirst({
        where: { 
            commodityId: onion.id, 
            formName: { contains: 'Powder', mode: 'insensitive' } 
        }
    });

    if (powderForm) {
        await prisma.varietyForm.update({
            where: { id: powderForm.id },
            data: {
                wastagePercentage: 18,
                yieldPercentage: 11
            }
        });
        console.log('Updated Onion Powder Form: Wastage=18%, Yield=11%');
    } else {
        console.log("Powder form not found for Onion.");
    }
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
