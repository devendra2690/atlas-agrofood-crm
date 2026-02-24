import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    const banana = await prisma.commodity.findFirst({
        where: { name: { contains: 'Banana', mode: 'insensitive' } },
        include: { forms: true }
    });
    console.log(JSON.stringify(banana, null, 2));
}

main().finally(() => prisma.$disconnect());
