
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    try {
        const companies = await prisma.company.findMany({
            where: {
                // Check broadly first
            }
        });

        console.log(`Checking ${companies.length} Companies:`);
        companies.forEach(c => {
            console.log(`- ${c.name} | Status: ${c.status} | Email: ${c.email}`);
        });

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
