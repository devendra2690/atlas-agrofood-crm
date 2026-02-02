
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    try {
        console.log('Checking Commodities...');
        const banana = await prisma.commodity.findFirst({
            where: { name: { contains: 'Banana', mode: 'insensitive' } }
        });

        if (!banana) {
            console.log('No commodity found matching "Banana"');
            return;
        }

        console.log(`Found Commodity: ${banana.name} (${banana.id})`);

        console.log('\nChecking Companies linked to this commodity...');
        const companies = await prisma.company.findMany({
            where: {
                commodities: {
                    some: {
                        id: banana.id
                    }
                }
            },
            include: {
                commodities: true
            }
        });

        console.log(`Found ${companies.length} companies linked to ${banana.name}.`);

        companies.forEach(c => {
            console.log(`- ${c.name}: Email=${c.email || 'NULL'} (Type: ${c.type})`);
        });

        if (companies.length === 0) {
            console.log('\nPossible Reason: No companies are linked to this commodity.');
        } else {
            const withEmail = companies.filter(c => c.email);
            console.log(`\nValid Recipients: ${withEmail.length}`);
        }

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
