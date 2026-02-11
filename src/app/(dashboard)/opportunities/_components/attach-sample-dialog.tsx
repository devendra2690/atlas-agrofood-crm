"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { getAllSamples, linkSampleToOpportunity } from "@/app/actions/sample";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface AttachSampleDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    opportunity: any;
}

export function AttachSampleDialog({ open, onOpenChange, opportunity }: AttachSampleDialogProps) {
    const [loading, setLoading] = useState(false);
    const [samples, setSamples] = useState<any[]>([]);
    const [selectedSampleId, setSelectedSampleId] = useState<string>("");
    const router = useRouter();

    useEffect(() => {
        if (open && opportunity) {
            loadSamples();
        }
    }, [open, opportunity]);

    async function loadSamples() {
        setLoading(true);
        // Filter by commodity to show only relevant samples
        const commodityId = opportunity?.commodityId;
        const result = await getAllSamples({
            limit: 50,
            commodityId: commodityId
        });
        if (result.success && result.data) {
            // Filter to only show VENDOR samples (exclude PARTNER samples)
            const vendorSamples = result.data.filter((s: any) => s.vendor?.type === 'VENDOR');
            setSamples(vendorSamples);
        }
        setLoading(false);
    }

    async function handleAttach() {
        if (!selectedSampleId || !opportunity) return;
        setLoading(true);
        try {
            const result = await linkSampleToOpportunity(selectedSampleId, opportunity.id);
            if (result.success) {
                toast.success("Sample attached successfully");
                onOpenChange(false);
                router.refresh();
                setSelectedSampleId("");
            } else {
                toast.error("Failed to attach sample: " + result.error);
            }
        } catch (error) {
            console.error(error);
            toast.error("An error occurred");
        } finally {
            setLoading(false);
        }
    }

    if (!opportunity) return null;

    // Filter samples possibly?
    // For now, show all.

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Attach Sample</DialogTitle>
                    <DialogDescription>
                        Link an existing vendor sample to <strong>{opportunity.productName}</strong>.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label>Select Sample</Label>
                        <Select value={selectedSampleId} onValueChange={setSelectedSampleId}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select a sample..." />
                            </SelectTrigger>
                            <SelectContent className="max-h-[300px]">
                                {samples.length === 0 ? (
                                    <SelectItem value="none" disabled>No samples found</SelectItem>
                                ) : (
                                    samples.map((sample) => {
                                        const isLinked = opportunity.sampleSubmissions?.some((sub: any) => sub.sampleId === sample.id);
                                        return (
                                            <SelectItem key={sample.id} value={sample.id} disabled={isLinked}>
                                                {sample.project?.commodity?.name || "Sample"} - {sample.vendor.name}
                                                {sample.priceQuoted ? ` (₹${sample.priceQuoted})` : ""}
                                                {isLinked ? " (Linked)" : ""}
                                            </SelectItem>
                                        );
                                    })
                                )}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
                        Cancel
                    </Button>
                    <Button onClick={handleAttach} disabled={loading || !selectedSampleId}>
                        {loading ? "Attaching..." : "Attach Sample"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
