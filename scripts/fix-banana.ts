import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    console.log('🌟 Archiving Banana Clones & Deploying Math Fix...');

    // 1. We cannot delete "Bananan" because it has Sales Opportunity history.
    // Instead, we will archive it so it stops confusing the system.
    const bananan = await prisma.commodity.findFirst({
        where: { name: 'Bananan' }
    });
    if (bananan) {
        await prisma.commodity.update({
            where: { id: bananan.id },
            data: { name: 'Banana (Archived)' }
        });
        console.log('📦 Archived "Bananan" to preserve Sales Order history.');
    }

    // 2. Fetch the real "Banana" directly
    const banana = await prisma.commodity.findFirst({
        where: { name: 'Banana' }
    });

    if (!banana) {
        console.log('❌ "Banana" not found!');
        return;
    }

    // 3. Apply Master Configuration to base Banana
    await prisma.commodity.update({
        where: { id: banana.id },
        data: {
            baseBatchElectricityUnits: 220,
            wastagePercentage: 5
        }
    });
    console.log(`✅ Base Banana updated: 220 Units, 5% cleaning.`);

    // 4. Update the Powder form
    const powderForm = await prisma.varietyForm.findFirst({
        where: { commodityId: banana.id, formName: { contains: 'Powder', mode: 'insensitive' } } as any
    });

    if (powderForm) {
        await prisma.varietyForm.update({
            where: { id: powderForm.id },
            data: {
                wastagePercentage: 38,
                yieldPercentage: 22
            }
        });
        console.log(`✅ Banana Powder Form updated: 38% prep wastage, 22% yield.`);
    } else {
        console.log('❌ Banana Powder form not found.');
    }
}

main().finally(() => prisma.$disconnect());
