import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    console.log('🗑️  Starting clean up of operational data...')

    // Delete in order of dependencies (Child -> Parent)

    // Level 1: Deepest children
    await prisma.transaction.deleteMany({})
    await prisma.sampleSubmission.deleteMany({})
    await prisma.projectVendor.deleteMany({})

    // Level 2: Intermediates
    await prisma.invoice.deleteMany({})
    await prisma.bill.deleteMany({})

    // Level 3: Orders
    await prisma.salesOrder.deleteMany({})
    await prisma.purchaseOrder.deleteMany({})

    // Level 4: Core Operational
    await prisma.sampleRecord.deleteMany({})
    await prisma.salesOpportunity.deleteMany({})
    await prisma.interactionLog.deleteMany({})

    // Level 5: Projects & Companies
    await prisma.procurementProject.deleteMany({})
    // Note: Deleting companies will remove their associations with Commodities/Locations 
    // but should NOT delete the Commodities/Locations themselves (dependent on relation type, usually cascade is on the link table or handled by prisma)
    await prisma.company.deleteMany({})

    console.log('✅ Operational data deleted.')
    console.log('🛡️  Preserved: Users, Commodities, Products, Locations (Country/State/City).')
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
