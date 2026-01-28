import { getShipments } from "@/app/actions/logistics";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { Truck } from "lucide-react";
import Link from "next/link";
import { PaginationControls } from "@/components/ui/pagination-controls";
import { LogisticsFilters } from "./_components/logistics-filters";
import { LogisticsKanban } from "./_components/logistics-kanban";

export default async function LogisticsPage({
    searchParams,
}: {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
    const params = await searchParams;
    const page = typeof params.page === 'string' ? parseInt(params.page) : 1;
    const view = typeof params.view === 'string' ? params.view : 'kanban';
    const limit = view === 'kanban' ? 50 : 10;
    const status = typeof params.status === 'string' ? params.status : undefined;

    const { data: shipments, success, pagination } = await getShipments({
        page,
        limit,
        status
    });

    if (!success || !shipments) {
        return <div className="p-8">Failed to load logistics data.</div>;
    }

    return (
        <div className="flex-1 space-y-4 p-8 pt-6 h-[calc(100vh-60px)] flex flex-col">
            <div className="flex items-center justify-between space-y-2 shrink-0">
                <h2 className="text-3xl font-bold tracking-tight">Logistics</h2>
                <div className="flex bg-muted p-1 rounded-md">
                    <Link
                        href="?view=list"
                        className={`px-3 py-1 text-sm rounded-sm transition-all ${view !== 'kanban' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                    >
                        List
                    </Link>
                    <Link
                        href="?view=kanban"
                        className={`px-3 py-1 text-sm rounded-sm transition-all ${view === 'kanban' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                    >
                        Kanban
                    </Link>
                </div>
            </div>

            {view === 'list' && (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 shrink-0">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">In Transit</CardTitle>
                            <Truck className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {shipments.filter((s: any) => s.status === 'IN_TRANSIT').length}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            {view === 'list' && <LogisticsFilters />}

            <div className="flex-1 min-h-0">
                {view === 'kanban' ? (
                    <div className="h-full overflow-hidden mt-4">
                        {/* @ts-ignore - types generally match but prisma relations can be strict */}
                        <LogisticsKanban shipments={shipments || []} />
                    </div>
                ) : (
                    <Card className="h-full flex flex-col">
                        <CardHeader>
                            <CardTitle>Active Shipments</CardTitle>
                        </CardHeader>
                        <CardContent className="flex-1 overflow-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>PO #</TableHead>
                                        <TableHead>Project</TableHead>
                                        <TableHead>Vendor</TableHead>
                                        <TableHead>Carrier</TableHead>
                                        <TableHead>ETA</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {shipments.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={7} className="text-center h-24">
                                                No active shipments found.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        shipments.map((shipment: any) => (
                                            <TableRow key={shipment.id}>
                                                <TableCell className="font-medium">
                                                    {shipment.purchaseOrder.id.slice(0, 8).toUpperCase()}
                                                </TableCell>
                                                <TableCell>{shipment.purchaseOrder.project.name}</TableCell>
                                                <TableCell>{shipment.purchaseOrder.vendor.name}</TableCell>
                                                <TableCell>{shipment.carrier || "-"}</TableCell>
                                                <TableCell>
                                                    {shipment.eta ? format(new Date(shipment.eta), "PP") : "-"}
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant={shipment.status === 'IN_TRANSIT' ? 'default' : 'secondary'}>
                                                        {shipment.status}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <Link href={`/purchase-orders/${shipment.purchaseOrder.id}`} className="text-blue-600 hover:underline text-sm">
                                                        View Order
                                                    </Link>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                            {pagination && (
                                <div className="mt-4">
                                    <PaginationControls
                                        hasNextPage={pagination.page < pagination.totalPages}
                                        hasPrevPage={pagination.page > 1}
                                        totalPages={pagination.totalPages}
                                        currentPage={pagination.page}
                                    />
                                </div>
                            )}
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    );
}
