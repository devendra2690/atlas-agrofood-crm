"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { Truck, Plus } from "lucide-react";
import { createShipment } from "@/app/actions/logistics";
import { toast } from "sonner";
import { SalesOrder } from "@prisma/client";

interface SalesShipmentManagerProps {
    orderId: string;
    orderStatus: string;
    shipments: any[];
    invoiceCount: number;
}

export function SalesShipmentManager({ orderId, orderStatus, shipments, invoiceCount }: SalesShipmentManagerProps) {
    const [isShipmentOpen, setIsShipmentOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    // Shipment Form
    const [carrier, setCarrier] = useState("");
    const [trackingNumber, setTrackingNumber] = useState("");
    const [eta, setEta] = useState("");
    const [quantity, setQuantity] = useState("");
    const [notes, setNotes] = useState("");

    if (!mounted) return null;

    const handleCreateShipment = async () => {
        if (invoiceCount === 0) {
            toast.error("Cannot create shipment: No Invoice generated yet.");
            return;
        }

        setLoading(true);
        const result = await createShipment({
            salesOrderId: orderId,
            carrier,
            trackingNumber,
            quantity: quantity ? parseFloat(quantity) : undefined,
            eta: eta ? new Date(eta) : undefined,
            notes
        });

        if (result.success) {
            toast.success("Shipment detail added successfully");
            setIsShipmentOpen(false);
            setCarrier("");
            setTrackingNumber("");
            setEta("");
            setQuantity("");
            setNotes("");
        } else {
            toast.error(result.error || "Failed to add shipment");
        }
        setLoading(false);
    };

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle className="flex items-center gap-2">
                        <Truck className="h-5 w-5" />
                        Outbound Shipments
                    </CardTitle>
                    <CardDescription>
                        Manage shipping & transit details for this order. {shipments.length} active.
                    </CardDescription>
                </div>
                {['CONFIRMED', 'IN_PROGRESS', 'SHIPPED', 'PARTIALLY_SHIPPED'].includes(orderStatus) && (
                    <Dialog open={isShipmentOpen} onOpenChange={setIsShipmentOpen}>
                        <DialogTrigger asChild>
                            <Button size="sm" variant="outline">
                                <Plus className="h-4 w-4 mr-2" />
                                Add Shipment Detail
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Add Outbound Shipment</DialogTitle>
                                <DialogDescription>
                                    Record transit details. Invoice must be generated first.
                                </DialogDescription>
                            </DialogHeader>

                            {invoiceCount === 0 && (
                                <div className="bg-red-50 text-red-600 p-3 rounded text-sm border border-red-200">
                                    ⚠️ You must generate an Invoice before adding shipment details.
                                </div>
                            )}

                            <div className="grid gap-4 py-4">
                                <div className="grid gap-2">
                                    <Label>Carrier / Logistics Provider <span className="text-red-500">*</span></Label>
                                    <Input value={carrier} onChange={(e) => setCarrier(e.target.value)} placeholder="e.g. DHL, FedEx, Maersk" disabled={invoiceCount === 0} />
                                </div>
                                <div className="grid gap-2">
                                    <Label>Tracking / Container No.</Label>
                                    <Input value={trackingNumber} onChange={(e) => setTrackingNumber(e.target.value)} disabled={invoiceCount === 0} />
                                </div>
                                <div className="grid gap-2">
                                    <Label>Estimated Arrival (ETA)</Label>
                                    <Input type="date" value={eta} onChange={(e) => setEta(e.target.value)} disabled={invoiceCount === 0} />
                                </div>
                                <div className="grid gap-2">
                                    <Label>Quantity (MT) <span className="text-red-500">*</span></Label>
                                    <Input
                                        type="number"
                                        step="0.01"
                                        value={quantity}
                                        onChange={(e) => setQuantity(e.target.value)}
                                        placeholder="e.g. 10.5"
                                        disabled={invoiceCount === 0}
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label>Notes</Label>
                                    <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Vessel name, etc." disabled={invoiceCount === 0} />
                                </div>
                            </div>
                            <DialogFooter>
                                <Button onClick={handleCreateShipment} disabled={loading || !carrier || !quantity || invoiceCount === 0}>
                                    {loading ? "Saving..." : "Save Details"}
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                )}
            </CardHeader>
            <CardContent>
                {shipments.length === 0 ? (
                    <div className="text-center py-6 text-muted-foreground text-sm border-2 border-dashed rounded-lg">
                        No shipment details recorded yet.
                    </div>
                ) : (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Date Added</TableHead>
                                <TableHead>Carrier</TableHead>
                                <TableHead>Tracking #</TableHead>
                                <TableHead>Qty</TableHead>
                                <TableHead>ETA</TableHead>
                                <TableHead>Notes</TableHead>
                                <TableHead>Status</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {shipments.map((shipment) => (
                                <TableRow key={shipment.id}>
                                    <TableCell>{format(new Date(shipment.createdAt), "MMM d, yyyy")}</TableCell>
                                    <TableCell className="font-medium">{shipment.carrier}</TableCell>
                                    <TableCell>{shipment.trackingNumber || "-"}</TableCell>
                                    <TableCell>{shipment.quantity ? `${shipment.quantity} MT` : "-"}</TableCell>
                                    <TableCell>{shipment.eta ? format(new Date(shipment.eta), "MMM d") : "-"}</TableCell>
                                    <TableCell className="max-w-[150px] truncate" title={shipment.notes}>{shipment.notes || "-"}</TableCell>
                                    <TableCell>
                                        <Badge variant="outline" className="flex items-center w-fit gap-1">
                                            <Truck className="h-3 w-3" />
                                            {shipment.status}
                                        </Badge>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                )}
            </CardContent>
        </Card>
    );
}
