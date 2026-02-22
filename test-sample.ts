import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
    console.log("Looking for samples...");
    // Find vendor Santosh Tale
    const vendor = await prisma.company.findFirst({ where: { name: { contains: "Santosh" } } });
    console.log("Vendor:", vendor?.name, vendor?.id);
    
    // Find all his samples
    const samples = await prisma.sampleRecord.findMany({
        where: { vendorId: vendor?.id },
       include: {
            project: { include: { commodity: true } },
            submissions: { include: { opportunity: true } }
       }
    });
    console.log(JSON.stringify(samples, null, 2));
}
main().catch(console.error).finally(() => prisma.$disconnect());
