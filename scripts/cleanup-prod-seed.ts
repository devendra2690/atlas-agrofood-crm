import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    console.log('Cleaning up accidentally seeded data...');
    
    // Find all companies created by the script (they start with "Client Company " and contain a timestamp "- 17")
    const companies = await prisma.company.findMany({
        where: {
            name: {
                startsWith: 'Client Company '
            }
        }
    });
    
    const companyIds = companies.map(c => c.id);
    console.log(`Found ${companyIds.length} accidentally created companies.`);
    
    if (companyIds.length > 0) {
        // Find opportunities tied to these companies to delete their items first
        const opps = await prisma.salesOpportunity.findMany({
            where: { companyId: { in: companyIds } }
        });
        const oppIds = opps.map(o => o.id);
        
        console.log(`Found ${oppIds.length} accidentally created opportunities.`);
        
        // Delete Opportunity Items
        if (oppIds.length > 0) {
            const deletedItems = await prisma.salesOpportunityItem.deleteMany({
                where: { opportunityId: { in: oppIds } }
            });
            console.log(`Deleted ${deletedItems.count} opportunity items.`);
            
            // Delete Opportunities
            const deletedOpps = await prisma.salesOpportunity.deleteMany({
                where: { companyId: { in: companyIds } }
            });
            console.log(`Deleted ${deletedOpps.count} opportunities.`);
        }
        
        // Delete Companies
        const deletedCompanies = await prisma.company.deleteMany({
            where: { id: { in: companyIds } }
        });
        console.log(`Deleted ${deletedCompanies.count} companies.`);
    }

    // Delete isolated countries created by the seed script
    const countries = await prisma.country.findMany();
    const generatedCountryIds = countries.filter(c => c.name.startsWith('Country ') && c.name.includes(' - 1')).map(c => c.id);
    
    if (generatedCountryIds.length > 0) {
        const deletedCountries = await prisma.country.deleteMany({
            where: { id: { in: generatedCountryIds } }
        });
        console.log(`Deleted ${deletedCountries.count} generated countries.`);
    }
    
    console.log('Cleanup complete!');
}

main().catch(console.error).finally(() => prisma.$disconnect());
