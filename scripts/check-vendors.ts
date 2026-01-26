import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const vendors = await prisma.company.findMany({
        where: {
            type: 'VENDOR'
        }
    });
    console.log('Vendors found:', vendors.length);
    console.log(JSON.stringify(vendors, null, 2));
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
