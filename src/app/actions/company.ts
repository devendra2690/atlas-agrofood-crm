'use server'

import { prisma } from "@/lib/prisma";
import { Company, CompanyType, CompanyStatus, TrustLevel } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";

export type CompanyFormData = {
    name: string;
    type: CompanyType;
    phone?: string;
    email?: string;
    countryId?: string;
    stateId?: string;
    cityId?: string;
    commodityIds?: string[];
};

export async function createCompany(data: CompanyFormData) {
    try {
        const session = await auth();
        const company = await prisma.company.create({
            data: {
                createdById: session?.user?.id,
                updatedById: session?.user?.id,
                name: data.name,
                type: data.type,
                phone: data.phone,
                email: data.email,
                countryId: data.countryId || undefined,
                stateId: data.stateId || undefined,
                cityId: data.cityId || undefined,
                status: "ACTIVE",
                commodities: data.commodityIds && data.commodityIds.length > 0 ? {
                    connect: data.commodityIds.map(id => ({ id }))
                } : undefined
            },
        });

        revalidatePath("/companies");
        return { success: true, data: company };
    } catch (error) {
        console.error("Failed to create company:", error);
        return { success: false, error: "Failed to create company" };
    }
}

export async function updateCompany(id: string, data: CompanyFormData) {
    try {
        const session = await auth();
        const company = await prisma.company.update({
            where: { id },
            data: {
                updatedById: session?.user?.id,
                name: data.name,
                type: data.type,
                phone: data.phone,
                email: data.email,
                countryId: data.countryId || null,
                stateId: data.stateId || null,
                cityId: data.cityId || null,
                commodities: data.commodityIds ? {
                    set: [], // Clear existing
                    connect: data.commodityIds.map(id => ({ id }))
                } : undefined
            },
        });

        revalidatePath("/companies");
        revalidatePath(`/companies/${id}`);
        return { success: true, data: company };
    } catch (error) {
        console.error("Failed to update company:", error);
        return { success: false, error: "Failed to update company" };
    }
}

export async function deleteCompany(id: string) {
    try {
        await prisma.company.delete({
            where: { id }
        });

        revalidatePath("/companies");
        return { success: true };
    } catch (error) {
        console.error("Failed to delete company:", error);
        return { success: false, error: "Failed to delete company" };
    }
}

export async function updateCompanyTrustLevel(id: string, trustLevel: TrustLevel) {
    try {
        const session = await auth();
        const company = await prisma.company.update({
            where: { id },
            data: {
                updatedById: session?.user?.id,
                trustLevel
            }
        });

        revalidatePath(`/vendors/${id}`);
        revalidatePath("/vendors");
        revalidatePath("/samples"); // Updates filters
        return { success: true, data: company };
    } catch (error) {
        console.error("Failed to update trust level:", error);
        return { success: false, error: "Failed to update trust level" };
    }
}

export async function getCompanies() {
    try {
        const companies = await prisma.company.findMany({
            where: {
                type: {
                    not: "VENDOR"
                }
            },
            orderBy: { createdAt: "desc" },
            include: {
                _count: {
                    select: {
                        interactions: true,
                        salesOpportunities: true,
                        projectVendors: true
                    }
                },
                commodities: true,
                country: true,
                state: true,
                city: true
            }
        });
        return { success: true, data: companies };
    } catch (error) {
        console.error("Failed to get companies:", error);
        return { success: false, error: "Failed to fetch companies" };
    }
}

export async function getCompany(id: string) {
    try {
        const company = await prisma.company.findUnique({
            where: { id },
            include: {
                interactions: {
                    orderBy: { date: 'desc' },
                    include: {
                        user: true
                    }
                },
                salesOpportunities: {
                    orderBy: { createdAt: 'desc' }
                },
                projectVendors: {
                    include: {
                        project: true
                    }
                },
                _count: {
                    select: {
                        salesOrders: true,
                        purchaseOrders: true,
                        projectVendors: true
                    }
                },
                commodities: true,
                country: true,
                state: true,
                city: true
            }
        });

        if (!company) {
            return { success: false, error: "Company not found" };
        }

        const safeCompany = {
            ...company,
            salesOpportunities: company.salesOpportunities.map(opp => ({
                ...opp,
                targetPrice: opp.targetPrice?.toNumber(),
                quantity: opp.quantity?.toNumber(),
                procurementQuantity: opp.procurementQuantity?.toNumber(),
            }))
        };

        return { success: true, data: safeCompany };
    } catch (error) {
        console.error("Failed to get company:", error);
        return { success: false, error: "Failed to fetch company details" };
    }
}

export async function getVendors() {
    try {
        const vendors = await prisma.company.findMany({
            where: { type: "VENDOR" },
            orderBy: { name: "asc" },
            include: {
                _count: {
                    select: {
                        projectVendors: true,
                        purchaseOrders: true,
                        sampleRecords: true
                    }
                },
                commodities: true,
                city: true,
                state: true,
                country: true
            }
        });
        return { success: true, data: vendors };
    } catch (error) {
        console.error("Failed to get vendors:", error);
        return { success: false, error: "Failed to fetch vendors" };
    }
}

