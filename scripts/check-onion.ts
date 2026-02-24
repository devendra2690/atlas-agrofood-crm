import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    const onion = await prisma.commodity.findFirst({
        where: { name: { contains: 'Onion', mode: 'insensitive' } },
        include: { forms: true }
    });
    console.log(JSON.stringify(onion, null, 2));
}

main().finally(() => prisma.$disconnect());
