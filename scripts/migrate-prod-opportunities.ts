import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log("Starting SalesOpportunity Data Migration...");

    // 1. Fetch all Opportunities that still have legacy item data but NO items in the new array
    // Note: We cast entirely to any because Prisma's generated types might not have legacy fields perfectly mapped yet if they haven't generated, 
    // but the DB schema definitely has them.
    const opportunities = await prisma.salesOpportunity.findMany({
        where: {
            legacyCommodityId: { not: null }, // Only migrate those that actually had a commodity attached
            items: { none: {} } // Only migrate if we haven't already migrated it
        },
        include: {
            items: true
        }
    });

    console.log(`Found ${opportunities.length} legacy opportunities to migrate.`);

    if (opportunities.length === 0) {
        console.log("No migration needed! Everything is up to date.");
        return;
    }

    let successCount = 0;
    let failCount = 0;

    for (const opp of opportunities) {
        try {
            // Because older records might have missing names, provide fallbacks
            const productName = opp.legacyProductName || 'Migrated Item';
            const commodityId = opp.legacyCommodityId!; // We filtered for not-null above

            console.log(`Migrating Opp ${opp.id} -> Creating 1 Item (${productName})`);

            await prisma.salesOpportunityItem.create({
                data: {
                    opportunityId: opp.id,
                    productName: productName,
                    targetPrice: opp.legacyTargetPrice,
                    priceType: opp.legacyPriceType || 'PER_KG',
                    quantity: opp.legacyQuantity,
                    procurementQuantity: opp.legacyProcurementQuantity,
                    commodityId: commodityId,
                    varietyId: opp.legacyVarietyId,
                    varietyFormId: opp.legacyVarietyFormId,
                }
            });

            successCount++;
        } catch (error) {
            console.error(`Failed to migrate Opportunity ${opp.id}:`, error);
            failCount++;
        }
    }

    console.log("=====================================");
    console.log("Migration Complete!");
    console.log(`Successfully Migrated: ${successCount}`);
    console.log(`Failed / Skipped: ${failCount}`);
    console.log("=====================================");
    console.log("You may now safely delete the legacy fields from schema.prisma and push again if desired.");
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
