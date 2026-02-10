"use client";

import { useState, useTransition } from "react";
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { createPartnerSample } from "@/app/actions/partner-sample";
import { toast } from "sonner";
import { Loader2, Beaker } from "lucide-react";

interface CollectSampleDialogProps {
    opportunityId: string;
    companies: any[]; // Vendors
    trigger?: React.ReactNode;
}

export function CollectSampleDialog({ opportunityId, companies, trigger }: CollectSampleDialogProps) {
    const [open, setOpen] = useState(false);
    const [isPending, startTransition] = useTransition();

    const vendors = companies.filter(c => c.type === "PARTNER");

    async function onSubmit(formData: FormData) {
        // ... (rest of onSubmit is same, but I need to be careful not to replace it if I don't include it in target)
        // Actually, let's keep the target specific.
        const vendorId = formData.get("vendorId") as string;
        const dateStr = formData.get("date") as string;
        const priceStr = formData.get("price") as string;
        const notes = formData.get("notes") as string;

        if (!vendorId) {
            toast.error("Please select a partner/vendor");
            return;
        }

        startTransition(async () => {
            const result = await createPartnerSample({
                opportunityId,
                vendorId,
                date: new Date(dateStr || new Date()),
                price: priceStr ? parseFloat(priceStr) : undefined,
                notes
            });

            if (result.success) {
                toast.success("Sample collected & linked!");
                setOpen(false);
            } else {
                toast.error(result.error || "Failed to collect sample");
            }
        });
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger || (
                    <Button variant="outline" className="h-8 gap-2">
                        <Beaker className="h-4 w-4" />
                        Collect Sample
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Collect Partner Sample</DialogTitle>
                    <DialogDescription>
                        Log a sample received directly from a partner. This will link it to a sourcing project.
                    </DialogDescription>
                </DialogHeader>
                <form action={onSubmit}>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="vendorId">Partner / Vendor</Label>
                            <Select name="vendorId" required>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select partner..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {vendors.map((vendor) => (
                                        <SelectItem key={vendor.id} value={vendor.id}>
                                            {vendor.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="date">Date Received</Label>
                            <Input
                                id="date"
                                name="date"
                                type="date"
                                defaultValue={new Date().toISOString().split("T")[0]}
                                required
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="price">Price (Optional)</Label>
                            <Input
                                id="price"
                                name="price"
                                type="number"
                                step="0.01"
                                placeholder="0.00"
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="notes">Notes</Label>
                            <Input
                                id="notes"
                                name="notes"
                                placeholder="Condition, quality checks..."
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="submit" disabled={isPending}>
                            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Save Sample
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
