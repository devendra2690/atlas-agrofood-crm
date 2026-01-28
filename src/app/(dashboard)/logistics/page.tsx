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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default async function LogisticsPage({
    searchParams,
}: {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
    const params = await searchParams;
    const page = typeof params.page === 'string' ? parseInt(params.page) : 1;
    const view = typeof params.view === 'string' ? params.view : 'kanban';
    // For now fetch enough to populate both (limitation: standard limit applies to total)
    const limit = view === 'kanban' ? 100 : 20;
    const status = typeof params.status === 'string' ? params.status : undefined;

    const { data: shipments, success, pagination } = await getShipments({
        page,
        limit,
        status
    });

    if (!success || !shipments) {
        return <div className="p-8">Failed to load logistics data.</div>;
    }

    const inboundShipments = shipments.filter((s: any) => !!s.purchaseOrder);
    const outboundShipments = shipments.filter((s: any) => !!s.salesOrder);

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

            <div className="flex-1 min-h-0 mt-4">
                <Tabs defaultValue="inbound" className="h-full flex flex-col">
                    <TabsList>
                        <TabsTrigger value="inbound">Inbound (Purchase Orders)</TabsTrigger>
                        <TabsTrigger value="outbound">Outbound (Sales Orders)</TabsTrigger>
                    </TabsList>

                    <TabsContent value="inbound" className="flex-1 overflow-hidden h-full">
                        {view === 'kanban' ? (
                            <div className="h-full overflow-hidden mt-4">
                                {/* @ts-ignore */}
                                <LogisticsKanban shipments={inboundShipments} />
                            </div>
                        ) : (
                            <ShipmentTable shipments={inboundShipments} />
                        )}
                    </TabsContent>

                    <TabsContent value="outbound" className="flex-1 overflow-hidden h-full">
                        {view === 'kanban' ? (
                            <div className="h-full overflow-hidden mt-4">
                                {/* @ts-ignore */}
                                <LogisticsKanban shipments={outboundShipments} />
                            </div>
                        ) : (
                            <ShipmentTable shipments={outboundShipments} />
                        )}
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
}

function ShipmentTable({ shipments }: { shipments: any[] }) {
    return (
        <Card className="h-full flex flex-col">
            <CardHeader>
                <CardTitle>Shipments</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 overflow-auto">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Order #</TableHead>
                            <TableHead>Context</TableHead>
                            <TableHead>Carrier</TableHead>
                            <TableHead>ETA</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {shipments.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center h-24">
                                    No shipments found.
                                </TableCell>
                            </TableRow>
                        ) : (
                            shipments.map((s: any) => (
                                <TableRow key={s.id}>
                                    <TableCell>
                                        {s.purchaseOrderId
                                            ? `PO #${s.purchaseOrderId.slice(0, 8).toUpperCase()}`
                                            : `SO #${s.salesOrderId?.slice(0, 8).toUpperCase()}`
                                        }
                                    </TableCell>
                                    <TableCell>
                                        {s.purchaseOrderId
                                            ? s.purchaseOrder?.vendor?.name
                                            : s.salesOrder?.client?.name || "N/A"
                                        }
                                    </TableCell>
                                    <TableCell>{s.carrier}</TableCell>
                                    <TableCell>{s.eta ? format(new Date(s.eta), 'PP') : 'N/A'}</TableCell>
                                    <TableCell>
                                        <Badge variant="outline">{s.status}</Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Link
                                            href={s.purchaseOrderId ? `/purchase-orders/${s.purchaseOrderId}` : `/sales-orders/${s.salesOrderId}`}
                                            className="text-primary hover:underline"
                                        >
                                            View
                                        </Link>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}

