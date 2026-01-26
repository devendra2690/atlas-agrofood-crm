import { PrismaClient, ProjectStatus } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Starting Projects seed...');

    const commodities = await prisma.commodity.findMany();
    const userId = (await prisma.user.findFirst())?.id;

    if (!userId) {
        console.error('No user found');
        return;
    }

    console.log(`Found ${commodities.length} commodities`);

    const statuses = [ProjectStatus.SOURCING, ProjectStatus.COMPLETED];
    const today = new Date();

    console.log('Creating 35 projects...');

    for (let i = 0; i < 35; i++) {
        const commodity = commodities.length > 0 ? commodities[Math.floor(Math.random() * commodities.length)] : null;
        const status = statuses[Math.floor(Math.random() * statuses.length)];

        // Random date within last 30 days
        const daysAgo = Math.floor(Math.random() * 30);

        await prisma.procurementProject.create({
            data: {
                name: `Project for ${commodity ? commodity.name : 'Unknown'} - ${i + 1}`,
                status: status,
                commodityId: commodity?.id,
                createdById: userId,
                updatedById: userId
            }
        });
    }

    // Create a specific one for search test
    await prisma.procurementProject.create({
        data: {
            name: "Unicorn Spice Sourcing 2026",
            status: "SOURCING",
            createdById: userId,
            updatedById: userId
        }
    });

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
