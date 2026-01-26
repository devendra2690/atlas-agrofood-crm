
import { PrismaClient, CompanyType, ProjectStatus, PurchaseOrderStatus } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Starting seed...');

    // 1. Create a dummy Test Client
    const client = await prisma.company.create({
        data: {
            name: `Pagination Test Client ${Date.now()}`,
            type: 'CLIENT',
            status: 'ACTIVE',
            email: 'test@example.com',
        }
    });

    console.log(`Created Client: ${client.name}`);

    // 2. Create a dummy Test Vendor
    const vendor = await prisma.company.create({
        data: {
            name: `Pagination Test Vendor ${Date.now()}`,
            type: 'VENDOR',
            status: 'ACTIVE',
            email: 'vendor@example.com',
        }
    });

    console.log(`Created Vendor: ${vendor.name}`);

    // 3. Create 15 Sales Opportunities for Pagination
    console.log('Seeding 15 Sales Opportunities...');
    for (let i = 0; i < 15; i++) {
        await prisma.salesOpportunity.create({
            data: {
                companyId: client.id,
                productName: `Test Product ${i + 1}`,
                status: 'OPEN',
                quantity: 100,
                targetPrice: 50,
                priceType: 'PER_KG',
                // Creating some variation for filtering if needed
                createdAt: new Date(Date.now() - i * 86400000) // Each day back
            }
        });
    }

    // 4. Create a Project to attach Samples and POs
    const project = await prisma.procurementProject.create({
        data: {
            name: `Pagination Test Project ${Date.now()}`,
            status: 'SOURCING'
        }
    });

    // 5. Create 15 Samples
    console.log('Seeding 15 Samples...');
    for (let i = 0; i < 15; i++) {
        await prisma.sampleRecord.create({
            data: {
                projectId: project.id,
                vendorId: vendor.id,
                status: 'REQUESTED',
                notes: `Sample Pagination Test ${i + 1}`
            }
        });
    }

    // 6. Create 15 Purchase Orders
    console.log('Seeding 15 Purchase Orders...');
    for (let i = 0; i < 15; i++) {
        await prisma.purchaseOrder.create({
            data: {
                projectId: project.id,
                vendorId: vendor.id,
                status: 'DRAFT',
                totalAmount: 1000 * (i + 1),
                quantity: 10,
                quantityUnit: 'MT'
            }
        });
    }

    // 7. Create 15 Sales Orders
    console.log('Seeding 15 Sales Orders...');
    for (let i = 0; i < 15; i++) {
        // Create a dedicated opportunity for the order to satisfy constraints
        const opp = await prisma.salesOpportunity.create({
            data: {
                companyId: client.id,
                productName: `Order Product ${i}`,
                status: 'CLOSED_WON',
                targetPrice: 100,
                quantity: 10
            }
        });

        await prisma.salesOrder.create({
            data: {
                opportunityId: opp.id,
                clientId: client.id,
                totalAmount: 1000,
                status: 'PENDING'
            }
        });
    }

    console.log('Seed completed successfully.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
