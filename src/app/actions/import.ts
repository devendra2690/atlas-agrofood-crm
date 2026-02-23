'use server'

import { prisma } from "@/lib/prisma";
import { CompanyType } from "@prisma/client";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { logActivity } from "./audit";

export type ImportResult = {
    success: boolean;
    importedCount: number;
    errors: { row: number; reason: string }[];
};

export async function importCompanies(rows: any[]): Promise<ImportResult> {
    const result: ImportResult = {
        success: false,
        importedCount: 0,
        errors: []
    };

    try {
        const session = await auth();
        if (!session?.user?.id) {
            result.errors.push({ row: 0, reason: "Unauthorized" });
            return result;
        }

        const userId = session.user.id;

        // Iterate through rows
        for (let i = 0; i < rows.length; i++) {
            const row = rows[i];
            const rowNumber = i + 2; // +1 for 0-index, +1 for header

            // Extract fields mapping to the template
            const rawSystemId = row["System ID (Do Not Modify)"];
            const rawName = row["Company Name*"];
            const rawType = row["Type*"];
            const rawPhone = row["Phone"];
            const rawEmail = row["Email"];
            const rawWebsite = row["Website"];
            const rawContact = row["Contact Name"];
            const rawCountry = row["Country"];
            const rawState = row["State"];
            const rawCity = row["City"];
            const rawCommodities = row["Commodities"]; // "Banana, Onion"

            // Validation
            if (!rawName || typeof rawName !== "string" || !rawName.trim()) {
                result.errors.push({ row: rowNumber, reason: "Missing required Company Name" });
                continue;
            }

            const name = rawName.trim();
            const typeUpper = typeof rawType === "string" ? rawType.trim().toUpperCase() : "";

            let type: CompanyType = "PROSPECT"; // Default fallback
            if (Object.values(CompanyType).includes(typeUpper as CompanyType)) {
                type = typeUpper as CompanyType;
            } else if (rawType) {
                // If they provided a type but it's invalid, and it's not empty, error
                result.errors.push({ row: rowNumber, reason: `Invalid Type "${rawType}". Must be CLIENT, PROSPECT, VENDOR, or PARTNER.` });
                continue;
            } else {
                result.errors.push({ row: rowNumber, reason: "Missing required Type (CLIENT or PROSPECT)" });
                continue;
            }

            // Optional string cleanups
            const phone = rawPhone ? String(rawPhone).trim() : undefined;
            const email = rawEmail ? String(rawEmail).trim() : undefined;
            const website = rawWebsite ? String(rawWebsite).trim() : undefined;
            const contactName = rawContact ? String(rawContact).trim() : undefined;
            const systemId = rawSystemId ? String(rawSystemId).trim() : undefined;
            let finalSystemId = systemId;

            try {
                // Pre-resolve geography relations dynamically to ensure valid connects
                let countryId: string | undefined;
                let stateId: string | undefined;
                let cityId: string | undefined;

                if (rawCountry && typeof rawCountry === "string" && rawCountry.trim()) {
                    const countryName = rawCountry.trim();
                    const country = await prisma.country.findFirst({
                        where: { name: { equals: countryName, mode: "insensitive" } }
                    });
                    if (!country) {
                        result.errors.push({ row: rowNumber, reason: `Country "${countryName}" not found in system. Please add it first.` });
                        continue;
                    }
                    countryId = country.id;

                    // If country is resolved, try state
                    if (rawState && typeof rawState === "string" && rawState.trim()) {
                        const stateName = rawState.trim();
                        const state = await prisma.state.findFirst({
                            where: { name: { equals: stateName, mode: "insensitive" }, countryId }
                        });
                        if (!state) {
                            result.errors.push({ row: rowNumber, reason: `State "${stateName}" not found under Country "${countryName}". Please add it first.` });
                            continue;
                        }
                        stateId = state.id;

                        // If state is resolved, try city
                        if (rawCity && typeof rawCity === "string" && rawCity.trim()) {
                            const cityName = rawCity.trim();
                            const city = await prisma.city.findFirst({
                                where: { name: { equals: cityName, mode: "insensitive" }, stateId }
                            });
                            if (!city) {
                                result.errors.push({ row: rowNumber, reason: `City "${cityName}" not found under State "${stateName}". Please add it first.` });
                                continue;
                            }
                            cityId = city.id;
                        }
                    }
                }

                // Resolve Commodities
                const commodityConnects: { id: string }[] = [];
                let commodityError = false;
                if (rawCommodities && typeof rawCommodities === "string" && rawCommodities.trim()) {
                    const commNames = rawCommodities.split(",").map(c => c.trim()).filter(c => c.length > 0);
                    for (const cn of commNames) {
                        const commodity = await prisma.commodity.findFirst({
                            where: { name: { equals: cn, mode: "insensitive" } }
                        });
                        if (!commodity) {
                            result.errors.push({ row: rowNumber, reason: `Commodity "${cn}" not found in system. Please add it first.` });
                            commodityError = true;
                            break;
                        }
                        commodityConnects.push({ id: commodity.id });
                    }
                }

                if (commodityError) continue;

                if (!finalSystemId) {
                    // Fallback: If no ID was provided in the Excel sheet, try to match by exact Name and Type
                    // to prevent blind duplication.
                    const existingMatch = await prisma.company.findFirst({
                        where: {
                            name: { equals: name, mode: "insensitive" },
                            type: type
                        }
                    });
                    if (existingMatch) {
                        finalSystemId = existingMatch.id;
                    }
                }

                // Create or Update the company
                if (finalSystemId) {
                    // Update
                    await prisma.company.update({
                        where: { id: finalSystemId },
                        data: {
                            name,
                            type,
                            phone,
                            email,
                            website,
                            contactName,
                            countryId,
                            stateId,
                            cityId,
                            updatedById: userId,
                            commodities: commodityConnects.length > 0 ? {
                                set: commodityConnects // Replace existing commodities
                            } : {
                                set: [] // Clear commodities if empty array sent
                            }
                        }
                    });
                } else {
                    // Create
                    await prisma.company.create({
                        data: {
                            name,
                            type,
                            phone,
                            email,
                            website,
                            contactName,
                            status: "ACTIVE",
                            countryId,
                            stateId,
                            cityId,
                            createdById: userId,
                            updatedById: userId,
                            commodities: commodityConnects.length > 0 ? {
                                connect: commodityConnects
                            } : undefined
                        }
                    });
                }

                result.importedCount++;
            } catch (err: any) {
                console.error(`Error importing row ${rowNumber}:`, err);
                // Prisma uniqueness constraints or string too long, etc
                if (err.code === 'P2002' && err.meta?.target?.includes('phone')) {
                    result.errors.push({ row: rowNumber, reason: `Phone number ${phone} is already registered to another company.` });
                } else if (err.code === 'P2025' && finalSystemId) {
                    result.errors.push({ row: rowNumber, reason: `Company with ID ${finalSystemId} not found to update.` });
                } else {
                    result.errors.push({ row: rowNumber, reason: `Database Insertion Error: ${err.message || String(err)}` });
                }
            }
        }

        if (result.importedCount > 0) {
            await logActivity({
                action: "UPDATE", // Can be broadly labeled as bulk ops
                entityType: "Company",
                entityId: "SYSTEM",
                details: `Processed ${result.importedCount} companies via Excel Import (${result.errors.length} errors)`
            });
            revalidatePath("/companies");
        }

        result.success = true;
        return result;

    } catch (error: any) {
        console.error("Bulk import failed:", error);
        result.errors.push({ row: 0, reason: "Server failure during import" });
        return result;
    }
}
