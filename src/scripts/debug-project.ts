
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
    const projects = await prisma.procurementProject.findMany({ select: { id: true, name: true } });
    console.log("Available Projects:", projects);
    const project = await prisma.procurementProject.findFirst({
        where: { name: { contains: "Banana" } }, // Fuzzy search
        include: {
            salesOpportunities: true,
            purchaseOrders: true
        }
    });

    if (!project) {
        console.log("Project not found");
        return;
    }

    console.log("=== Sales Opportunities (Demand) ===");
    let totalDemand = 0;
    project.salesOpportunities.forEach((opp: any) => {
        const qty = Number(opp.procurementQuantity) || Number(opp.quantity) || 0;
        console.log(`Opp: ${opp.id.slice(0, 8)} | Status: ${opp.status} | Qty: ${opp.quantity} | ProcQty: ${opp.procurementQuantity} | Used: ${qty}`);
        if (String(opp.status) === 'OPEN' || String(opp.status) === 'CLOSED_WON') {
            totalDemand += qty;
        }
    });
    console.log(`Calculated Total Demand: ${totalDemand} MT`);

    console.log("\n=== Purchase Orders (Supply) ===");
    let totalSupply = 0;
    project.purchaseOrders.forEach((po: any) => {
        const qty = Number(po.quantity) || 0;
        console.log(`PO: ${po.id.slice(0, 8)} | Status: ${po.status} | Qty: ${qty}`);
        if (po.status !== 'CANCELLED') {
            totalSupply += qty;
        }
    });
    console.log(`Calculated Total Supply: ${totalSupply} MT`);

    console.log("\n=== Unlinked Opportunities (Potential Candidates) ===");
    const unlinkedOpps = await prisma.salesOpportunity.findMany({
        where: {
            procurementProjectId: null,
            status: { in: ['OPEN', 'CLOSED_WON'] }
        },
        include: { company: true }
    });

    unlinkedOpps.forEach((opp: any) => {
        const qty = Number(opp.procurementQuantity) || Number(opp.quantity) || 0;
        console.log(`Unlinked Opp: ${opp.id.slice(0, 8)} | Company: ${opp.company.name} | Product: ${opp.productName} | Qty: ${qty}`);
    });
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
