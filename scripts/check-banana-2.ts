import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    const list = await prisma.commodity.findMany({
        where: { name: { contains: 'Banana', mode: 'insensitive' } },
        include: { forms: true, varieties: { include: { forms: true } } }
    });
    console.log(JSON.stringify(list, null, 2));
}

main().finally(() => prisma.$disconnect());
