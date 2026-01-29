"use client";

import { useState, useTransition, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { manageVendorVariety, VendorVarietyFormData } from "@/app/actions/matrix";
import { toast } from "sonner";
import { Search } from "lucide-react";

// Mock data fetchers would ideally be server actions or passed props
// For simplicity in this step, I'm assuming we pass lists or fetch them.
// But wait, to select a vendor or variety, we need lists. 
// I'll assume we pass `vendors` and `varieties` as props or use a combobox.

interface ManageVendorVarietyDialogProps {
    existingData?: any; // If editing
    trigger?: React.ReactNode;
    vendors: { id: string; name: string }[];
    varieties: { id: string; name: string; commodity: { name: string } }[];
    states: { id: string; name: string }[];
}

export function ManageVendorVarietyDialog({ existingData, trigger, vendors, varieties, states }: ManageVendorVarietyDialogProps) {
    const [open, setOpen] = useState(false);
    const [isPending, startTransition] = useTransition();

    const [vendorId, setVendorId] = useState(existingData?.vendorId || "");
    const [varietyId, setVarietyId] = useState(existingData?.varietyId || "");
    const [originStateId, setOriginStateId] = useState(existingData?.originStateId || "");
    const [leadTime, setLeadTime] = useState(existingData?.leadTime || "");
    const [supplyCapacity, setSupplyCapacity] = useState(existingData?.supplyCapacity || "");
    const [qualityGrade, setQualityGrade] = useState(existingData?.qualityGrade || "");
    const [isBlacklisted, setIsBlacklisted] = useState(existingData?.isBlacklisted || false);

    useEffect(() => {
        if (open && existingData) {
            setVendorId(existingData.vendorId);
            setVarietyId(existingData.varietyId);
            setOriginStateId(existingData.originStateId || "");
            setLeadTime(existingData.leadTime || "");
            setSupplyCapacity(existingData.supplyCapacity || "");
            setQualityGrade(existingData.qualityGrade || "");
            setIsBlacklisted(existingData.isBlacklisted || false);
        }
    }, [open, existingData]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!vendorId || !varietyId) {
            toast.error("Vendor and Variety are required");
            return;
        }

        startTransition(async () => {
            const result = await manageVendorVariety(
                existingData ? "UPDATE" : "CREATE",
                {
                    id: existingData?.id,
                    vendorId,
                    varietyId,
                    originStateId: originStateId || undefined,
                    leadTime,
                    supplyCapacity,
                    qualityGrade,
                    isBlacklisted
                }
            );

            if (result.success) {
                toast.success(existingData ? "Updated mapping" : "Added mapping");
                setOpen(false);
                if (!existingData) {
                    // Reset form
                    setVendorId("");
                    setVarietyId("");
                    setOriginStateId("");
                }
            } else {
                toast.error(`Failed: ${result.error}`);
            }
        });
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger || (
                    <Button variant="default">Add Vendor Capability</Button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px] overflow-y-auto max-h-[90vh]">
                <DialogHeader>
                    <DialogTitle>{existingData ? "Edit Capability" : "Add Vendor Capability"}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 pt-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Vendor</Label>
                            <Select value={vendorId} onValueChange={setVendorId} disabled={!!existingData}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select Vendor" />
                                </SelectTrigger>
                                <SelectContent>
                                    {vendors.map(v => (
                                        <SelectItem key={v.id} value={v.id}>{v.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Variety</Label>
                            <Select value={varietyId} onValueChange={setVarietyId} disabled={!!existingData}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select Variety" />
                                </SelectTrigger>
                                <SelectContent>
                                    {varieties.map(v => (
                                        <SelectItem key={v.id} value={v.id}>
                                            {v.name} <span className="text-muted-foreground text-xs">({v.commodity.name})</span>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Origin / Source Region</Label>
                        <Select value={originStateId} onValueChange={setOriginStateId}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select State" />
                            </SelectTrigger>
                            <SelectContent>
                                {states.map(s => (
                                    <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-2">
                            <Label>Lead Time</Label>
                            <Input value={leadTime} onChange={e => setLeadTime(e.target.value)} placeholder="e.g. 3 Days" />
                        </div>
                        <div className="space-y-2">
                            <Label>Capacity</Label>
                            <Input value={supplyCapacity} onChange={e => setSupplyCapacity(e.target.value)} placeholder="e.g. 50 MT/wk" />
                        </div>
                        <div className="space-y-2">
                            <Label>Grade</Label>
                            <Input value={qualityGrade} onChange={e => setQualityGrade(e.target.value)} placeholder="e.g. Premium" />
                        </div>
                    </div>

                    <div className="flex items-center space-x-2 pt-2">
                        <Checkbox
                            id="blacklist"
                            checked={isBlacklisted}
                            onCheckedChange={(c) => setIsBlacklisted(c === true)}
                        />
                        <Label htmlFor="blacklist" className="text-destructive font-medium">
                            Blacklist this source (Quality Issues)
                        </Label>
                    </div>

                    <div className="flex justify-end pt-4">
                        <Button type="submit" disabled={isPending}>
                            {isPending ? "Saving..." : "Save Mapping"}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
