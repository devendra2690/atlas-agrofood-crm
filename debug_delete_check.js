
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log("Searching for a company with linked opportunities...");

    // Find a company that has at least one opportunity
    const company = await prisma.company.findFirst({
        where: {
            salesOpportunities: {
                some: {}
            }
        },
        include: {
            _count: {
                select: {
                    projectVendors: true,
                    purchaseOrders: true,
                    salesOrders: true,
                    salesOpportunities: true,
                    interactions: true,
                }
            },
            salesOpportunities: {
                select: { id: true, status: true }
            }
        }
    });

    if (!company) {
        console.log("No company with opportunities found in DB.");
        return;
    }

    console.log(`Found Company: ${company.name} (${company.id})`);
    console.log("Counts:", company._count);
    console.log("Opportunities:", company.salesOpportunities);

    if (company._count.salesOpportunities > 0) {
        console.log("SUCCESS: Prisma correctly reports > 0 opportunities.");
        console.log("The delete block logic SHOULD trigger.");
    } else {
        console.error("FAILURE: Prisma reports 0 opportunities but we found some via relation!");
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
