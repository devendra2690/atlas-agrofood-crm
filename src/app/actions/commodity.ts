'use server'

import { prisma } from "@/lib/prisma";

export async function getCommodities() {
    try {
        const commodities = await prisma.commodity.findMany({
            orderBy: { name: 'asc' }
        });
        return { success: true, data: commodities };
    } catch (error) {
        console.error("Failed to get commodities:", error);
        return { success: false, error: "Failed to fetch commodities" };
    }
}

export async function createCommodity(name: string, yieldPercentage: number = 100) {
    try {
        const commodity = await prisma.commodity.create({
            data: {
                name,
                yieldPercentage
            }
        });
        return { success: true, data: commodity };
    } catch (error) {
        console.error("Failed to create commodity:", error);
        return { success: false, error: "Failed to create commodity" };
    }
}

export async function deleteCommodity(id: string) {
    try {
        await prisma.commodity.delete({
            where: { id }
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
            orderBy: { name: 'asc' }
        });
        return { success: true, data: varieties };
    } catch (error) {
        console.error("Failed to get varieties:", error);
        return { success: false, error: "Failed to fetch varieties" };
    }
}

export async function createCommodityVariety(commodityId: string, name: string) {
    try {
        const variety = await prisma.commodityVariety.create({
            data: {
                name,
                commodityId
            }
        });
        return { success: true, data: variety };
    } catch (error) {
        console.error("Failed to create variety:", error);
        return { success: false, error: "Failed to create variety" };
    }
}

export async function deleteCommodityVariety(id: string) {
    try {
        await prisma.commodityVariety.delete({
            where: { id }
        });
        return { success: true };
    } catch (error) {
        console.error("Failed to delete variety:", error);
        return { success: false, error: "Failed to delete variety" };
    }
}
