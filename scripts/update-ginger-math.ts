import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    console.log('🫚 Connecting to database to update Ginger math...');
    
    const ginger = await prisma.commodity.findFirst({
        where: { name: { contains: 'Ginger', mode: 'insensitive' } }
    });

    if (!ginger) {
        console.log("Ginger not found in DB.");
        return;
    }

    // Update Base Wastage to exactly 5% and base units to 150
    await prisma.commodity.update({
        where: { id: ginger.id },
        data: { 
            wastagePercentage: 5,
            baseBatchElectricityUnits: 150
        }
    });

    console.log('Updated Ginger Base: Wastage=5%, BaseUnits=150');

    // Update the Powder Form specifically
    const powderForm = await prisma.varietyForm.findFirst({
        where: { 
            commodityId: ginger.id, 
            formName: { contains: 'Powder', mode: 'insensitive' } 
        }
    });

    if (powderForm) {
        await prisma.varietyForm.update({
            where: { id: powderForm.id },
            data: {
                wastagePercentage: 12,
                yieldPercentage: 20
            }
        });
        console.log('Updated Ginger Powder Form: Wastage=12%, Yield=20%');
    } else {
        console.log("Powder form not found for Ginger.");
    }
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
