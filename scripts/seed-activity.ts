
import { prisma } from "../src/lib/prisma";

async function main() {
    console.log("Seeding dummy activity logs...");

    // Get a user to attribute logs to (or use system fallback)
    const user = await prisma.user.findFirst();
    if (!user) {
        console.error("No user found to attribute logs to.");
        return;
    }

    const activities = [
        {
            action: "CREATE",
            entityType: "SalesOrder",
            entityId: "seeded-so-001",
            entityTitle: "Order #SO-2024-001",
            details: "Created sales order for Global Foods Inc - ₹1,200,000",
            userId: user.id,
            createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2) // 2 days ago
        },
        {
            action: "STATUS_CHANGE",
            entityType: "SalesOrder",
            entityId: "seeded-so-001",
            entityTitle: "Order #SO-2024-001",
            details: "Changed status to IN_PROGRESS",
            userId: user.id,
            createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 1.5) // 1.5 days ago
        },
        {
            action: "CREATE",
            entityType: "PurchaseOrder",
            entityId: "seeded-po-001",
            entityTitle: "PO #PO-88219",
            details: "Created manual PO - ₹450,000",
            userId: user.id,
            createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 1) // 1 day ago
        },
        {
            action: "CREATE",
            entityType: "Invoice",
            entityId: "seeded-inv-001",
            entityTitle: "Invoice #INV-9921",
            details: "Created invoice - ₹1,200,000",
            userId: user.id,
            createdAt: new Date(Date.now() - 1000 * 60 * 60 * 4) // 4 hours ago
        },
        {
            action: "PAYMENT",
            entityType: "Invoice",
            entityId: "seeded-inv-001",
            entityTitle: "Invoice #INV-9921",
            details: "Recorded payment of ₹500,000. Status: PARTIAL",
            userId: user.id,
            createdAt: new Date(Date.now() - 1000 * 60 * 30) // 30 mins ago
        },
        {
            action: "STATUS_CHANGE",
            entityType: "Shipment",
            entityId: "seeded-shp-001",
            entityTitle: "Shipment",
            details: "Updated shipment status to DELIVERED",
            userId: user.id,
            createdAt: new Date() // Just now
        }
    ];

    for (const log of activities) {
        await prisma.activityLog.create({ data: log });
    }

    console.log(`Seeded ${activities.length} activity logs.`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
