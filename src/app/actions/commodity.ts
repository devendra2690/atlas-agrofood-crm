'use server'

import { prisma } from "@/lib/prisma";
import { logActivity } from "./audit";

export async function getCommodities() {
    try {
        const commodities = await prisma.commodity.findMany({
            orderBy: { name: 'asc' },
            include: {
                forms: true, // Include direct forms
                varieties: {
                    include: { forms: true }, // Include variety forms
                    orderBy: { name: 'asc' }
                }
            }
        });
        return { success: true, data: commodities };
    } catch (error) {
        console.error("Failed to get commodities:", error);
        return { success: false, error: "Failed to fetch commodities" };
    }
}


export async function createCommodity(name: string, yieldPercentage: number = 100, wastagePercentage: number = 0, category?: string, baseBatchElectricityUnits?: number) {
    try {
        let finalUnits = baseBatchElectricityUnits || 0;

        // Apply automatic defaults based on Category if units not explicitly provided
        if (!baseBatchElectricityUnits && category) {
            const cat = category.trim().toLowerCase();
            if (cat === 'leafy') finalUnits = 70;
            else if (cat === 'bulb') finalUnits = 115;
            else if (cat === 'fruit') finalUnits = 220;
        }

        const commodity = await prisma.commodity.create({
            data: {
                name,
                yieldPercentage,
                wastagePercentage,
                category,
                baseBatchElectricityUnits: finalUnits
            }
        });
        await logActivity({
            action: "CREATE",
            entityType: "Commodity",
            entityId: commodity.id,
            details: `Created commodity: ${name}`
        });
        return { success: true, data: commodity };
    } catch (error) {
        console.error("Failed to create commodity:", error);
        return { success: false, error: "Failed to create commodity" };
    }
}

export async function updateCommodity(id: string, name?: string, yieldPercentage?: number, wastagePercentage?: number, documentTemplate?: any, category?: string, baseBatchElectricityUnits?: number) {
    try {
        const updateData: any = {};

        if (name !== undefined) updateData.name = name;
        if (yieldPercentage !== undefined) updateData.yieldPercentage = yieldPercentage;
        if (wastagePercentage !== undefined) updateData.wastagePercentage = wastagePercentage;
        if (documentTemplate !== undefined) updateData.documentTemplate = documentTemplate;
        if (category !== undefined) updateData.category = category;
        if (baseBatchElectricityUnits !== undefined) updateData.baseBatchElectricityUnits = baseBatchElectricityUnits;

        const commodity = await prisma.commodity.update({
            where: { id },
            data: updateData
        });

        await logActivity({
            action: "UPDATE",
            entityType: "Commodity",
            entityId: commodity.id,
            details: `Updated commodity: ${name || commodity.name}`
        });
        return { success: true, data: commodity };
    } catch (error) {
        console.error("Failed to update commodity:", error);
        return { success: false, error: "Failed to update commodity" };
    }
}

export async function getCommodity(id: string) {
    try {
        const commodity = await prisma.commodity.findUnique({
            where: { id }
        });
        return { success: true, data: commodity };
    } catch (error) {
        console.error("Failed to get commodity:", error);
        return { success: false, error: "Failed to fetch commodity" };
    }
}

export async function deleteCommodity(id: string) {
    try {
        await prisma.commodity.delete({
            where: { id }
        });
        await logActivity({
            action: "DELETE",
            entityType: "Commodity",
            entityId: id,
            details: "Deleted commodity"
        });
        return { success: true };
    } catch (error) {
        console.error("Failed to delete commodity:", error);
        return { success: false, error: "Failed to delete commodity" };
    }
}

export async function getCommodityVarieties(commodityId: string) {
    try {
        const varieties = await prisma.commodityVariety.findMany({
            where: { commodityId },
            include: {
                forms: true // Include forms
            },
            orderBy: { name: 'asc' }
        });
        return { success: true, data: varieties };
    } catch (error) {
        console.error("Failed to get varieties:", error);
        return { success: false, error: "Failed to fetch varieties" };
    }
}

export async function createCommodityVariety(commodityId: string, name: string, yieldPercentage: number = 100, wastagePercentage: number = 0) {
    try {
        const variety = await prisma.commodityVariety.create({
            data: {
                name,
                commodityId,
                yieldPercentage,
                wastagePercentage
            }
        });
        await logActivity({
            action: "CREATE",
            entityType: "CommodityVariety",
            entityId: variety.id,
            details: `Created variety: ${name} with yield ${yieldPercentage}%`
        });
        return { success: true, data: variety };
    } catch (error) {
        console.error("Failed to create variety:", error);
        return { success: false, error: "Failed to create variety" };
    }
}

export async function updateCommodityVariety(id: string, name?: string, yieldPercentage?: number, wastagePercentage?: number) {
    try {
        const updateData: any = {};
        if (name !== undefined) updateData.name = name;
        if (yieldPercentage !== undefined) updateData.yieldPercentage = yieldPercentage;
        if (wastagePercentage !== undefined) updateData.wastagePercentage = wastagePercentage;

        const variety = await prisma.commodityVariety.update({
            where: { id },
            data: updateData
        });

        await logActivity({
            action: "UPDATE",
            entityType: "CommodityVariety",
            entityId: variety.id,
            details: `Updated variety: ${variety.name}`
        });
        return { success: true, data: variety };
    } catch (error) {
        console.error("Failed to update variety:", error);
        return { success: false, error: "Failed to update variety" };
    }
}

export async function deleteCommodityVariety(id: string) {
    try {
        await prisma.commodityVariety.delete({
            where: { id }
        });
        await logActivity({
            action: "DELETE",
            entityType: "CommodityVariety",
            entityId: id,
            details: "Deleted variety"
        });
        return { success: true };
    } catch (error) {
        console.error("Failed to delete variety:", error);
        return { success: false, error: "Failed to delete variety" };
    }
}

// Form Actions

export async function addCommodityForm(commodityId: string, formName: string, yieldPercentage: number, wastagePercentage: number, formElectricityMultiplier?: number) {
    try {
        let multiplier = formElectricityMultiplier || 0.0;
        if (!formElectricityMultiplier && formName.toLowerCase().includes('powder')) {
            multiplier = 0.1;
        }

        const form = await prisma.varietyForm.create({
            data: {
                commodityId,
                formName,
                yieldPercentage,
                wastagePercentage,
                formElectricityMultiplier: multiplier
            }
        });
        return { success: true, data: form };
    } catch (error) {
        console.error("Failed to add commodity form:", error);
        return { success: false, error: "Failed to add commodity form" };
    }
}

export async function addVarietyForm(varietyId: string, formName: string, yieldPercentage: number, wastagePercentage: number, formElectricityMultiplier?: number) {
    try {
        let multiplier = formElectricityMultiplier || 0.0;
        if (!formElectricityMultiplier && formName.toLowerCase().includes('powder')) {
            multiplier = 0.1;
        }

        const form = await prisma.varietyForm.create({
            data: {
                varietyId,
                formName,
                yieldPercentage,
                wastagePercentage,
                formElectricityMultiplier: multiplier
            }
        });
        return { success: true, data: form };
    } catch (error) {
        console.error("Failed to add variety form:", error);
        return { success: false, error: "Failed to add variety form" };
    }
}

export async function updateVarietyForm(id: string, formName?: string, yieldPercentage?: number, wastagePercentage?: number, formElectricityMultiplier?: number) {
    try {
        const updateData: any = {};
        if (formName !== undefined) {
            updateData.formName = formName;
            if (formElectricityMultiplier === undefined && formName.toLowerCase().includes('powder')) {
                updateData.formElectricityMultiplier = 0.1;
            }
        }
        if (yieldPercentage !== undefined) updateData.yieldPercentage = yieldPercentage;
        if (wastagePercentage !== undefined) updateData.wastagePercentage = wastagePercentage;
        if (formElectricityMultiplier !== undefined) updateData.formElectricityMultiplier = formElectricityMultiplier;

        const form = await prisma.varietyForm.update({
            where: { id },
            data: updateData
        });
        return { success: true, data: form };
    } catch (error) {
        console.error("Failed to update variety form:", error);
        return { success: false, error: "Failed to update variety form" };
    }
}

export async function deleteVarietyForm(id: string) {
    try {
        await prisma.varietyForm.delete({
            where: { id }
        });
        return { success: true };
    } catch (error) {
        console.error("Failed to delete variety form:", error);
        return { success: false, error: "Failed to delete variety form" };
    }
}

// Default Wastage Reference Actions

export async function getDefaultWastage(commodityName: string) {
    if (!commodityName || commodityName.trim() === "") return { success: true, data: null };
    try {
        const reference = await prisma.defaultWastageReference.findFirst({
            where: {
                commodityName: {
                    equals: commodityName.trim(),
                    mode: 'insensitive' // case-insensitive match
                }
            }
        });
        return { success: true, data: reference };
    } catch (error) {
        console.error("Failed to fetch default wastage:", error);
        return { success: false, error: "Failed to fetch default wastage" };
    }
}

export async function getAllDefaultWastages() {
    try {
        const data = await prisma.defaultWastageReference.findMany();
        return { success: true, data };
    } catch (error) {
        console.error("Failed to fetch all default wastages:", error);
        return { success: false, error: "Failed to fetch all default wastages" };
    }
}
