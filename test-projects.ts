import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
    const project = await prisma.procurementProject.findFirst({
        where: { name: { contains: "8e46e506" } },
        include: {
            samples: true,
            salesOpportunities: {
                include: { sampleSubmissions: { include: { sample: true } } }
            }
        }
    });
    console.log(JSON.stringify(project, null, 2));
}
main().catch(console.error).finally(() => prisma.$disconnect());
