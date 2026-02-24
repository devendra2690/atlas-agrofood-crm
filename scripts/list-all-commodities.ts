import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    const list = await prisma.commodity.findMany({ select: { name: true } });
    console.log(list.map(l => l.name).join(', '));
}
main().finally(() => prisma.$disconnect());
