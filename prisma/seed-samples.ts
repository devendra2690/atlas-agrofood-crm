import { PrismaClient, SampleStatus, TrustLevel } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
    console.log("Start seeding samples...");

    // 1. Ensure we have some commodities
    let commodities = await prisma.commodity.findMany();
    if (commodities.length === 0) {
        console.log("No commodities found, creating some...");
        await prisma.commodity.createMany({
            data: [
                { name: "Rice" },
                { name: "Wheat" },
                { name: "Corn" },
                { name: "Spices" },
            ]
        });
        commodities = await prisma.commodity.findMany();
    }

    // 2. Ensure we have Cities/States/Countries for location filtering
    let country = await prisma.country.findFirst({ where: { name: "India" } });
    if (!country) {
        country = await prisma.country.create({ data: { name: "India" } });
    }

    // Create States
    const stateNames = ["Maharashtra", "Gujarat", "Karnataka", "Punjab"];
    for (const name of stateNames) {
        const existing = await prisma.state.findFirst({ where: { name } });
        if (!existing) {
            await prisma.state.create({ data: { name, countryId: country.id } });
        }
    }
    const states = await prisma.state.findMany({ where: { countryId: country.id } });

    // Create Cities
    const cityNames = ["Mumbai", "Pune", "Ahmedabad", "Surat", "Bangalore", "Amritsar"];
    for (const name of cityNames) {
        // Assign somewhat correct state mapping for realism, or random
        let stateId = states[0].id;
        if (name === "Mumbai" || name === "Pune") stateId = states.find(s => s.name === "Maharashtra")?.id || stateId;
        if (name === "Ahmedabad" || name === "Surat") stateId = states.find(s => s.name === "Gujarat")?.id || stateId;
        if (name === "Bangalore") stateId = states.find(s => s.name === "Karnataka")?.id || stateId;
        if (name === "Amritsar") stateId = states.find(s => s.name === "Punjab")?.id || stateId;

        const existing = await prisma.city.findFirst({ where: { name } });
        if (!existing) {
            await prisma.city.create({ data: { name, stateId } });
        }
    }
    const cities = await prisma.city.findMany();


    // 3. Ensure we have Vendors (Company with type VENDOR)
    let vendors = await prisma.company.findMany({ where: { type: "VENDOR" } });
    if (vendors.length < 5) {
        console.log("Creating vendors...");
        for (let i = 0; i < 10; i++) {
            const city = cities[Math.floor(Math.random() * cities.length)];
            const trustLevels: TrustLevel[] = ["LOW", "MEDIUM", "HIGH", "VERIFIED", "UNRATED"];

            await prisma.company.create({
                data: {
                    name: `Sample Vendor ${i + 1}`,
                    type: "VENDOR",
                    trustLevel: trustLevels[Math.floor(Math.random() * trustLevels.length)],
                    status: "ACTIVE",
                    cityId: city.id,
                    stateId: city.stateId,
                    countryId: country.id,
                    // Phone/Email optional
                }
            });
        }
        vendors = await prisma.company.findMany({ where: { type: "VENDOR" } });
    }

    if (vendors.length === 0) {
        console.error("No vendors available. Please ensure at least one Company exists to create vendors.");
        return;
    }

    // 4. Ensure we have Projects
    let projects = await prisma.procurementProject.findMany();
    if (projects.length < 5) {
        console.log("Creating projects...");
        for (let i = 0; i < 5; i++) {
            const commodity = commodities[Math.floor(Math.random() * commodities.length)];
            await prisma.procurementProject.create({
                data: {
                    name: `Project for ${commodity.name} - ${i + 1}`,
                    commodityId: commodity.id,
                    status: "SOURCING", // ProjectStatus enum
                }
            });
        }
        projects = await prisma.procurementProject.findMany();
    }

    // 5. Create Samples
    console.log("Creating samples...");
    const statuses: SampleStatus[] = [
        "REQUESTED",
        "SENT",
        "RECEIVED",
        "Result_APPROVED_INTERNAL",
        "Result_REJECTED"
    ];

    for (let i = 0; i < 50; i++) {
        const vendor = vendors[Math.floor(Math.random() * vendors.length)];
        const project = projects[Math.floor(Math.random() * projects.length)];
        const status = statuses[Math.floor(Math.random() * statuses.length)];

        await prisma.sampleRecord.create({
            data: {
                projectId: project.id,
                vendorId: vendor.id,
                status: status,
                notes: `Generated sample ${i + 1}`,
                receivedDate: status === "REQUESTED" ? null : new Date(),
                priceQuoted: Math.floor(Math.random() * 500) + 100,
            }
        });
    }

    console.log("Seeding finished.");
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
