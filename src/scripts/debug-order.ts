
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
    console.log("Debugging latest order...");

    const order = await prisma.salesOrder.findFirst({
        orderBy: { createdAt: 'desc' },
        include: {
            opportunity: {
                include: {
                    procurementProject: true,
                    sampleSubmissions: {
                        where: { status: 'CLIENT_APPROVED' },
                        include: { sample: true }
                    }
                }
            }
        }
    });

    if (!order) {
        console.log("No order found.");
        return;
    }

    console.log(`Order ID: ${order.id}`);
    console.log(`Status: ${order.status}`);
    console.log(`Opportunity ID: ${order.opportunityId}`);
    console.log(`Procurement Project:`, order.opportunity.procurementProject);
    console.log(`Approved Submissions: ${order.opportunity.sampleSubmissions.length}`);
    if (order.opportunity.sampleSubmissions.length > 0) {
        console.log(`Sample ID: ${order.opportunity.sampleSubmissions[0].sampleId}`);
        console.log(`Sample Status: ${order.opportunity.sampleSubmissions[0].status}`);
    }

    if (order.status === 'IN_PROGRESS' && !order.opportunity.procurementProject) {
        console.log("CONDITION MET: Should have created PO.");
        if (order.opportunity.sampleSubmissions.length === 0) {
            console.log("BUT: No approved submission found.");
        }
    } else {
        console.log("CONDITION NOT MET.");
        if (order.status !== 'IN_PROGRESS') console.log("- Status not IN_PROGRESS");
        if (order.opportunity.procurementProject) console.log("- Project already exists");
    }
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
