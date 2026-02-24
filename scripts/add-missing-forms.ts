import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function addForms(commodityName: string, forms: any[]) {
    const c = await prisma.commodity.findFirst({
        where: { name: { equals: commodityName, mode: 'insensitive' } }
    });
    if (!c) return;

    for (const f of forms) {
        const existing = await prisma.varietyForm.findFirst({
            where: { commodityId: c.id, formName: f.formName } as any
        });
        if (!existing) {
            await prisma.varietyForm.create({
                data: {
                    commodityId: c.id,
                    formName: f.formName,
                    yieldPercentage: f.yield,
                    wastagePercentage: f.wastage
                } as any
            });
            console.log(`Added ${f.formName} to ${commodityName}`);
        }
    }
}

async function main() {
    console.log('🌟 Adding Missing Forms...');
    await addForms('Cluster Beans', [
        { formName: "Guar Gum (Powder)", yield: 28, wastage: 15 },
        { formName: "Dehydrated Clusters", yield: 18, wastage: 15 }
    ]);
    await addForms('Yam', [
        { formName: "Powder", yield: 22, wastage: 20 },
        { formName: "Chips", yield: 25, wastage: 20 }
    ]);
    console.log('✅ Done');
}

main().finally(() => prisma.$disconnect());
