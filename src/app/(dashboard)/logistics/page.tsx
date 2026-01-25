
import { getShipments } from "@/app/actions/logistics";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { Truck } from "lucide-react";
import Link from "next/link";

export default async function LogisticsPage() {
    const { data: shipments, success } = await getShipments();

    if (!success || !shipments) {
        return <div className="p-8">Failed to load logistics data.</div>;
    }

    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            <div className="flex items-center justify-between space-y-2">
                <h2 className="text-3xl font-bold tracking-tight">Logistics</h2>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
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

            <Card>
                <CardHeader>
                    <CardTitle>Active Shipments</CardTitle>
                </CardHeader>
                <CardContent>
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
                </CardContent>
            </Card>
        </div>
    );
}
