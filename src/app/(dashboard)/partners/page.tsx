import { getVendors } from "@/app/actions/company";
import { getCommodities } from "@/app/actions/commodity";
import { VendorTable } from "../vendors/_components/vendor-table"; // Reuse VendorTable for now as structure is identical
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { CompanyDialog } from "../companies/_components/company-dialog";
import { VendorFilters } from "../vendors/_components/vendor-filters"; // Reuse Filters
import { PaginationControls } from "@/components/ui/pagination-controls";
import { getCountries } from "@/app/actions/location";

export default async function PartnersPage({
    searchParams,
}: {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
    const params = await searchParams;
    const location = typeof params.location === 'string' ? params.location : undefined;
    const commodityId = typeof params.commodityId === 'string' ? params.commodityId : undefined;
    const trustLevel = typeof params.trustLevel === 'string' ? params.trustLevel : undefined;

    // Pagination params
    const page = typeof params.page === 'string' ? parseInt(params.page) : 1;
    const limit = 10;

    // Fetch Partners (using getVendors with type PARTNER - need to verify if getVendors supports explicit type override or if we need a new action)
    // Actually getVendors in company.ts forces type="VENDOR". I need to check company.ts again. 
    // If getVendors is hardcoded, I should add getPartners or make getVendors more flexible.

    // Let's assume for a moment I will update company.ts to export `getCompaniesByType` or similar, 
    // or I'll just add `getPartners`. 
    // For now, I'll use a placeholder and fix the action in the next step.
    const [partnersRes, commoditiesRes, countriesRes] = await Promise.all([
        getVendors({ location, commodityId, trustLevel, page, limit, type: "PARTNER" }), // Casting to any to temporarily bypass TS if strictly typed, but I need to update the action.
        getCommodities(),
        getCountries()
    ]);

    const partners = partnersRes.data;
    const pagination = partnersRes.pagination;
    const commodities = commoditiesRes.data;
    const countries = countriesRes.data;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Partners</h2>
                    <p className="text-muted-foreground">
                        Manage your strategic partners.
                    </p>
                </div>
                <div className="flex gap-2">
                    <CompanyDialog
                        defaultType={"PARTNER" as any}
                        initialCommodities={commodities || []}
                        initialCountries={countries || []}
                        buttonLabel="Add Partner"
                    />
                </div>
            </div>

            <VendorFilters commodities={commodities || []} />

            <Card>
                <CardHeader>
                    <CardTitle>All Partners</CardTitle>
                    <CardDescription>
                        List of companies marked as PARTNER.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <VendorTable
                        vendors={partners || []}
                        initialCommodities={commodities || []}
                        initialCountries={countries || []}
                        basePath="/partners"
                    />
                    {pagination && (
                        <PaginationControls
                            hasNextPage={pagination.page < pagination.totalPages}
                            hasPrevPage={pagination.page > 1}
                            totalPages={pagination.totalPages}
                            currentPage={pagination.page}
                        />
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
