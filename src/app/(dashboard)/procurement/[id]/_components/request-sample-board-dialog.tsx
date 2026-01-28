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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { createSampleRequest } from "@/app/actions/sample";
import { TestTube, Loader2, Plus } from "lucide-react";
import { toast } from "sonner";

interface RequestSampleBoardDialogProps {
    projectId: string;
    projectVendors: any[]; // Array of { vendor: { id, name, ... } }
    trigger?: React.ReactNode;
}

export function RequestSampleBoardDialog({ projectId, projectVendors, trigger }: RequestSampleBoardDialogProps) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [vendorId, setVendorId] = useState("");
    const [notes, setNotes] = useState("");

    async function handleRequest() {
        if (!vendorId) return;

        setLoading(true);
        try {
            const result = await createSampleRequest(projectId, vendorId, notes);
            if (result.success) {
                const vendorName = projectVendors.find(pv => pv.vendor.id === vendorId)?.vendor.name || "Vendor";
                toast.success(`Sample requested from ${vendorName}`);
                setOpen(false);
                setNotes("");
                setVendorId("");
            } else {
                toast.error("Failed to request sample: " + result.error);
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
                {trigger || (
                    <Button size="sm">
                        <Plus className="h-4 w-4 mr-2" />
                        Request Sample
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Request New Sample</DialogTitle>
                    <DialogDescription>
                        Select a vendor from the shortlist and request a sample.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label>Select Vendor</Label>
                        <Select value={vendorId} onValueChange={setVendorId}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select a vendor..." />
                            </SelectTrigger>
                            <SelectContent>
                                {projectVendors.length === 0 ? (
                                    <SelectItem value="none" disabled>No vendors found</SelectItem>
                                ) : (
                                    projectVendors.map((pv) => (
                                        <SelectItem key={pv.id} value={pv.vendor.id}>
                                            {pv.vendor.name} {pv.vendor.city ? `(${pv.vendor.city.name})` : ""}
                                        </SelectItem>
                                    ))
                                )}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="notes">Notes / Instructions</Label>
                        <Textarea
                            id="notes"
                            placeholder="e.g. Please send 500g sample..."
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button onClick={handleRequest} disabled={loading || !vendorId}>
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {loading ? "Requesting..." : "Send Request"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
