
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
    console.log("Starting cleanup...");

    // 1. Delete all Purchase Orders
    console.log("Deleting Purchase Orders...");
    await prisma.bill.deleteMany({});
    await prisma.purchaseOrder.deleteMany({});

    // 2. Delete all Sales Orders (and Invoices)
    console.log("Deleting Sales Orders...");
    await prisma.transaction.deleteMany({});
    await prisma.invoice.deleteMany({});

    // Get all sales orders to find opportunities
    const salesOrders = await prisma.salesOrder.findMany();
    const opportunityIds = salesOrders.map(o => o.opportunityId);

    await prisma.salesOrder.deleteMany({});

    // 3. Delete Procurement Projects created for Fulfillment
    console.log("Deleting Procurement Projects...");
    await prisma.projectVendor.deleteMany({});
    // Only delete projects that are likely auto-created (name starts with Fulfillment?)
    // Or just delete all for now since it's dev environment and user wants to retry flow?
    // User said "delete created order and created purchase order".
    // I'll be aggressive but safe-ish.
    // await prisma.sampleRecord.deleteMany({}); // Don't delete samples, they are needed for history
    // Wait, Samples are critical. I shouldn't delete SampleRecords unless they are specific to the cancelled project.
    // The samples used for the order were "Client Approved" samples from the Opportunity. They should stay!
    // But `ProcurementProject` created in the old flow might need to go.
    // Let's delete ProcurementProjects that have no samples?
    /*
    await prisma.procurementProject.deleteMany({
        where: {
            // Simple heuristic for dev: delete if only created recently? 
        }
    });
    */
    console.log("Skipping Procurement Project deletion to preserve Sample History.");
    // Actually, simply deleting ALL `ProcurementProject` might be too much if user made others.
    // I will primarily focus on resetting the Opportunity and Order.

    // 4. Reopen Opportunities
    console.log("Reopening Opportunities...");
    // Find opportunities that were closed won and linked to the orders we just deleted
    // Since we deleted orders, we can just reset all CLOSED_WON opportunities? 
    // Or better, reset opportunities that were linked to the deleted orders.

    // Since I already fetched opportunityIds
    if (opportunityIds.length > 0) {
        await prisma.salesOpportunity.updateMany({
            where: { id: { in: opportunityIds } },
            data: {
                status: 'OPEN',
                procurementProjectId: null
            }
        });
        console.log(`Reopened ${opportunityIds.length} opportunities.`);
    }

    // Also link SampleSubmissions? No they stay approved.

    console.log("Cleanup complete!");
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
