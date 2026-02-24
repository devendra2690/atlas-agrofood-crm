'use server'

import { prisma } from "@/lib/prisma";
import { logActivity } from "./audit";

// --- EXPORTS ---

export async function exportCommodities() {
    try {
        const data = await prisma.commodity.findMany({
            orderBy: { name: 'asc' }
        });
        return { success: true, data };
    } catch (error) {
        console.error("Export Commodities Error:", error);
        return { success: false, error: "Failed to export commodities" };
    }
}

export async function exportVarieties() {
    try {
        const rawData = await prisma.commodityVariety.findMany({
            orderBy: { name: 'asc' },
            include: { commodity: { select: { name: true } } }
        });

        // Flatten for CSV
        const data = rawData.map(v => {
            const { commodity, ...rest } = v;
            return {
                ...rest,
                commodityName: commodity?.name || ''
            };
        });

        return { success: true, data };
    } catch (error) {
        console.error("Export Varieties Error:", error);
        return { success: false, error: "Failed to export varieties" };
    }
}

export async function exportForms() {
    try {
        const rawData = await prisma.varietyForm.findMany({
            orderBy: { formName: 'asc' },
            include: {
                commodity: { select: { name: true } },
                variety: { select: { name: true } }
            }
        });

        const data = rawData.map(f => {
            const { commodity, variety, ...rest } = f;
            return {
                ...rest,
                commodityName: commodity?.name || '',
                varietyName: variety?.name || ''
            };
        });

        return { success: true, data };
    } catch (error) {
        console.error("Export Forms Error:", error);
        return { success: false, error: "Failed to export forms" };
    }
}

export async function exportDefaultWastage() {
    try {
        const data = await prisma.defaultWastageReference.findMany({
            orderBy: { commodityName: 'asc' }
        });
        return { success: true, data };
    } catch (error) {
        console.error("Export Default Wastage Error:", error);
        return { success: false, error: "Failed to export default wastage" };
    }
}

// --- IMPORTS ---

export async function importCommodities(rows: any[]) {
    if (!rows || !rows.length) return { success: false, error: "No data provided" };
    try {
        let imported = 0;
        for (const row of rows) {
            if (!row.name) continue; // Skip invalid

            // Clean numbers
            const baseUnits = parseFloat(row.baseBatchElectricityUnits) || 0;
            const yieldPct = parseFloat(row.yieldPercentage) || 100;
            const wastagePct = parseFloat(row.wastagePercentage) || 0;

            if (row.id) {
                // Try update by ID
                const exists = await prisma.commodity.findUnique({ where: { id: row.id } });
                if (exists) {
                    await prisma.commodity.update({
                        where: { id: row.id },
                        data: {
                            name: row.name,
                            category: row.category || null,
                            baseBatchElectricityUnits: baseUnits,
                            yieldPercentage: yieldPct,
                            wastagePercentage: wastagePct,
                        }
                    });
                    imported++;
                    continue;
                }
            }

            // Fallback: Check by name or create
            const existingName = await prisma.commodity.findFirst({
                where: { name: { equals: row.name, mode: 'insensitive' } }
            });

            if (existingName) {
                await prisma.commodity.update({
                    where: { id: existingName.id },
                    data: {
                        category: row.category || null,
                        baseBatchElectricityUnits: baseUnits,
                        yieldPercentage: yieldPct,
                        wastagePercentage: wastagePct,
                    }
                });
            } else {
                await prisma.commodity.create({
                    data: {
                        name: row.name,
                        category: row.category || null,
                        baseBatchElectricityUnits: baseUnits,
                        yieldPercentage: yieldPct,
                        wastagePercentage: wastagePct,
                    }
                });
            }
            imported++;
        }

        await logActivity({
            action: "UPDATE",
            entityType: "Commodity",
            entityId: "system",
            details: `Imported/Updated ${imported} commodities via CSV`
        });

        return { success: true, count: imported };
    } catch (error: any) {
        console.error("Import Commodities Error:", error);
        return { success: false, error: error.message || "Failed to import commodities" };
    }
}

export async function importVarieties(rows: any[]) {
    if (!rows || !rows.length) return { success: false, error: "No data provided" };
    try {
        let imported = 0;
        for (const row of rows) {
            if (!row.name) continue;

            const yieldPct = parseFloat(row.yieldPercentage) || 100;
            const wastagePct = parseFloat(row.wastagePercentage) || 0;

            // Resolve Commodity ID
            let validCommodityId = row.commodityId;
            if (row.commodityName) {
                const c = await prisma.commodity.findFirst({ where: { name: { equals: String(row.commodityName).trim(), mode: 'insensitive' } } });
                if (c) {
                    validCommodityId = c.id;
                } else {
                    return { success: false, error: `Parent commodity name '${row.commodityName}' not found. Please import 'Base Commodities' first!` };
                }
            } else if (validCommodityId) {
                const cExists = await prisma.commodity.findUnique({ where: { id: validCommodityId } });
                if (!cExists) {
                    return { success: false, error: `The old Commodity ID for '${row.name}' does not exist on this server. Please re-export your CSV from Dev to include 'commodityName' for auto-mapping.` };
                }
            }

            if (!validCommodityId) {
                return { success: false, error: `Commodity ID or Name completely missing for variety '${row.name}'` };
            }

            if (row.id) {
                const exists = await prisma.commodityVariety.findUnique({ where: { id: row.id } });
                if (exists) {
                    await prisma.commodityVariety.update({
                        where: { id: row.id },
                        data: {
                            name: row.name,
                            description: row.description || null,
                            yieldPercentage: yieldPct,
                            wastagePercentage: wastagePct,
                            commodityId: validCommodityId
                        }
                    });
                    imported++;
                    continue;
                }
            }

            // Create new
            await prisma.commodityVariety.create({
                data: {
                    name: row.name,
                    description: row.description || null,
                    yieldPercentage: yieldPct,
                    wastagePercentage: wastagePct,
                    commodityId: validCommodityId
                }
            });
            imported++;
        }
        return { success: true, count: imported };
    } catch (error: any) {
        console.error("Import Varieties Error:", error);
        return { success: false, error: error.message || "Failed to import varieties" };
    }
}

export async function importForms(rows: any[]) {
    if (!rows || !rows.length) return { success: false, error: "No data provided" };
    try {
        let imported = 0;
        for (const row of rows) {
            if (!row.formName) continue;

            // Resolve IDs by name if provided (This makes CSVs portable across environments)
            let validCommodityId = row.commodityId || null;
            let validVarietyId = row.varietyId || null;

            if (row.commodityName) {
                const c = await prisma.commodity.findFirst({ where: { name: { equals: String(row.commodityName).trim(), mode: 'insensitive' } } });
                if (c) {
                    validCommodityId = c.id;
                } else {
                    return { success: false, error: `Parent commodity '${row.commodityName}' not found. Please import 'Base Commodities' first!` };
                }
            } else if (validCommodityId) {
                const cExists = await prisma.commodity.findUnique({ where: { id: validCommodityId } });
                if (!cExists) {
                    return { success: false, error: `The old Commodity ID for '${row.formName}' does not exist on this server. Please re-export your CSV from Dev to include 'commodityName' for auto-mapping.` };
                }
            }

            if (row.varietyName) {
                const v = await prisma.commodityVariety.findFirst({ where: { name: { equals: String(row.varietyName).trim(), mode: 'insensitive' } } });
                if (v) {
                    validVarietyId = v.id;
                } else {
                    return { success: false, error: `Parent variety '${row.varietyName}' not found. Please import 'Crop Varieties' first!` };
                }
            } else if (validVarietyId) {
                const vExists = await prisma.commodityVariety.findUnique({ where: { id: validVarietyId } });
                if (!vExists) {
                    return { success: false, error: `The old Variety ID for '${row.formName}' does not exist on this server. Please re-export your CSV from Dev to include 'varietyName'.` };
                }
            }

            if (!validCommodityId && !validVarietyId) {
                return { success: false, error: `Form '${row.formName}' must belong to a valid Commodity or Variety. Both IDs missing or name lookup failed.` };
            }

            const yieldPct = parseFloat(row.yieldPercentage) || 100;
            const wastagePct = parseFloat(row.wastagePercentage) || 0;
            const elecMult = parseFloat(row.formElectricityMultiplier) || 0;

            if (row.id) {
                const exists = await prisma.varietyForm.findUnique({ where: { id: row.id } });
                if (exists) {
                    await prisma.varietyForm.update({
                        where: { id: row.id },
                        data: {
                            formName: row.formName,
                            yieldPercentage: yieldPct,
                            wastagePercentage: wastagePct,
                            formElectricityMultiplier: elecMult,
                            commodityId: validCommodityId,
                            varietyId: validVarietyId
                        } as any
                    });
                    imported++;
                    continue;
                }
            }

            // check unique constraint before create to avoid crashes
            const existingForm = await prisma.varietyForm.findFirst({
                where: {
                    formName: row.formName,
                    commodityId: validCommodityId,
                    varietyId: validVarietyId
                } as any
            });

            if (existingForm) {
                await prisma.varietyForm.update({
                    where: { id: existingForm.id },
                    data: {
                        yieldPercentage: yieldPct,
                        wastagePercentage: wastagePct,
                        formElectricityMultiplier: elecMult,
                    } as any
                });
            } else {
                await prisma.varietyForm.create({
                    data: {
                        formName: row.formName,
                        yieldPercentage: yieldPct,
                        wastagePercentage: wastagePct,
                        formElectricityMultiplier: elecMult,
                        commodityId: validCommodityId,
                        varietyId: validVarietyId
                    } as any
                });
            }
            imported++;
        }
        return { success: true, count: imported };
    } catch (error: any) {
        console.error("Import Forms Error:", error);
        return { success: false, error: error.message || "Failed to import forms" };
    }
}

export async function importDefaultWastage(rows: any[]) {
    if (!rows || !rows.length) return { success: false, error: "No data provided" };
    try {
        let imported = 0;
        for (const row of rows) {
            if (!row.commodityName) continue;

            const pct = parseFloat(row.defaultWastagePercentage) || 0;

            if (row.id) {
                const exists = await prisma.defaultWastageReference.findUnique({ where: { id: row.id } });
                if (exists) {
                    await prisma.defaultWastageReference.update({
                        where: { id: row.id },
                        data: {
                            commodityName: row.commodityName,
                            defaultWastagePercentage: pct,
                        }
                    });
                    imported++;
                    continue;
                }
            }

            // check unique constraint
            const existingName = await prisma.defaultWastageReference.findFirst({
                where: { commodityName: { equals: row.commodityName, mode: 'insensitive' } }
            });

            if (existingName) {
                await prisma.defaultWastageReference.update({
                    where: { id: existingName.id },
                    data: {
                        defaultWastagePercentage: pct,
                    }
                });
            } else {
                await prisma.defaultWastageReference.create({
                    data: {
                        commodityName: row.commodityName,
                        defaultWastagePercentage: pct,
                    }
                });
            }
            imported++;
        }
        return { success: true, count: imported };
    } catch (error: any) {
        console.error("Import Default Wastage Error:", error);
        return { success: false, error: error.message || "Failed to import default wastage" };
    }
}
