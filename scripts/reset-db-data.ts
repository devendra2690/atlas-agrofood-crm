
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    console.log('🗑️  Starting soft database reset (Transactional data only)...')

    // Order matters due to foreign key constraints

    // 1. Transactions (Linked to Invoice, Bill, SalesOrder)
    console.log('Deleting Transactions...')
    await prisma.transaction.deleteMany({})

    // 2. Finance Documents
    console.log('Deleting Bills...')
    await prisma.bill.deleteMany({})
    console.log('Deleting Invoices...')
    await prisma.invoice.deleteMany({})

    // 3. Logistics
    console.log('Deleting Shipments & GRNs...')
    await prisma.shipment.deleteMany({})
    await prisma.gRN.deleteMany({})

    // 4. Procurement Submissions (Linked to Sample, Opportunity)
    console.log('Deleting Sample Submissions...')
    await prisma.sampleSubmission.deleteMany({})

    // 5. Orders
    console.log('Deleting Purchase Orders...')
    await prisma.purchaseOrder.deleteMany({})
    console.log('Deleting Sales Orders...')
    await prisma.salesOrder.deleteMany({})

    // 6. Procurement Details
    console.log('Deleting Sample Records...')
    await prisma.sampleRecord.deleteMany({})
    console.log('Deleting Project Vendors...')
    await prisma.projectVendor.deleteMany({})

    // 7. Core Business Objects (Opportunity must go before ProcurementProject if it references it)
    // Actually SalesOpportunity references ProcurementProject.
    console.log('Deleting Sales Opportunities...')
    await prisma.salesOpportunity.deleteMany({})

    console.log('Deleting Procurement Projects...')
    await prisma.procurementProject.deleteMany({})

    // 8. Logs
    console.log('Deleting Interaction & Activity Logs...')
    await prisma.interactionLog.deleteMany({})
    await prisma.activityLog.deleteMany({})

    // 9. Todos
    console.log('Deleting Todos...')
    await prisma.todo.deleteMany({})

    console.log('✅ Reset Complete! (Settings, Users, Companies, & Master Data preserved)')
}

main()
    .then(async () => {
        await prisma.$disconnect()
    })
    .catch(async (e) => {
        console.error(e)
        await prisma.$disconnect()
        process.exit(1)
    })
