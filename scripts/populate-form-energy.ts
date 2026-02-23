import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Starting Form Electricity Multiplier Seeding...');

    // Get all forms
    const forms = await prisma.varietyForm.findMany();
    console.log(`Found ${forms.length} forms in the database.`);

    let updatedCount = 0;

    for (const form of forms) {
        const name = form.formName.toLowerCase();
        let multiplier = 0.0;

        // Determine realistic grinding power multiplier based on form type
        if (name.includes('powder')) {
            multiplier = 2.5; // Heavy grinding
        } else if (name.includes('paste') || name.includes('puree')) {
            multiplier = 1.8; // Wet grinding
        } else if (name.includes('flake') || name.includes('slice') || name.includes('chop') || name.includes('mince') || name.includes('kibbled')) {
            multiplier = 0.8; // Chopping/Slicing
        } else if (name.includes('granule') || name.includes('crush')) {
            multiplier = 1.5; // Medium grinding
        } else if (name.includes('whole') || name.includes('raw') || name.includes('fresh')) {
            multiplier = 0.0; // No extra processing power
        } else {
            multiplier = 0.5; // Generic default for unknown processing
        }

        // Only update if it's currently 0 to avoid overwriting custom values if they exist,
        // actually user requested to set it because they are currently 0. Let's just forcefully set it.
        await prisma.varietyForm.update({
            where: { id: form.id },
            data: { formElectricityMultiplier: multiplier }
        });

        updatedCount++;
        console.log(`Updated form '${form.formName}' with multiplier ${multiplier}x`);
    }

    console.log(`\nSuccessfully updated ${updatedCount} forms with realistic electricity multipliers.`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
