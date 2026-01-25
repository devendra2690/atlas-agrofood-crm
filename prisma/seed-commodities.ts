import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    const banana = await prisma.commodity.upsert({
        where: { name: 'Banana' },
        update: { yieldPercentage: 25.0 },
        create: {
            name: 'Banana',
            yieldPercentage: 25.0,
        },
    })

    const mango = await prisma.commodity.upsert({
        where: { name: 'Mango' },
        update: { yieldPercentage: 10.0 },
        create: {
            name: 'Mango',
            yieldPercentage: 10.0,
        },
    })

    console.log({ banana, mango })
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
