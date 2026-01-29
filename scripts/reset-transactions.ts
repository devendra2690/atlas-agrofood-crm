
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🗑️  Starting database reset (preserving Settings/Master Data)...');

    // 1. Transactions & Finance
    await prisma.transaction.deleteMany({});
    await prisma.bill.deleteMany({});
    await prisma.invoice.deleteMany({});
    console.log('✅ Finance data cleared');

    // 2. Logistics
    await prisma.shipment.deleteMany({});
    await prisma.gRN.deleteMany({});
    console.log('✅ Logistics data cleared');

    // 3. Purchase Orders (Delete POs before Samples/Projects)
    await prisma.purchaseOrder.deleteMany({});
    console.log('✅ Purchase Orders cleared');

    // 4. Sample Submissions (Link between Sample and Opportunity)
    await prisma.sampleSubmission.deleteMany({});

    // 5. Sales Orders (Depend on Opportunities)
    await prisma.salesOrder.deleteMany({});

    // 6. Sales Opportunities
    await prisma.salesOpportunity.deleteMany({});
    console.log('✅ Sales data cleared');

    // 7. Project Vendors (Many-to-Many link)
    await prisma.projectVendor.deleteMany({});

    // 8. Samples
    await prisma.sampleRecord.deleteMany({});

    // 9. Procurement Projects
    await prisma.procurementProject.deleteMany({});
    console.log('✅ Procurement data cleared');

    // 10. Logs & Todos
    await prisma.activityLog.deleteMany({});
    await prisma.interactionLog.deleteMany({});
    await prisma.todo.deleteMany({});
    console.log('✅ Logs & Todos cleared');

    // 11. Companies (Vendors/Clients)
    await prisma.company.deleteMany({});
    console.log('✅ Companies & Vendors cleared');

    console.log('✨ Database reset complete! Users and Commodities preserved.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
