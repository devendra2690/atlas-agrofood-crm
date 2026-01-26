import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Starting Finance seed...');

    const userId = (await prisma.user.findFirst())?.id;
    if (!userId) {
        console.error('No user found');
        return;
    }

    // 1. Ensure we have some Vendors and Clients
    let vendor = await prisma.company.findFirst({ where: { type: 'VENDOR' } });
    if (!vendor) {
        vendor = await prisma.company.create({
            data: {
                name: "Seed Vendor Finance",
                type: "VENDOR",
                email: "finance@vendor.com",
                createdById: userId,
                updatedById: userId
            }
        });
    }

    let client = await prisma.company.findFirst({ where: { type: 'CLIENT' } });
    if (!client) {
        client = await prisma.company.create({
            data: {
                name: "Seed Client Finance",
                type: "CLIENT",
                email: "finance@client.com",
                createdById: userId,
                updatedById: userId
            }
        });
    }

    // 2. Create Project for POs
    const commodity = await prisma.commodity.findFirst();
    const project = await prisma.procurementProject.create({
        data: {
            name: `Finance Seed Project ${Date.now()}`,
            status: 'SOURCING',
            commodityId: commodity?.id,
            createdById: userId,
            updatedById: userId
        }
    });

    // Create Opportunity for SOs
    const opportunity = await prisma.salesOpportunity.create({
        data: {
            companyId: client.id,
            productName: "Finance Seed Product",
            quantity: 1000,
            status: "CLOSED_WON",
            createdById: userId,
            updatedById: userId
        }
    });


    // 3. Create Bills (35 items)
    console.log('Creating Bills...');
    const billStatuses = ['DRAFT', 'APPROVED', 'PAID'];

    for (let i = 0; i < 35; i++) {
        const po = await prisma.purchaseOrder.create({
            data: {
                projectId: project.id,
                vendorId: vendor.id,
                status: 'RECEIVED',
                totalAmount: 5000 + i * 100,
                quantity: 100,
                createdById: userId,
                updatedById: userId
            }
        });

        const status = billStatuses[Math.floor(Math.random() * billStatuses.length)];
        const amount = 5000 + i * 100;

        await prisma.bill.create({
            data: {
                purchaseOrderId: po.id,
                vendorId: vendor.id,
                invoiceNumber: `BILL-${Date.now()}-${i}`,
                // amount: amount, <-- Removed
                totalAmount: amount, // Keeping this
                pendingAmount: status === 'PAID' ? 0 : amount,
                dueDate: new Date(),
                status: status as any,
                createdById: userId,
                updatedById: userId
            }
        });
    }

    // 4. Create Invoices (35 items)
    console.log('Creating Invoices...');
    const invoiceStatuses = ['UNPAID', 'PARTIAL', 'PAID'];

    for (let i = 0; i < 35; i++) {
        // Create SO
        const so = await prisma.salesOrder.create({
            data: {
                opportunityId: opportunity.id,
                clientId: client.id,
                status: 'CONFIRMED',
                totalAmount: 10000 + i * 100,
                createdById: userId,
                updatedById: userId
            }
        });

        const status = invoiceStatuses[Math.floor(Math.random() * invoiceStatuses.length)];
        const amount = 10000 + i * 100;

        await prisma.invoice.create({
            data: {
                salesOrderId: so.id,
                totalAmount: amount,
                // amount: amount, <-- Removed if it was there (it wasn't in error log but good to check)
                pendingAmount: status === 'PAID' ? 0 : amount,
                dueDate: new Date(),
                status: status as any,
                createdById: userId,
                updatedById: userId
            }
        });
    }

    console.log('Seeding Finance completed.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
