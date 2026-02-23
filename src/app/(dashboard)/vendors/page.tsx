import { getVendors } from "@/app/actions/company";
import { getCommodities } from "@/app/actions/commodity";
import { VendorTable } from "./_components/vendor-table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { CompanyDialog } from "../companies/_components/company-dialog";
import { ExportButton } from "../companies/_components/export-button";
import { ImportDialog } from "../companies/_components/import-dialog";
import { VendorFilters } from "./_components/vendor-filters";
import { PaginationControls } from "@/components/ui/pagination-controls";

import { getCountries } from "@/app/actions/location";

export default async function VendorsPage({
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

    const [vendorsRes, commoditiesRes, countriesRes] = await Promise.all([
        getVendors({ location, commodityId, trustLevel, page, limit }),
        getCommodities(),
        getCountries()
    ]);

    const vendors = vendorsRes.data;
    const pagination = vendorsRes.pagination;
    const commodities = commoditiesRes.data;
    const countries = countriesRes.data;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Vendors</h2>
                    <p className="text-muted-foreground">
                        Manage your suppliers and procurement partners.
                    </p>
                </div>
                <div className="flex gap-2">
                    <ExportButton category="VENDOR" />
                    <ImportDialog category="VENDOR" />
                    <CompanyDialog
                        defaultType="VENDOR"
                        initialCommodities={commodities || []}
                        initialCountries={countries || []}
                        buttonLabel="Add Vendor"
                    />
                </div>
            </div>

            <VendorFilters commodities={commodities || []} />

            <Card>
                <CardHeader>
                    <CardTitle>All Vendors</CardTitle>
                    <CardDescription>
                        List of companies marked as VENDOR.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <VendorTable
                        vendors={vendors || []}
                        initialCommodities={commodities || []}
                        initialCountries={countries || []}
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
