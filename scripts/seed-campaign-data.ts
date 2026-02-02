
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    try {
        const banana = await prisma.commodity.findFirst({
            where: { name: { contains: 'Banana', mode: 'insensitive' } }
        });

        if (!banana) return;

        // Get first 3 companies
        const companies = await prisma.company.findMany({ take: 3 });

        console.log(`Linking ${companies.length} companies to ${banana.name}...`);

        for (const company of companies) {
            await prisma.company.update({
                where: { id: company.id },
                data: {
                    commodities: {
                        connect: { id: banana.id }
                    }
                }
            });
            console.log(`Linked ${company.name} to check ${banana.name}`);

            // Also ensure they have an email for testing
            if (!company.email) {
                const fakeEmail = `test+${company.id.substring(0, 4)}@example.com`;
                await prisma.company.update({
                    where: { id: company.id },
                    data: { email: fakeEmail }
                });
                console.log(`Updated email for ${company.name} to ${fakeEmail}`);
            }
        }

        console.log("Done!");

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
