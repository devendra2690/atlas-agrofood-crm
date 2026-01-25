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
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { getAvailableVendors, addVendorToProject } from "@/app/actions/procurement";
import { Plus, Building } from "lucide-react";
import { toast } from "sonner";
import { Label } from "@/components/ui/label";

interface AddVendorDialogProps {
    projectId: string;
}

export function AddVendorDialog({ projectId }: AddVendorDialogProps) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [vendors, setVendors] = useState<any[]>([]);
    const [selectedVendorId, setSelectedVendorId] = useState<string>("");

    useEffect(() => {
        if (open) {
            setVendors([]); // Clear previous list to avoid stale data
            loadVendors();
        }
    }, [open]);

    async function loadVendors() {
        const result = await getAvailableVendors(projectId);
        if (result.success && result.data) {
            setVendors(result.data);
        }
    }

    async function handleAdd() {
        if (!selectedVendorId) return;
        setLoading(true);
        try {
            const result = await addVendorToProject(projectId, selectedVendorId);
            if (result.success) {
                toast.success("Vendor added successfully");
                setOpen(false);
                setSelectedVendorId("");
            } else {
                toast.error("Failed to add vendor");
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
                <Button size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Vendor
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Add Vendor to Project</DialogTitle>
                    <DialogDescription>
                        Select a vendor to source materials from.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label>Select Vendor</Label>
                        <Select value={selectedVendorId} onValueChange={setSelectedVendorId}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select vendor..." />
                            </SelectTrigger>
                            <SelectContent>
                                {vendors.length === 0 ? (
                                    <SelectItem value="none" disabled>No available vendors found</SelectItem>
                                ) : (
                                    vendors.map((vendor) => {
                                        const locationParts = [vendor.city?.name, vendor.state?.name, vendor.country?.name].filter(Boolean);
                                        const locationString = locationParts.length > 0 ? locationParts.join(", ") : "No Location";
                                        return (
                                            <SelectItem key={vendor.id} value={vendor.id}>
                                                {vendor.name} ({locationString})
                                            </SelectItem>
                                        );
                                    })
                                )}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                <DialogFooter>
                    <Button onClick={handleAdd} disabled={loading || !selectedVendorId}>
                        {loading ? "Adding..." : "Add Vendor"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
