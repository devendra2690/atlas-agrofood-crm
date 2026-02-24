import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    console.log("Tracing 218.25kg calculation...");
    const commodities = await prisma.commodity.findMany({ include: { varieties: true, forms: true } });
    const allForms = await prisma.varietyForm.findMany();

    for (const c of commodities) {
        // Try all forms for this commodity
        const forms = allForms.filter(f => f.commodityId === c.id || c.varieties.some(v => v.id === f.varietyId));
        if (forms.length === 0) {
           // Treat as just commodity
           const cW = c.wastagePercentage || 0;
           const formYield = c.yieldPercentage || 100;
           let vW = 0;
           if (Math.abs(vW + formYield - 100) < 0.01) { vW = 0; }
           const w1 = 300 * (1 - cW/100);
           const w2 = w1 * (1 - vW/100);
           const final = w2 * (formYield/100);
           if (Math.abs(final - 218.25) < 0.1) console.log(`Match Commodity Only: ${c.name} (cW=${cW}, formYield=${formYield})`);
        }
        
        for (const f of forms) {
            const v = c.varieties.find(variety => variety.id === f.varietyId);
            
            const cW = c.wastagePercentage || 0;
            let vW = f.wastagePercentage || (v ? v.wastagePercentage : 0) || 0;
            const formYield = f.yieldPercentage || c.yieldPercentage || 100;
            
            if (Math.abs(vW + formYield - 100) < 0.01) { vW = 0; }
            
            const w1 = 300 * (1 - cW/100);
            const w2 = w1 * (1 - vW/100);
            const final = w2 * (formYield/100);
            
            if (Math.abs(final - 218.25) < 0.1) {
                console.log(`Match Form! Commodity: ${c.name}, Variety: ${v?.name || '-'}, Form: ${f.formName}`);
                console.log(` - cmWastageIdx: ${cW}%`);
                console.log(` - vWastageIdx (Original): ${f.wastagePercentage || (v ? v.wastagePercentage : 0) || 0}%`);
                console.log(` - vWastageIdx (Applied): ${vW}%`);
                console.log(` - formYield: ${formYield}%`);
                console.log(` - w1: ${w1}, w2: ${w2}, final: ${final}`);
            }
        }
    }
}
main().finally(() => prisma.$disconnect());
