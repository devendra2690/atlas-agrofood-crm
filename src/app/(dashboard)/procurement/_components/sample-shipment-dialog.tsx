"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Truck, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { createShipment } from "@/app/actions/logistics";

interface SampleShipmentDialogProps {
    sampleId: string;
}

export function SampleShipmentDialog({ sampleId }: SampleShipmentDialogProps) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);

    const [carrier, setCarrier] = useState("");
    const [trackingNumber, setTrackingNumber] = useState("");
    const [eta, setEta] = useState("");
    const [notes, setNotes] = useState("");
    const [courierCharge, setCourierCharge] = useState("");
    const [wePayedForCourier, setWePayedForCourier] = useState(true); // default: we paid

    async function handleCreate() {

        setLoading(true);
        try {
            const result = await createShipment({
                sampleRecordId: sampleId,
                carrier,
                trackingNumber,
                eta: eta ? new Date(eta) : undefined,
                notes,
                courierCharge: courierCharge ? parseFloat(courierCharge) : undefined,
                courierChargeRecoverable: wePayedForCourier // true = we paid (out of pocket)
            });

            if (result.success) {
                toast.success("Courier details saved. Sample marked as Sent.");
                setOpen(false);
                setCarrier("");
                setTrackingNumber("");
                setEta("");
                setNotes("");
                setCourierCharge("");
                setWePayedForCourier(true);
            } else {
                toast.error(result.error || "Failed to save courier details.");
            }
        } catch (error) {
            console.error(error);
            toast.error("An error occurred");
        } finally {
            setLoading(false);
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button size="sm" variant="outline">
                    <Truck className="h-4 w-4 mr-2" />
                    Mark Sent
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Courier Details</DialogTitle>
                    <DialogDescription>
                        Record the incoming tracking details for this sample.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label>Carrier / Courier</Label>
                        <Input
                            placeholder="e.g. DHL, FedEx, India Post"
                            value={carrier}
                            onChange={(e) => setCarrier(e.target.value)}
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label>Tracking Number (AWB)</Label>
                        <Input
                            placeholder="Tracking ID"
                            value={trackingNumber}
                            onChange={(e) => setTrackingNumber(e.target.value)}
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label>Estimated Arrival (ETA)</Label>
                        <Input
                            type="date"
                            value={eta}
                            onChange={(e) => setEta(e.target.value)}
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label>Notes</Label>
                        <Input
                            placeholder="Any additional info..."
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label>Courier Charges (₹) <span className="text-muted-foreground font-normal">(Optional)</span></Label>
                        <Input
                            type="number"
                            min="0"
                            step="0.01"
                            placeholder="e.g. 500"
                            value={courierCharge}
                            onChange={(e) => setCourierCharge(e.target.value)}
                        />
                        <label className="flex items-start gap-2 cursor-pointer select-none mt-1">
                            <input
                                type="checkbox"
                                className="mt-0.5 h-4 w-4 rounded border-gray-300"
                                checked={wePayedForCourier}
                                onChange={e => setWePayedForCourier(e.target.checked)}
                            />
                            <span className="text-sm text-muted-foreground leading-tight">
                                <span className="font-medium text-foreground">We paid for this courier</span>
                                <br />
                                <span className="text-xs">Uncheck if the vendor / sender paid the shipping.</span>
                            </span>
                        </label>
                    </div>
                </div>
                <DialogFooter>
                    <Button onClick={handleCreate} disabled={loading}>
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {loading ? "Saving..." : "Save Details & Mark Sent"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
