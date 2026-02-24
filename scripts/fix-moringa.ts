import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    const moringa = await prisma.commodity.findFirst({
        where: { name: { contains: 'Moringa', mode: 'insensitive' } }
    });
    if (!moringa) return console.log("Not found at all");
    
    await prisma.commodity.update({
        where: { id: moringa.id },
        data: { baseBatchElectricityUnits: 70, wastagePercentage: 10 }
    });
    console.log(`Updated Base for ${moringa.name}: 70 Units, 10% wastage`);

    const form = await prisma.varietyForm.findFirst({
        where: { commodityId: moringa.id, formName: { contains: 'Powder', mode: 'insensitive' } } as any
    });
    if (form) {
        await prisma.varietyForm.update({
            where: { id: form.id },
            data: { wastagePercentage: 35, yieldPercentage: 24 }
        });
        console.log(`Updated Powder Form: 35% wastage, 24% yield`);
    } else {
        console.log("No powder form");
    }
}

main().finally(() => prisma.$disconnect());
