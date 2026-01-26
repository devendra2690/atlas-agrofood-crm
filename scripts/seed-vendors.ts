
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Starting Vendor seed...');

    const vendors = [
        { name: 'Global Logistics Co', type: 'VENDOR', email: 'contact@globallogistics.com' },
        { name: 'Agro Suppliers Ltd', type: 'VENDOR', email: 'sales@agrosuppliers.com' },
        { name: 'Farmers Union', type: 'VENDOR', email: 'union@farmers.com' }
    ];

    for (const v of vendors) {
        const existing = await prisma.company.findFirst({
            where: { email: v.email }
        });

        if (!existing) {
            await prisma.company.create({
                data: {
                    name: v.name,
                    type: 'VENDOR',
                    email: v.email,
                    phone: '123-456-7890'
                }
            });
        }
    }
}

console.log('Seeded vendors.');


main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
