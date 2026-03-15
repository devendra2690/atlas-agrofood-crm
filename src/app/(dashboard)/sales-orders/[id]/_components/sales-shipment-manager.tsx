"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { Truck, Plus, IndianRupee, Clock, Pencil, Trash2 } from "lucide-react";
import { createShipment, updateShipment, deleteShipment } from "@/app/actions/logistics";
import { toast } from "sonner";
import { ShipmentDocumentAttachment } from "@/app/(dashboard)/logistics/_components/shipment-document-attachment";

interface SalesShipmentManagerProps {
    orderId: string;
    orderStatus: string;
    shipments: any[];
    invoiceCount: number;
    orderQuantityUnit?: string;
}

export function SalesShipmentManager({ orderId, orderStatus, shipments, invoiceCount, orderQuantityUnit }: SalesShipmentManagerProps) {
    const [isShipmentOpen, setIsShipmentOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [mounted, setMounted] = useState(false);

    // Edit state
    const [editingShipment, setEditingShipment] = useState<any | null>(null);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [editCarrier, setEditCarrier] = useState("");
    const [editTrackingNumber, setEditTrackingNumber] = useState("");
    const [editEta, setEditEta] = useState("");
    const [editQuantity, setEditQuantity] = useState("");
    const [editQuantityUnit, setEditQuantityUnit] = useState("MT");
    const [editCourierCharge, setEditCourierCharge] = useState("");
    const [editCourierChargeRecoverable, setEditCourierChargeRecoverable] = useState(false);
    const [editNotes, setEditNotes] = useState("");

    useEffect(() => {
        setMounted(true);
    }, []);

    // Shipment Form
    const [carrier, setCarrier] = useState("");
    const [trackingNumber, setTrackingNumber] = useState("");
    const [eta, setEta] = useState("");
    const [quantity, setQuantity] = useState("");
    const [quantityUnit, setQuantityUnit] = useState(orderQuantityUnit || "MT");
    const [courierCharge, setCourierCharge] = useState("");
    const [courierChargeRecoverable, setCourierChargeRecoverable] = useState(false);
    const [notes, setNotes] = useState("");

    if (!mounted) return null;

    const openEdit = (shipment: any) => {
        setEditingShipment(shipment);
        setEditCarrier(shipment.carrier || "");
        setEditTrackingNumber(shipment.trackingNumber || "");
        setEditEta(shipment.eta ? format(new Date(shipment.eta), "yyyy-MM-dd") : "");
        setEditQuantity(shipment.quantity?.toString() || "");
        setEditQuantityUnit(shipment.quantityUnit || "MT");
        setEditCourierCharge(shipment.courierCharge?.toString() || "");
        setEditCourierChargeRecoverable(shipment.courierChargeRecoverable || false);
        setEditNotes(shipment.notes || "");
        setIsEditOpen(true);
    };

    const handleEdit = async () => {
        if (!editingShipment) return;
        setLoading(true);
        const result = await updateShipment(editingShipment.id, {
            carrier: editCarrier,
            trackingNumber: editTrackingNumber,
            quantity: editQuantity ? parseFloat(editQuantity) : undefined,
            quantityUnit: editQuantityUnit,
            eta: editEta ? new Date(editEta) : null,
            notes: editNotes,
            courierCharge: editCourierCharge ? parseFloat(editCourierCharge) : null,
            courierChargeRecoverable: editCourierChargeRecoverable
        });
        setLoading(false);
        if (result.success) {
            toast.success("Shipment updated");
            setIsEditOpen(false);
        } else {
            toast.error(result.error || "Failed to update shipment");
        }
    };

    const handleDelete = async (shipmentId: string) => {
        if (!confirm("Delete this shipment? This will also remove its courier charge transactions.")) return;
        const result = await deleteShipment(shipmentId);
        if (result.success) {
            toast.success("Shipment deleted");
        } else {
            toast.error(result.error || "Failed to delete shipment");
        }
    };

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
            quantityUnit,
            courierCharge: courierCharge ? parseFloat(courierCharge) : undefined,
            courierChargeRecoverable,
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
            setCourierCharge("");
            setCourierChargeRecoverable(false);
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
                                    <Label>Quantity <span className="text-red-500">*</span></Label>
                                    <div className="flex gap-2">
                                        <Input
                                            type="number"
                                            step="0.001"
                                            value={quantity}
                                            onChange={(e) => setQuantity(e.target.value)}
                                            placeholder="e.g. 10.5"
                                            disabled={invoiceCount === 0}
                                            className="flex-1"
                                        />
                                        <div className="w-24">
                                            <Select value={quantityUnit} onValueChange={setQuantityUnit} disabled={invoiceCount === 0}>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Unit" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="MT">MT</SelectItem>
                                                    <SelectItem value="KG">KG</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                </div>
                                <div className="grid gap-2">
                                    <Label>Courier Charges (₹) - Out of Pocket</Label>
                                    <Input 
                                        type="number" 
                                        value={courierCharge} 
                                        onChange={(e) => setCourierCharge(e.target.value)} 
                                        placeholder="e.g. 1500" 
                                        disabled={invoiceCount === 0} 
                                    />
                                    <label className="flex items-start gap-2 cursor-pointer select-none">
                                        <input
                                            type="checkbox"
                                            className="mt-0.5 h-4 w-4 rounded border-gray-300"
                                            checked={courierChargeRecoverable}
                                            onChange={e => setCourierChargeRecoverable(e.target.checked)}
                                            disabled={invoiceCount === 0}
                                        />
                                        <span className="text-sm text-muted-foreground leading-tight">
                                            <span className="font-medium text-foreground">Recoverable from client</span>
                                            <br />
                                            <span className="text-xs">Check if the client will reimburse this courier charge.</span>
                                        </span>
                                    </label>
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
                                <TableHead>Courier Charge</TableHead>
                                <TableHead>Notes</TableHead>
                                <TableHead>Documents</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {shipments.map((shipment) => (
                                <TableRow key={shipment.id}>
                                    <TableCell>{format(new Date(shipment.createdAt), "MMM d, yyyy")}</TableCell>
                                    <TableCell className="font-medium">{shipment.carrier}</TableCell>
                                    <TableCell>{shipment.trackingNumber || "-"}</TableCell>
                                    <TableCell>{shipment.quantity ? `${shipment.quantity} ${shipment.quantityUnit || 'MT'}` : "-"}</TableCell>
                                    <TableCell>{shipment.eta ? format(new Date(shipment.eta), "MMM d") : "-"}</TableCell>
                                    <TableCell>
                                        {shipment.courierCharge ? (
                                            <div className="flex items-center gap-1">
                                                <IndianRupee className="h-3 w-3 text-muted-foreground" />
                                                <span className="font-medium">{Number(shipment.courierCharge).toLocaleString()}</span>
                                                {shipment.courierChargeRecoverable && (
                                                    <span title="Recoverable from client">
                                                        <Clock className="h-3.5 w-3.5 text-amber-500" />
                                                    </span>
                                                )}
                                            </div>
                                        ) : "-"}
                                    </TableCell>
                                    <TableCell className="max-w-[150px] truncate" title={shipment.notes}>{shipment.notes || "-"}</TableCell>
                                    <TableCell>
                                        <ShipmentDocumentAttachment shipmentId={shipment.id} documents={shipment.documents || []} />
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="outline" className="flex items-center w-fit gap-1">
                                            <Truck className="h-3 w-3" />
                                            {shipment.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-1">
                                            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openEdit(shipment)}>
                                                <Pencil className="h-3.5 w-3.5" />
                                            </Button>
                                            <Button size="icon" variant="ghost" className="h-7 w-7 text-rose-500 hover:text-rose-700 hover:bg-rose-50" onClick={() => handleDelete(shipment.id)}>
                                                <Trash2 className="h-3.5 w-3.5" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                )}
            </CardContent>

            {/* Edit Dialog */}
            <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit Shipment</DialogTitle>
                        <DialogDescription>Update shipment details. Courier charge changes will sync finance transactions.</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label>Carrier <span className="text-red-500">*</span></Label>
                            <Input value={editCarrier} onChange={e => setEditCarrier(e.target.value)} />
                        </div>
                        <div className="grid gap-2">
                            <Label>Tracking / Container No.</Label>
                            <Input value={editTrackingNumber} onChange={e => setEditTrackingNumber(e.target.value)} />
                        </div>
                        <div className="grid gap-2">
                            <Label>ETA</Label>
                            <Input type="date" value={editEta} onChange={e => setEditEta(e.target.value)} />
                        </div>
                        <div className="grid gap-2">
                            <Label>Quantity</Label>
                            <div className="flex gap-2">
                                <Input type="number" step="0.001" value={editQuantity} onChange={e => setEditQuantity(e.target.value)} className="flex-1" />
                                <div className="w-24">
                                    <Select value={editQuantityUnit} onValueChange={setEditQuantityUnit}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="MT">MT</SelectItem>
                                            <SelectItem value="KG">KG</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </div>
                        <div className="grid gap-2">
                            <Label>Courier Charges (₹)</Label>
                            <Input type="number" value={editCourierCharge} onChange={e => setEditCourierCharge(e.target.value)} placeholder="e.g. 1500" />
                            <label className="flex items-start gap-2 cursor-pointer select-none">
                                <input type="checkbox" className="mt-0.5 h-4 w-4 rounded border-gray-300" checked={editCourierChargeRecoverable} onChange={e => setEditCourierChargeRecoverable(e.target.checked)} />
                                <span className="text-sm text-muted-foreground leading-tight">
                                    <span className="font-medium text-foreground">Recoverable from client</span>
                                </span>
                            </label>
                        </div>
                        <div className="grid gap-2">
                            <Label>Notes</Label>
                            <Input value={editNotes} onChange={e => setEditNotes(e.target.value)} />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsEditOpen(false)}>Cancel</Button>
                        <Button onClick={handleEdit} disabled={loading || !editCarrier}>
                            {loading ? "Saving..." : "Save Changes"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </Card>
    );
}
