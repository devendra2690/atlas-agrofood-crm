import { getProcurementProjects } from "@/app/actions/procurement";
import { getCommodities } from "@/app/actions/commodity";
import { ProcurementList } from "./_components/procurement-list";
import { ProcurementDialog } from "./_components/procurement-dialog";
import { ProcurementFilters } from "./_components/procurement-filters";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PaginationControls } from "@/components/ui/pagination-controls";

export default async function ProcurementPage({
    searchParams,
}: {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
    const params = await searchParams;
    const page = typeof params.page === 'string' ? parseInt(params.page) : 1;
    const limit = 10;
    const query = typeof params.query === 'string' ? params.query : undefined;
    const status = typeof params.status === 'string' ? params.status : undefined;
    const commodityId = typeof params.commodityId === 'string' ? params.commodityId : undefined;

    const { data: projects, pagination } = await getProcurementProjects({
        page,
        limit,
        query,
        status,
        commodityId
    });
    const { data: commodities } = await getCommodities();

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Procurement</h2>
                    <p className="text-muted-foreground">
                        Manage sourcing projects, vendor samples, and purchase orders.
                    </p>
                </div>
                <ProcurementDialog commodities={commodities || []} />
            </div>

            <ProcurementFilters commodities={commodities || []} />

            <Card>
                <CardHeader>
                    <CardTitle>Sourcing Projects</CardTitle>
                    <CardDescription>
                        Active projects for sourcing commodities.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <ProcurementList projects={projects || []} commodities={commodities || []} />
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
