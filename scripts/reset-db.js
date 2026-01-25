
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('Starting separate database reset...');

    try {
        // 1. Delete Financial Transactions (Leaves)
        console.log('Deleting Transactions...');
        await prisma.transaction.deleteMany({});

        // 2. Delete Logistics & Receipt Data
        console.log('Deleting Shipments & GRNs...');
        await prisma.shipment.deleteMany({});
        await prisma.gRN.deleteMany({});

        // 3. Delete Bills & Invoices
        console.log('Deleting Bills & Invoices...');
        await prisma.bill.deleteMany({});
        await prisma.invoice.deleteMany({});

        // 4. Delete Procurement Links
        console.log('Deleting Project Vendors & Sample Submissions...');
        // We need to delete Submissions before Opportunities/Samples
        await prisma.sampleSubmission.deleteMany({});
        await prisma.projectVendor.deleteMany({});

        // 5. Delete Purchase Orders (Must be before Samples if linked, though usually PO links to Sample)
        console.log('Deleting Purchase Orders...');
        // Note: If POs link to Samples, delete POs first.
        await prisma.purchaseOrder.deleteMany({});

        // 6. Delete Samples
        console.log('Deleting Samples...');
        await prisma.sampleRecord.deleteMany({});

        // 7. Delete Sales Orders
        console.log('Deleting Sales Orders...');
        await prisma.salesOrder.deleteMany({});

        // 8. Unlink Procurement Projects from Opportunities (Circular ref handling if strict modes)
        // Actually, Opportunities refer to Project. Project refers to nothing critical properly.
        // But let's be safe and delete Opportunities first? 
        // Wait, Opportunity -> ProcurementProject (FK on Opportunity).
        // So if we delete Project first, it might fail if Opportunity points to it.
        // So delete Opportunities first.
        console.log('Deleting Sales Opportunities...');
        await prisma.salesOpportunity.deleteMany({});

        // 9. Delete Procurement Projects
        console.log('Deleting Procurement Projects...');
        await prisma.procurementProject.deleteMany({});

        // 10. Delete Interaction Logs
        console.log('Deleting Interactions...');
        await prisma.interactionLog.deleteMany({});

        // 11. Delete Companies (Clients/Vendors)
        console.log('Deleting Companies...');
        await prisma.company.deleteMany({});

        // Optional: Delete Commodities/Products if they are considered "Transaction Data"
        // Usually these are setup data. User asked to "save settings".
        // I'll keep Commodities and Products as they might be tedious to re-enter.

        console.log('Database reset successfully. User accounts preserved.');

    } catch (error) {
        console.error('Error resetting database:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
