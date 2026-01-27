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

export async function getCompanies(filters?: {
    query?: string;
    location?: string;
    commodityId?: string;
    trustLevel?: string;
    page?: number;
    limit?: number;
    type?: CompanyType; // Add type filter support if needed/used
}) {
    try {
        const where: any = {
            type: {
                not: "VENDOR"
            }
        };

        if (filters?.trustLevel && filters.trustLevel !== 'all') {
            where.trustLevel = filters.trustLevel as TrustLevel;
        }



        // Refined Logic for Query + Location mixing
        // If both exist, we need AND condition for the groups.
        const conditions: any[] = [];

        if (filters?.type) {
            // We already set type at top level, but let's keep it clean.
        }

        if (filters?.location) {
            conditions.push({
                OR: [
                    { city: { name: { contains: filters.location, mode: 'insensitive' } } },
                    { state: { name: { contains: filters.location, mode: 'insensitive' } } },
                    { country: { name: { contains: filters.location, mode: 'insensitive' } } }
                ]
            });
        }

        if (filters?.query) {
            conditions.push({
                OR: [
                    { name: { contains: filters.query, mode: 'insensitive' } },
                    { email: { contains: filters.query, mode: 'insensitive' } },
                    { phone: { contains: filters.query, mode: 'insensitive' } }
                ]
            });
        }

        if (conditions.length > 0) {
            where.AND = conditions;
        }

        const page = filters?.page || 1;
        const limit = filters?.limit || 10;
        const skip = (page - 1) * limit;

        const [companies, total] = await prisma.$transaction([
            prisma.company.findMany({
                where,
                orderBy: { createdAt: "desc" },
                skip,
                take: limit,
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
            }),
            prisma.company.count({ where })
        ]);

        return {
            success: true,
            data: companies,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            }
        };
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

export async function getVendors(filters?: {
    location?: string;
    commodityId?: string;
    trustLevel?: string;
    page?: number;
    limit?: number;
}) {
    try {
        const where: any = { type: "VENDOR" };
        const page = filters?.page || 1;
        const limit = filters?.limit || 10;
        const skip = (page - 1) * limit;

        if (filters?.location) {
            where.OR = [
                { city: { name: { contains: filters.location, mode: 'insensitive' } } },
                { state: { name: { contains: filters.location, mode: 'insensitive' } } },
                { country: { name: { contains: filters.location, mode: 'insensitive' } } }
            ];
        }

        if (filters?.commodityId && filters.commodityId !== 'all') {
            where.commodities = {
                some: {
                    id: filters.commodityId
                }
            };
        }

        if (filters?.trustLevel && filters.trustLevel !== 'all') {
            where.trustLevel = filters.trustLevel as TrustLevel;
        }

        const [vendors, total] = await prisma.$transaction([
            prisma.company.findMany({
                where,
                orderBy: { name: "asc" },
                skip,
                take: limit,
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
            }),
            prisma.company.count({ where })
        ]);

        return {
            success: true,
            data: vendors,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            }
        };
    } catch (error) {
        console.error("Failed to get vendors:", error);
        return { success: false, error: "Failed to fetch vendors" };
    }
}

