import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
    console.log("Looking for Patel samples...");
    const vendor = await prisma.company.findFirst({ where: { name: { contains: "Patel" } } });
    const samples = await prisma.sampleRecord.findMany({
        where: { vendorId: vendor?.id },
        include: { submissions: true }
    });
    console.log(JSON.stringify(samples, null, 2));
}
main().catch(console.error).finally(() => prisma.$disconnect());
