import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fetchIndiaData() {
    console.log('📡 Fetching latest India State and District data from GitHub...');
    const url = 'https://raw.githubusercontent.com/sab99r/Indian-States-And-Districts/master/states-and-districts.json';
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`Failed to fetch data: ${response.statusText}`);
    }
    const data = await response.json();
    return data.states; // Array of { state: string, districts: string[] }
}

async function main() {
    console.log('🌍 Seeding Indian Location Data (States & Districts)...');

    // 1. Create or Find Country
    let countryRecord = await prisma.country.findUnique({
        where: { name: 'India' }
    });

    if (!countryRecord) {
        countryRecord = await prisma.country.create({
            data: { name: 'India' }
        });
        console.log(`✅ Created Country: India`);
    } else {
        console.log(`✅ Country already exists: India`);
    }

    const countryId = countryRecord.id;

    try {
        const statesData = await fetchIndiaData();
        let statesAdded = 0;
        let citiesAdded = 0;

        // 2. Iterate over States
        for (const stateObj of statesData) {
            const stateName = stateObj.state;
            const districts = stateObj.districts;

            let stateRecord = await prisma.state.findUnique({
                where: {
                    name_countryId: {
                        name: stateName,
                        countryId: countryId
                    }
                }
            });

            if (!stateRecord) {
                stateRecord = await prisma.state.create({
                    data: {
                        name: stateName,
                        countryId: countryId
                    }
                });
                statesAdded++;
            }

            const stateId = stateRecord.id;

            // 3. Iterate over Districts (saved as Cities)
            // Inserting in batches to optimize speed
            const cityDataToCreate = [];

            for (const districtName of districts) {
                // Find if city exists
                let cityRecord = await prisma.city.findUnique({
                    where: {
                        name_stateId: {
                            name: districtName,
                            stateId: stateId
                        }
                    }
                });

                if (!cityRecord) {
                    cityDataToCreate.push({
                        name: districtName,
                        stateId: stateId
                    });
                }
            }

            if (cityDataToCreate.length > 0) {
                await prisma.city.createMany({
                    data: cityDataToCreate,
                    skipDuplicates: true
                });
                citiesAdded += cityDataToCreate.length;
            }

            console.log(`   Processed State: ${stateName} (${districts.length} districts)`);
        }

        console.log(`\n✅ Location Seed Complete!`);
        console.log(`📊 New States added: ${statesAdded}`);
        console.log(`📊 New Districts (Cities) added: ${citiesAdded}`);
    } catch (error) {
        console.error("❌ Error during seeding:", error);
    }
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
