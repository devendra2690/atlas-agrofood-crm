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
import { Combobox } from "@/components/ui/combobox";
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
                toast.success("Supplier added successfully");
                setOpen(false);
                setSelectedVendorId("");
            } else {
                toast.error("Failed to add supplier");
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
                    Add Supplier
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Add Supplier to Project</DialogTitle>
                    <DialogDescription>
                        Select a supplier to source materials from.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label>Select Supplier</Label>
                        <Combobox
                            options={vendors.map(v => {
                                const locationParts = [v.city?.name, v.state?.name, v.country?.name].filter(Boolean);
                                const locationString = locationParts.length > 0 ? locationParts.join(", ") : "No Location";
                                return {
                                    label: `${v.name} (${locationString})`,
                                    value: v.id
                                };
                            })}
                            value={selectedVendorId}
                            onChange={setSelectedVendorId}
                            placeholder="Select supplier..."
                            searchPlaceholder="Search supplier..."
                            emptyMessage="No available suppliers found"
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button onClick={handleAdd} disabled={loading || !selectedVendorId}>
                        {loading ? "Adding..." : "Add Supplier"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
