import { PrismaClient, CompanyStatus, CompanyType, InteractionStatus } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Starting Interactions seed...');

    // 1. Ensure we have companies
    let companies = await prisma.company.findMany();
    if (companies.length < 2) {
        console.log('Creating fallback companies...');
        const newCo = await prisma.company.create({
            data: {
                name: `Interaction Test Co ${Date.now()}`,
                type: CompanyType.CLIENT,
                status: CompanyStatus.ACTIVE
            }
        });
        companies.push(newCo);
    }

    // 2. Ensure we have a user
    let user = await prisma.user.findFirst();
    if (!user) {
        console.log('Creating fallback user...');
        user = await prisma.user.create({
            data: {
                name: "Test User",
                email: `test${Date.now()}@example.com`,
                role: "SALES"
            }
        });
    }

    // 3. Create Interactions
    const statuses = ["FOLLOW_UP_SCHEDULED", "CLOSED"];
    const today = new Date();

    console.log('Creating 55 interactions...');

    for (let i = 0; i < 55; i++) {
        const company = companies[Math.floor(Math.random() * companies.length)];
        const status = statuses[Math.floor(Math.random() * statuses.length)] as InteractionStatus;

        // Random date within last 30 days
        const daysAgo = Math.floor(Math.random() * 30);
        const date = new Date(today);
        date.setDate(today.getDate() - daysAgo);

        await prisma.interactionLog.create({
            data: {
                companyId: company.id,
                userId: user.id,
                description: `Interaction #${i + 1} with ${company.name} - Discussed potential deal involved ${Math.random() > 0.5 ? 'Bananas' : 'Mangoes'}.`,
                status: status,
                date: date,
                nextFollowUp: status === 'FOLLOW_UP_SCHEDULED' ? new Date(date.getTime() + 7 * 24 * 60 * 60 * 1000) : null
            }
        });

        if (i % 10 === 0) console.log(`Created ${i} interactions...`);
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
