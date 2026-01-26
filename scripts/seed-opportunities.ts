import { PrismaClient, CompanyType, OpportunityStatus, TrustLevel, OpportunityPriceType } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Starting seed...');

    // 1. Create Commodities
    const commodities = [
        { name: 'Banana Powder', yieldPercentage: 25.0 },
        { name: 'Mango Pulp', yieldPercentage: 60.0 },
        { name: 'Tomato Paste', yieldPercentage: 15.0 },
    ];

    const createdCommodities = [];
    for (const c of commodities) {
        const upserted = await prisma.commodity.upsert({
            where: { name: c.name },
            update: {},
            create: c,
        });
        createdCommodities.push(upserted);
        console.log(`Upserted commodity: ${c.name}`);
    }

    // 2. Create Companies (Clients)
    const companies = [];
    for (let i = 1; i <= 5; i++) {
        const company = await prisma.company.create({
            data: {
                name: `Client Company ${i} - ${Date.now()}`, // Unique name
                type: CompanyType.CLIENT, // Use enum
                status: 'ACTIVE',
                trustLevel: TrustLevel.MEDIUM,
                country: {
                    create: {
                        name: `Country ${i} - ${Date.now()}`
                    }
                }
            }
        });
        companies.push(company);
        console.log(`Created company: ${company.name}`);
    }

    // 3. Create Opportunities
    const statuses = Object.values(OpportunityStatus);
    const today = new Date();

    console.log('Creating 55 opportunities...');

    for (let i = 0; i < 55; i++) {
        const company = companies[Math.floor(Math.random() * companies.length)];
        const commodity = createdCommodities[Math.floor(Math.random() * createdCommodities.length)];
        const status = statuses[Math.floor(Math.random() * statuses.length)];

        // Random date within last 30 days
        const daysAgo = Math.floor(Math.random() * 30);
        const createdAt = new Date(today);
        createdAt.setDate(today.getDate() - daysAgo);

        await prisma.salesOpportunity.create({
            data: {
                companyId: company.id,
                productName: `${commodity.name} Request ${i + 1}`,
                commodityId: commodity.id,
                targetPrice: 10 + Math.random() * 90, // 10-100
                priceType: OpportunityPriceType.PER_KG,
                quantity: 100 + Math.floor(Math.random() * 900), // 100-1000
                procurementQuantity: 0, // Simplified, strictly we don't need this perfect for pagination test
                status: status,
                createdAt: createdAt, // For date filter
                deadline: new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000), // +7 days
            }
        });
    }

    console.log('Seeding completed successfully.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
