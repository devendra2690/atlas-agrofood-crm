import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    console.log('🌟 Starting Database Cleanup...');

    // 1. Delete all transactional, operational, and historical records
    // We execute sequentially from the bottom-up (children before parents) to avoid foreign key errors.
    console.log('🗑️ Purging financial transactions...');
    await prisma.transaction.deleteMany({});
    await prisma.bill.deleteMany({});
    await prisma.invoice.deleteMany({});

    console.log('🗑️ Purging logistics and inventory...');
    await prisma.shipment.deleteMany({});
    if ('gRN' in prisma) await (prisma as any).gRN.deleteMany({}); // Optional catch if GRN exists
    if ('inventoryItem' in prisma) await (prisma as any).inventoryItem.deleteMany({});

    console.log('🗑️ Purging orders...');
    await prisma.purchaseOrder.deleteMany({});
    await prisma.salesOrder.deleteMany({});

    console.log('🗑️ Purging procurement workflows...');
    await prisma.sampleSubmission.deleteMany({});
    await prisma.sampleRecord.deleteMany({});
    await prisma.projectVendor.deleteMany({});
    await prisma.procurementProject.deleteMany({});

    console.log('🗑️ Purging sales pipelines...');
    await prisma.salesOpportunityItem.deleteMany({});
    await prisma.salesOpportunity.deleteMany({});
    await prisma.interactionLog.deleteMany({});

    console.log('✅ All operational data successfully wiped.');
    console.log('🔒 Master Configuration data (Companies, Commodities, Users) kept intact.');

    // 2. Erase the Ghost Banana Clone
    console.log('🍌 Searching for Banana (Archived) ghost record...');
    const archivedBanana = await prisma.commodity.findFirst({
        where: { name: 'Banana (Archived)' }
    });

    if (archivedBanana) {
        // Because the sales history is now gone, we can safely delete its configuration variants without cascading constraint failures on SalesOpportunityItem
        // Delete child relationships first to satisfy internal configuration foreign key constraints
        await prisma.varietyForm.deleteMany({ where: { commodityId: archivedBanana.id } as any });

        const varieties = await prisma.commodityVariety.findMany({ where: { commodityId: archivedBanana.id } });
        for (const v of varieties) {
            await prisma.varietyForm.deleteMany({ where: { varietyId: v.id } as any });
        }
        await prisma.commodityVariety.deleteMany({ where: { commodityId: archivedBanana.id } });

        // Finally delete the base commodity itself
        await prisma.commodity.delete({ where: { id: archivedBanana.id } });
        console.log('✅ Deleted "Banana (Archived)" commodity completely from configuration.');
    } else {
        console.log('⚠️ "Banana (Archived)" not found in DB.');
    }

    console.log('🚀 Database Optimization Complete.');
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
