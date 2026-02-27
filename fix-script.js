const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fix() {
    const opp = await prisma.salesOpportunity.findFirst({
        where: {
            company: { name: { contains: "Garon" } }
        },
        include: {
            items: true,
            sampleSubmissions: {
                include: { sample: true }
            }
        },
        orderBy: { createdAt: 'desc' }
    });

    if (!opp) {
        console.log("No opp found");
        return;
    }

    console.log("Found opp with items:", opp.items.map(i => ({ id: i.id, name: i.productName })));
    console.log("Found submissions:", opp.sampleSubmissions.map(s => ({ id: s.id, sampleId: s.sampleId, oppItemId: s.opportunityItemId })));

    // Let's assume there are 3 submissions and 3 items
    if (opp.items.length >= 3 && opp.sampleSubmissions.length >= 3) {
        for (let i = 0; i < 3; i++) {
            await prisma.sampleSubmission.update({
                where: { id: opp.sampleSubmissions[i].id },
                data: { opportunityItemId: opp.items[i].id }
            });
            console.log(`Updated submission ${opp.sampleSubmissions[i].id} to item ${opp.items[i].productName}`);
        }
    }
}

fix().catch(console.error).finally(() => prisma.$disconnect());
