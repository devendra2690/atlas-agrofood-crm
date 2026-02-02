
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    try {
        console.log('--- Debugging Commodities ---');

        // 1. Find ALL commodities matching "Banana"
        const commodities = await prisma.commodity.findMany({
            where: { name: { contains: 'Banana', mode: 'insensitive' } },
            include: {
                _count: { select: { companies: true } }
            }
        });

        console.log(`Found ${commodities.length} 'Banana' commodity entries:`);
        commodities.forEach(c => {
            console.log(`- ID: ${c.id}, Name: "${c.name}", Linked Companies: ${c._count.companies}`);
        });

        // 2. Inspect a specific vendor if possible (from the screenshot user likely refers to)
        // We'll search for "Santosh" as seen in the screenshot
        console.log('\n--- Inspecting Vendor "Santosh" ---');
        const companies = await prisma.company.findMany({
            where: { name: { contains: 'Santosh', mode: 'insensitive' } },
            include: {
                commodities: true
            }
        });

        if (companies.length === 0) {
            console.log('No company found matching "Santosh"');
        } else {
            companies.forEach(c => {
                console.log(`Company: ${c.name} (${c.id})`);
                console.log(`- Email: ${c.email}`);
                console.log(`- Linked Commodities:`);
                if (c.commodities.length === 0) {
                    console.log('  (None)');
                } else {
                    c.commodities.forEach(comm => {
                        console.log(`  * ${comm.name} (ID: ${comm.id})`);
                    });
                }
            });
        }

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
