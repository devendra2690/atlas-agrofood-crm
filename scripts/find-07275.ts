import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    const commodities = await prisma.commodity.findMany({ include: { varieties: true, forms: true } });
    const allForms = await prisma.varietyForm.findMany();

    for (const c of commodities) {
        const cW = c.wastagePercentage || 0;
        const forms = allForms.filter(f => f.commodityId === c.id || c.varieties.some(v => v.id === f.varietyId));
        
        for (const f of forms) {
            const v = c.varieties.find(variety => variety.id === f.varietyId);
            let vW = f.wastagePercentage || (v ? v.wastagePercentage : 0) || 0;
            const formYield = f.yieldPercentage || c.yieldPercentage || 100;
            
            if (Math.abs(vW + formYield - 100) < 0.01) { vW = 0; }
            
            const w1 = 300 * (1 - cW/100);
            const w2 = w1 * (1 - vW/100);
            const final = w2 * (formYield/100);
            
            if (Math.abs(final - 218.25) < 0.1) {
                console.log(`FOUND! Commodity: ${c.name} | Form: ${f.formName} | cW: ${cW}% | vW: ${vW}% | formYield: ${formYield}%`);
            }
        }
    }
}
main().finally(() => prisma.$disconnect());
