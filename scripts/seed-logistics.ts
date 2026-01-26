import { PrismaClient, PurchaseOrderStatus } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Starting Logistics seed...');

    const userId = (await prisma.user.findFirst())?.id;
    if (!userId) {
        console.error('No user found');
        return;
    }

    // 1. Get some purchase orders to attach shipments to, or create new ones
    let purchaseOrders = await prisma.purchaseOrder.findMany();

    // Ensure we have a dummy project and vendor if no POs exist
    if (purchaseOrders.length < 5) {
        console.log('Creating fallback POs...');
        // We'll skip complex setup and just hope we have existing ones or create minimal
        // But better to strictly rely on existing ones or fail, OR create new ones properly.
        // Let's create a new Project and some POs to be safe.

        const commodity = await prisma.commodity.findFirst();
        const vendor = await prisma.company.findFirst({ where: { type: 'VENDOR' } });

        if (!commodity || !vendor) {
            console.error('Missing commodity or vendor');
            return;
        }

        const project = await prisma.procurementProject.create({
            data: {
                name: `Logistics Seed Project ${Date.now()}`,
                status: 'SOURCING',
                commodityId: commodity.id,
                createdById: userId,
                updatedById: userId
            }
        });

        for (let i = 0; i < 15; i++) {
            const po = await prisma.purchaseOrder.create({
                data: {
                    projectId: project.id,
                    vendorId: vendor.id,
                    status: 'IN_TRANSIT',
                    totalAmount: 1000,
                    quantity: 100,
                    createdById: userId,
                    updatedById: userId
                }
            });
            purchaseOrders.push(po);
        }
    }

    console.log(`Found ${purchaseOrders.length} POs`);

    console.log('Creating 40 shipments...');
    const statuses = ['IN_TRANSIT', 'DELIVERED', 'PENDING'];

    for (let i = 0; i < 40; i++) {
        const po = purchaseOrders[i % purchaseOrders.length];
        const status = statuses[Math.floor(Math.random() * statuses.length)];

        // Random ETA
        const eta = new Date();
        eta.setDate(eta.getDate() + Math.floor(Math.random() * 14));

        try {
            await prisma.shipment.create({
                data: {
                    purchaseOrderId: po.id,
                    carrier: `Carrier ${i}`,
                    trackingNumber: `TRK-${Date.now()}-${i}`,
                    status: status,
                    eta: eta,
                    createdById: userId,
                    updatedById: userId
                }
            });
        } catch (e: any) {
            if (e.code === 'P2002') {
                console.log(`Skipping PO ${po.id} - already has shipment`);
            } else {
                console.warn(`Failed to create shipment for PO ${po.id}: ${e.message}`);
            }
        }
    }

    console.log('Seeding completed successfully.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
