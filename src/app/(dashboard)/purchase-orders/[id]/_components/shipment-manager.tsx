"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { Truck, PackageCheck, Plus } from "lucide-react";
import { createShipment, createGRN } from "@/app/actions/logistics";
import { toast } from "sonner";

interface ShipmentManagerProps {
    poId: string;
    poStatus: string;
    shipments: any[];
    grn?: any;
    orderedQuantity: number;
}

export function ShipmentManager({ poId, poStatus, shipments, grn, orderedQuantity }: ShipmentManagerProps) {
    const [isShipmentOpen, setIsShipmentOpen] = useState(false);
    const [isGRNOpen, setIsGRNOpen] = useState(false);
    const [loading, setLoading] = useState(false);

    // Shipment Form
    const [carrier, setCarrier] = useState("");
    const [trackingNumber, setTrackingNumber] = useState("");
    const [eta, setEta] = useState("");

    // GRN Form
    const [receivedQty, setReceivedQty] = useState("");
    const [rejectedQty, setRejectedQty] = useState("0");
    const [receivedBy, setReceivedBy] = useState("");
    const [grnNotes, setGrnNotes] = useState("");

    const handleCreateShipment = async () => {
        setLoading(true);
        const result = await createShipment({
            purchaseOrderId: poId,
            carrier,
            trackingNumber,
            eta: eta ? new Date(eta) : undefined,
        });
        if (result.success) {
            toast.success("Shipment created successfully");
            setIsShipmentOpen(false);
            setCarrier("");
            setTrackingNumber("");
            setEta("");
        } else {
            toast.error("Failed to create shipment");
        }
        setLoading(false);
    };

    const handleCreateGRN = async () => {
        const received = parseFloat(receivedQty) || 0;
        const rejected = parseFloat(rejectedQty) || 0;
        const accepted = received - rejected;

        if (accepted < 0) {
            toast.error("Rejected quantity cannot be more than received quantity");
            return;
        }

        if (!receivedQty || parseFloat(receivedQty) <= 0) {
            toast.error("Please enter a valid received quantity");
            return;
        }

        if (!receivedBy || receivedBy.trim() === "") {
            toast.error("Received By name is required");
            return;
        }

        setLoading(true);
        const result = await createGRN({
            purchaseOrderId: poId,
            receivedBy,
            totalReceivedQuantity: received,
            rejectedQuantity: rejected,
            acceptedQuantity: accepted,
            qualityCheckStatus: 'PASSED', // Default for now, ideally strictly checked
            notes: grnNotes
        });

        if (result.success) {
            toast.success("Goods Received Successfully");
            setIsGRNOpen(false);
        } else {
            toast.error(result.error || "Failed to create GRN");
        }
        setLoading(false);
    };

    return (
        <div className="space-y-6">
            {/* GRN Section (If Exists) */}
            {grn ? (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-green-900 flex items-center gap-2 mb-2">
                        <PackageCheck className="h-5 w-5" />
                        Goods Receipt Note (GRN)
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-green-800">
                        <div>
                            <p className="text-xs uppercase tracking-wide text-green-700">Received Date</p>
                            <p className="font-medium">{format(new Date(grn.receivedDate), "PP")}</p>
                        </div>
                        <div>
                            <p className="text-xs uppercase tracking-wide text-green-700">Received By</p>
                            <p className="font-medium">{grn.receivedBy || "-"}</p>
                        </div>
                        <div>
                            <p className="text-xs uppercase tracking-wide text-green-700">Qty Received</p>
                            <p className="font-medium">{grn.totalReceivedQuantity} MT</p>
                        </div>
                        <div>
                            <p className="text-xs uppercase tracking-wide text-green-700">Qty Accepted</p>
                            <p className="font-bold text-lg">{grn.acceptedQuantity} MT</p>
                        </div>
                    </div>
                    {grn.rejectedQuantity > 0 && (
                        <div className="mt-2 text-red-600 text-sm">
                            ⚠️ {grn.rejectedQuantity} MT Rejected
                        </div>
                    )}
                </div>
            ) : (
                <div className="flex justify-end">
                    {/* Allow Receive Goods if IN_TRANSIT or IN_PROGRESS */}
                    {(poStatus === 'IN_TRANSIT' || poStatus === 'IN_PROGRESS' || (shipments.length > 0 && poStatus !== 'RECEIVED')) && (
                        <Dialog open={isGRNOpen} onOpenChange={setIsGRNOpen}>
                            <DialogTrigger asChild>
                                <Button variant="default" className="bg-green-600 hover:bg-green-700 text-white" suppressHydrationWarning>
                                    <PackageCheck className="h-4 w-4 mr-2" />
                                    Receive Goods (GRN)
                                </Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Create Goods Receipt Note</DialogTitle>
                                    <DialogDescription>
                                        Acknowledge receipt of goods. This will mark the order as RECEIVED.
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="grid gap-4 py-4">
                                    <div className="grid gap-2">
                                        <Label>Total Quantity Received <span className="text-red-500">*</span></Label>
                                        <Input
                                            type="number"
                                            placeholder={`Expected: ${orderedQuantity}`}
                                            value={receivedQty}
                                            onChange={(e) => setReceivedQty(e.target.value)}
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label>Rejected Quantity (Damaged/Poor Quality)</Label>
                                        <Input
                                            type="number"
                                            value={rejectedQty}
                                            onChange={(e) => setRejectedQty(e.target.value)}
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label>Accepted Quantity</Label>
                                        <div className="p-2 bg-slate-100 rounded text-center font-mono font-bold">
                                            {((parseFloat(receivedQty) || 0) - (parseFloat(rejectedQty) || 0)).toFixed(2)}
                                        </div>
                                    </div>
                                    <div className="grid gap-2">
                                        <Label>Received By (Name) <span className="text-red-500">*</span></Label>
                                        <Input value={receivedBy} onChange={(e) => setReceivedBy(e.target.value)} />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label>Notes</Label>
                                        <Input value={grnNotes} onChange={(e) => setGrnNotes(e.target.value)} placeholder="Condition, truck no, etc." />
                                    </div>
                                </div>
                                <DialogFooter>
                                    <Button onClick={handleCreateGRN} disabled={loading || !receivedQty || !receivedBy}>
                                        {loading ? "Processing..." : "Confirm Receipt"}
                                    </Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    )}
                </div>
            )}

            {/* Shipments List */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle>Shipments</CardTitle>
                        <CardDescription>Track deliveries for this order.</CardDescription>
                    </div>
                    {/* Add Shipment Button - Only if not recieved */}
                    {!grn && poStatus !== 'RECEIVED' && (
                        <Dialog open={isShipmentOpen} onOpenChange={setIsShipmentOpen}>
                            <DialogTrigger asChild>
                                <Button size="sm" variant="outline" suppressHydrationWarning>
                                    <Plus className="h-4 w-4 mr-2" />
                                    Add Shipment
                                </Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Add Shipment Details</DialogTitle>
                                    <DialogDescription>
                                        Track carrier information for this order.
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="grid gap-4 py-4">
                                    <div className="grid gap-2">
                                        <Label>Carrier / Transporter</Label>
                                        <Input value={carrier} onChange={(e) => setCarrier(e.target.value)} placeholder="e.g. FedEx, Maersk, Local Trucking" />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label>Tracking Number / Vehicle No.</Label>
                                        <Input value={trackingNumber} onChange={(e) => setTrackingNumber(e.target.value)} />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label>Estimated Arrival (ETA)</Label>
                                        <Input type="date" value={eta} onChange={(e) => setEta(e.target.value)} />
                                    </div>
                                </div>
                                <DialogFooter>
                                    <Button onClick={handleCreateShipment} disabled={loading || !carrier}>
                                        {loading ? "Saving..." : "Save Shipment"}
                                    </Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    )}
                </CardHeader>
                <CardContent>
                    {shipments.length === 0 ? (
                        <div className="text-center py-6 text-muted-foreground text-sm">
                            No active shipments tracking.
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Date</TableHead>
                                    <TableHead>Carrier</TableHead>
                                    <TableHead>Tracking #</TableHead>
                                    <TableHead>ETA</TableHead>
                                    <TableHead>Status</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {shipments.map((shipment) => (
                                    <TableRow key={shipment.id}>
                                        <TableCell>{format(new Date(shipment.createdAt), "MMM d")}</TableCell>
                                        <TableCell className="font-medium">{shipment.carrier}</TableCell>
                                        <TableCell>{shipment.trackingNumber || "-"}</TableCell>
                                        <TableCell>{shipment.eta ? format(new Date(shipment.eta), "MMM d") : "-"}</TableCell>
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
        </div>
    );
}
