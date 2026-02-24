import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    console.log("Varieties:");
    const varieties = await prisma.commodityVariety.findMany();
    for (const v of varieties) {
        if (v.yieldPercentage === 28 || v.wastagePercentage === 72 || v.wastagePercentage === 35) {
            console.log(v);
        }
    }
    console.log("Forms:");
    const forms = await prisma.varietyForm.findMany();
    for (const f of forms) {
        if (f.yieldPercentage === 28 || f.wastagePercentage === 72 || f.wastagePercentage === 35) {
            console.log(f);
        }
    }
    console.log("Commodities:");
    const coms = await prisma.commodity.findMany();
    for (const c of coms) {
        if (c.wastagePercentage === 35 || c.yieldPercentage === 28 || c.wastagePercentage === 72) {
            console.log(c);
        }
    }
}
main().finally(() => prisma.$disconnect());
