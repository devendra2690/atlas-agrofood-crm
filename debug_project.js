
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const projectName = "Fulfillment: Banana Powder - Interaction Test Co 1769461309395";
    console.log(`Searching for project with name containing: "Banana Powder"`);

    const project = await prisma.procurementProject.findFirst({
        where: {
            name: {
                contains: "Banana Powder"
            }
        },
        include: {
            commodity: true,
            salesOpportunities: {
                include: {
                    commodity: true
                }
            }
        }
    });

    if (!project) {
        console.log("Project not found");
    } else {
        console.log("Project Found:", project.id);
        console.log("Project Commodity:", project.commodity);
        console.log("Linked Opportunities:", project.salesOpportunities.length);
        if (project.salesOpportunities.length > 0) {
            console.log("Opportunity 1 ID:", project.salesOpportunities[0].id);
            console.log("Opportunity 1 Commodity:", project.salesOpportunities[0].commodity);
            console.log("Opportunity 1 CommodityId:", project.salesOpportunities[0].commodityId);
        }
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
