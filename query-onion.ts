import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const onions = await prisma.commodity.findMany({
    where: { name: { contains: 'Onion', mode: 'insensitive' } },
    include: {
      varieties: {
        include: {
          forms: true
        }
      },
      forms: true
    }
  });
  console.log(JSON.stringify(onions, null, 2));
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
