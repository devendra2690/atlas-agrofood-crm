
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const count = await prisma.company.count();
    console.log(`Total Companies in DB: ${count}`);

    const companies = await prisma.company.findMany({
        take: 10,
        include: {
            commodities: true
        }
    });

    console.log('First 10 Companies:');
    companies.forEach(c => {
        console.log(`- [${c.id}] ${c.name} | Commodities: [${c.commodities.map(x => x.name).join(', ')}]`);
    });

    await prisma.$disconnect();
}

main();
