import { getOpportunities } from "@/app/actions/opportunity";
import { getCompanies } from "@/app/actions/company";
import { getCommodities } from "@/app/actions/commodity";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { OpportunityList } from "./_components/opportunity-list";
import { OpportunityDialog } from "./_components/opportunity-dialog";
import { PaginationControls } from "@/components/ui/pagination-controls";
import { OpportunityFilters } from "./_components/opportunity-filters";
import { OpportunityBoard } from "./_components/opportunity-board";
import { OpportunityViewToggle } from "./_components/opportunity-view-toggle";

export default async function OpportunitiesPage({
    searchParams,
}: {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
    const params = await searchParams;
    const page = typeof params.page === 'string' ? parseInt(params.page) : 1;
    const view = typeof params.view === 'string' ? params.view : 'board';
    const limit = view === 'board' ? 1000 : 10; // Fetch all (effectively) for board view
    const query = typeof params.query === 'string' ? params.query : undefined;
    const status = typeof params.status === 'string' ? params.status : undefined;
    const date = typeof params.date === 'string' ? params.date : undefined;
    const highlight = typeof params.highlight === 'string' ? params.highlight : undefined;

    console.log(`DEBUG: Page ${page}, Highlight: ${highlight}`);

    const [
        { data: opportunities, pagination },
        { data: companies },
        allCommoditiesResponse
    ] = await Promise.all([
        getOpportunities({
            page,
            limit,
            query,
            status,
            date,
            priorityId: highlight
        }),
        getCompanies({ limit: 1000 }),
        getCommodities()
    ]);

    // Flatten result to get array
    const allCommodities = allCommoditiesResponse.data;

    // Filter only companies that are clients or prospects for the dropdown
    const clientOptions = companies?.filter(c => c.type === 'CLIENT' || c.type === 'PROSPECT').map(c => ({
        id: c.id,
        name: c.name,
        commodities: c.commodities // Pass commodities
    })) || [];

    const partnerOptions = companies?.filter(c => c.type === 'PARTNER' || c.type === 'VENDOR').map(c => ({
        id: c.id,
        name: c.name,
        type: c.type // Keep type for filtering in dialog
    })) || [];

    // Sanitize opportunities for Client Components (Decimal to Number)
    const safeOpportunities = opportunities?.map(opp => ({
        ...opp,
        targetPrice: opp.targetPrice ? Number(opp.targetPrice) : null,
        quantity: opp.quantity ? Number(opp.quantity) : null,
        procurementQuantity: opp.procurementQuantity ? Number(opp.procurementQuantity) : null,
    })) || [];

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Sales Opportunities</h2>
                    <p className="text-muted-foreground">
                        Manage your active deals and pipeline.
                    </p>
                </div>
                <div className="flex items-center gap-4">
                    <OpportunityViewToggle />
                    <OpportunityDialog companies={clientOptions} commodities={allCommodities || []} />
                </div>
            </div>

            <OpportunityFilters />

            {view === 'board' ? (
                <div className="h-[calc(100vh-220px)]">
                    <OpportunityBoard
                        opportunities={safeOpportunities}
                        companies={clientOptions}
                        partners={partnerOptions}
                        commodities={allCommodities || []}
                    />
                </div>
            ) : (
                <Card>
                    <CardHeader>
                        <CardTitle>Active Deals</CardTitle>
                        <CardDescription>
                            Track progress on all open opportunities.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <OpportunityList
                            opportunities={safeOpportunities}
                            companies={clientOptions}
                            partners={partnerOptions}
                            commodities={allCommodities || []}
                            initialExpandedId={highlight}
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
            )}
        </div>
    );
}
