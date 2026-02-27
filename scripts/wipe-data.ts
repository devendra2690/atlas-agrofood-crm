import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    console.log('🌟 Starting Database Cleanup...');

    // We execute sequentially from the bottom-up (children before parents) to avoid foreign key errors.

    console.log('🗑️ Purging Activities and Notifications...');
    await prisma.activityLog.deleteMany({});
    await prisma.notification.deleteMany({});
    if ('emailLog' in prisma) await (prisma as any).emailLog.deleteMany({});
    if ('noteReply' in prisma) await (prisma as any).noteReply.deleteMany({});
    if ('todo' in prisma) await (prisma as any).todo.deleteMany({});

    console.log('🗑️ Purging Splitwise Expenses...');
    if ('expenseSplit' in prisma) await (prisma as any).expenseSplit.deleteMany({});
    if ('expenseSettlement' in prisma) await (prisma as any).expenseSettlement.deleteMany({});
    if ('expense' in prisma) await (prisma as any).expense.deleteMany({});

    console.log('🗑️ Purging financial transactions...');
    await prisma.transaction.deleteMany({});
    await prisma.bill.deleteMany({});
    await prisma.invoice.deleteMany({});

    console.log('🗑️ Purging logistics and inventory...');
    await prisma.shipment.deleteMany({});
    if ('gRN' in prisma) await (prisma as any).gRN.deleteMany({});

    console.log('🗑️ Purging orders...');
    if ('purchaseOrderItem' in prisma) await (prisma as any).purchaseOrderItem.deleteMany({});
    await prisma.purchaseOrder.deleteMany({});
    if ('salesOrderItem' in prisma) await (prisma as any).salesOrderItem.deleteMany({});
    await prisma.salesOrder.deleteMany({});

    console.log('🗑️ Purging procurement workflows...');
    await prisma.sampleSubmission.deleteMany({});
    await prisma.sampleRecord.deleteMany({});
    await prisma.projectVendor.deleteMany({});
    await prisma.procurementProject.deleteMany({});
    if ('sourcingRequest' in prisma) await (prisma as any).sourcingRequest.deleteMany({});

    console.log('🗑️ Purging sales pipelines...');
    await prisma.salesOpportunityItem.deleteMany({});
    await prisma.salesOpportunity.deleteMany({});
    await prisma.interactionLog.deleteMany({});

    console.log('✅ All operational data successfully wiped.');
    console.log('🔒 Master Configuration data (Companies, Commodities, Users) kept intact.');
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
