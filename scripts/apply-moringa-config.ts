import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    console.log('🌟 Applying Drumstick (Moringa) Configuration to Database...');
    const commodity = await prisma.commodity.findFirst({
        where: { name: { contains: 'Drumstick', mode: 'insensitive' } }
    });

    if (commodity) {
        await prisma.commodity.update({
            where: { id: commodity.id },
            data: {
                baseBatchElectricityUnits: 70,
                wastagePercentage: 10
            }
        });
        console.log(`✅ Updated Drumstick Base: 70 units, 10% cleaning`);

        const form = await prisma.varietyForm.findFirst({
            where: {
                commodityId: commodity.id,
                formName: { contains: 'Moringa', mode: 'insensitive' }
            } as any
        });

        if (form) {
            await prisma.varietyForm.update({
                where: { id: form.id },
                data: {
                    wastagePercentage: 35,
                    yieldPercentage: 24
                }
            });
            console.log(`  -> Updated Leaf Powder (Moringa) form: 35% prep, 24% yield`);
        }
    }
}

main().finally(() => prisma.$disconnect());
