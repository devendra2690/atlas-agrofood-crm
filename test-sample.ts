import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    const opp = await prisma.salesOpportunity.findFirst({ include: { items: true } });
    const vendor = await prisma.company.findFirst({ where: { type: 'PARTNER' } });
    if (!opp || !vendor) return;

    let projectId = opp.procurementProjectId;
    if (!projectId) {
        const p = await prisma.procurementProject.create({ data: { name: 'test', type: 'SAMPLE', commodityId: opp.items[0]?.commodityId || '' } });
        projectId = p.id;
    }

    await prisma.projectVendor.upsert({
        where: { projectId_vendorId: { projectId, vendorId: vendor.id } },
        create: { projectId, vendorId: vendor.id },
        update: {}
    });

    const s1 = await prisma.sampleRecord.create({ data: { projectId, vendorId: vendor.id, status: 'RECEIVED' } });
    await prisma.sampleSubmission.create({ data: { sampleId: s1.id, opportunityId: opp.id } });
    console.log('Sample 1 created');

    const s2 = await prisma.sampleRecord.create({ data: { projectId, vendorId: vendor.id, status: 'RECEIVED' } });
    await prisma.sampleSubmission.create({ data: { sampleId: s2.id, opportunityId: opp.id } });
    console.log('Sample 2 created');
}
main().then(() => console.log('done')).catch(e => console.error(e));
