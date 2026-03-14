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
import { Badge } from "@/components/ui/badge";
import { getAvailableVendors, addVendorToProject } from "@/app/actions/procurement";
import { Plus, Building2, MapPin, Check, Search } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface AddVendorDialogProps {
    projectId: string;
}

export function AddVendorDialog({ projectId }: AddVendorDialogProps) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [vendors, setVendors] = useState<any[]>([]);
    const [commodityMap, setCommodityMap] = useState<Record<string, string>>({});
    const [selectedVendorIds, setSelectedVendorIds] = useState<Set<string>>(new Set());
    const [search, setSearch] = useState("");

    useEffect(() => {
        if (open) {
            setVendors([]);
            setSelectedVendorIds(new Set());
            setSearch("");
            loadVendors();
        }
    }, [open]);

    async function loadVendors() {
        const result = await getAvailableVendors(projectId);
        if (result.success && result.data) {
            setVendors(result.data);
            setCommodityMap((result as any).commodityMap || {});
        }
    }

    function toggleVendor(vendorId: string) {
        setSelectedVendorIds(prev => {
            const next = new Set(prev);
            if (next.has(vendorId)) next.delete(vendorId);
            else next.add(vendorId);
            return next;
        });
    }

    async function handleAdd() {
        if (selectedVendorIds.size === 0) return;
        setLoading(true);
        try {
            const results = await Promise.all(
                Array.from(selectedVendorIds).map(id => addVendorToProject(projectId, id))
            );
            const failed = results.filter(r => !r.success).length;
            if (failed === 0) {
                toast.success(`${selectedVendorIds.size} supplier${selectedVendorIds.size > 1 ? 's' : ''} added successfully`);
            } else {
                toast.warning(`${results.length - failed} added, ${failed} failed`);
            }
            setOpen(false);
        } catch (error) {
            console.error(error);
            toast.error("An error occurred");
        } finally {
            setLoading(false);
        }
    }

    // Group vendors by commodity
    const commodityIds = Object.keys(commodityMap);
    
    // Filter vendors by search
    const q = search.toLowerCase().trim();
    const filteredVendors = vendors.filter(v =>
        !q ||
        v.name.toLowerCase().includes(q) ||
        v.city?.name?.toLowerCase().includes(q) ||
        v.state?.name?.toLowerCase().includes(q) ||
        v.projectCommodities?.some((c: any) => c.name.toLowerCase().includes(q))
    );

    // Build grouped structure: { commodityId: { name, vendors[] } }
    const groups: { id: string; name: string; vendors: any[] }[] = commodityIds.map(cId => ({
        id: cId,
        name: commodityMap[cId],
        vendors: filteredVendors.filter(v =>
            v.projectCommodities?.some((c: any) => c.id === cId)
        )
    })).filter(g => g.vendors.length > 0);

    // Any uncategorised (shouldn't happen but safety net)
    const uncategorised = filteredVendors.filter(v =>
        !v.projectCommodities || v.projectCommodities.length === 0
    );

    const selectedVendors = vendors.filter(v => selectedVendorIds.has(v.id));

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Supplier
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px] max-h-[90vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle>Add Supplier to Project</DialogTitle>
                    <DialogDescription>
                        Suppliers are grouped by the commodities they supply for this project.
                    </DialogDescription>
                </DialogHeader>

                <div className="flex flex-col gap-3 flex-1 overflow-hidden">
                    {/* Search */}
                    <div className="relative">
                        <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                        <Input
                            placeholder="Search supplier or commodity..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            className="pl-8 h-8 text-sm"
                        />
                    </div>

                    {/* Multi-selection summary */}
                    {selectedVendors.length > 0 && (
                        <div className="flex items-start gap-2 px-3 py-2 bg-primary/5 border border-primary/20 rounded-md text-sm">
                            <Check className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
                            <div className="flex-1 min-w-0">
                                <span className="font-medium text-primary">{selectedVendors.length} selected: </span>
                                <span className="text-muted-foreground text-xs">{selectedVendors.map(v => v.name).join(', ')}</span>
                            </div>
                            <button
                                type="button"
                                className="ml-auto text-xs text-muted-foreground hover:text-foreground shrink-0"
                                onClick={() => setSelectedVendorIds(new Set())}
                            >
                                Clear all
                            </button>
                        </div>
                    )}

                    {/* Grouped vendor list */}
                    <div className="overflow-y-auto flex-1 -mx-1 px-1 space-y-4">
                        {groups.length === 0 && uncategorised.length === 0 && (
                            <p className="text-center py-8 text-sm text-muted-foreground">
                                {vendors.length === 0 ? "Loading suppliers..." : "No suppliers match your search."}
                            </p>
                        )}

                        {groups.map(group => (
                            <div key={group.id}>
                                {/* Commodity section header */}
                                <div className="flex items-center gap-2 mb-2">
                                    <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                                        {group.name} Suppliers
                                    </div>
                                    <div className="h-px flex-1 bg-border" />
                                    <Badge variant="outline" className="text-[10px] py-0 font-normal">
                                        {group.vendors.length}
                                    </Badge>
                                </div>

                                {/* Vendor cards in this group */}
                                <div className="space-y-1.5">
                                    {group.vendors.map(vendor => {
                                        const isSelected = selectedVendorIds.has(vendor.id);
                                        const locationParts = [
                                            vendor.city?.name,
                                            vendor.state?.name,
                                            vendor.country?.name
                                        ].filter(Boolean);
                                        const location = locationParts.join(", ") || "No location";

                                        // Show all commodities this vendor covers (may be >1 from project list)
                                        const otherCommodities = (vendor.projectCommodities || [])
                                            .filter((c: any) => c.id !== group.id);

                                        return (
                                            <button
                                                key={vendor.id}
                                                type="button"
                                                onClick={() => toggleVendor(vendor.id)}
                                                className={cn(
                                                    "w-full text-left px-3 py-2.5 rounded-lg border transition-all",
                                                    "hover:border-primary/40 hover:bg-primary/5",
                                                    isSelected
                                                        ? "border-primary bg-primary/5 ring-1 ring-primary/30"
                                                        : "border-border bg-white"
                                                )}
                                            >
                                                <div className="flex items-start justify-between gap-2">
                                                    <div className="flex items-start gap-2 min-w-0">
                                                        <Building2 className="h-3.5 w-3.5 text-muted-foreground mt-0.5 shrink-0" />
                                                        <div className="min-w-0">
                                                            <div className="font-medium text-sm text-foreground truncate">
                                                                {vendor.name}
                                                            </div>
                                                            <div className="flex items-center gap-1 text-muted-foreground text-xs mt-0.5">
                                                                <MapPin className="h-3 w-3 shrink-0" />
                                                                <span className="truncate">{location}</span>
                                                            </div>
                                                            {/* Also supplies other project commodities */}
                                                            {otherCommodities.length > 0 && (
                                                                <div className="flex gap-1 mt-1 flex-wrap">
                                                                    <span className="text-[10px] text-muted-foreground">Also:</span>
                                                                    {otherCommodities.map((c: any) => (
                                                                        <Badge key={c.id} variant="secondary" className="text-[10px] py-0 font-normal">
                                                                            {c.name}
                                                                        </Badge>
                                                                    ))}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                    {isSelected && (
                                                        <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                                                    )}
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}

                        {/* Uncategorised fallback */}
                        {uncategorised.length > 0 && (
                            <div>
                                <div className="flex items-center gap-2 mb-2">
                                    <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Other Suppliers</div>
                                    <div className="h-px flex-1 bg-border" />
                                </div>
                                <div className="space-y-1.5">
                                    {uncategorised.map(vendor => {
                                        const isSelected = selectedVendorIds.has(vendor.id);
                                        const locationParts = [vendor.city?.name, vendor.state?.name, vendor.country?.name].filter(Boolean);
                                        return (
                                            <button
                                                key={vendor.id}
                                                onClick={() => toggleVendor(vendor.id)}
                                                className={cn(
                                                    "w-full text-left px-3 py-2.5 rounded-lg border transition-all",
                                                    "hover:border-primary/40 hover:bg-primary/5",
                                                    isSelected ? "border-primary bg-primary/5 ring-1 ring-primary/30" : "border-border bg-white"
                                                )}
                                            >
                                                <div className="flex items-center gap-2">
                                                    <Building2 className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                                                    <div>
                                                        <div className="font-medium text-sm">{vendor.name}</div>
                                                        <div className="text-xs text-muted-foreground">{locationParts.join(", ") || "No location"}</div>
                                                    </div>
                                                    {isSelected && <Check className="h-4 w-4 text-primary ml-auto shrink-0" />}
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <DialogFooter className="mt-4">
                    <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                    <Button onClick={handleAdd} disabled={loading || selectedVendorIds.size === 0}>
                        {loading ? "Adding..." : selectedVendorIds.size > 1 ? `Add ${selectedVendorIds.size} Suppliers` : "Add Supplier"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
