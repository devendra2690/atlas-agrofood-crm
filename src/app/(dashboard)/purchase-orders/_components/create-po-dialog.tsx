"use client";

import { useEffect, useState, useMemo } from "react";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { createManualPurchaseOrder, getProcurementProjects } from "@/app/actions/procurement";

export function CreatePurchaseOrderDialog({
    defaultProjectId,
    defaultVendorId,
    defaultCommodityName,
    defaultSampleId,
    trigger
}: {
    defaultProjectId?: string,
    defaultVendorId?: string,
    defaultCommodityName?: string,
    defaultSampleId?: string,
    trigger?: React.ReactNode
}) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [projects, setProjects] = useState<any[]>([]);

    // Form State
    const [projectId, setProjectId] = useState(defaultProjectId || "");
    const [vendorId, setVendorId] = useState(defaultVendorId || "");

    // Array of items to be included in the PO
    const [items, setItems] = useState<{
        sampleId: string;
        commodityId: string;
        commodityName: string;
        quantity: string;
        rate: string;
        amount: string;
    }[]>([]);

    // Derived State
    const selectedProject = projects.find(p => p.id === projectId);

    // Combine vendors from ProjectVendor link AND from Samples
    // Use Map to deduplicate by ID
    const vendorMap = new Map();

    selectedProject?.projectVendors?.forEach((pv: any) => {
        if (pv.vendor) vendorMap.set(pv.vendor.id, pv.vendor);
    });

    selectedProject?.samples?.forEach((s: any) => {
        if (s.vendor) vendorMap.set(s.vendor.id, s.vendor);
    });

    selectedProject?.salesOpportunities?.forEach((opp: any) => {
        opp.sampleSubmissions?.forEach((sub: any) => {
            if (sub.sample?.vendor) vendorMap.set(sub.sample.vendor.id, sub.sample.vendor);
        });
    });

    const vendors = Array.from(vendorMap.values());

    const availableSamples = useMemo(() => {
        if (!selectedProject || !vendorId) return [];
        const all = [
            ...(selectedProject.samples || []),
            ...(selectedProject.salesOpportunities?.flatMap((opp: any) =>
                opp.sampleSubmissions?.map((sub: any) => {
                    if (!sub.sample) return null;
                    return {
                        ...sub.sample,
                        opportunityItem: sub.opportunityItem,
                        opportunityItemId: sub.opportunityItemId
                    };
                }).filter(Boolean) || []
            ) || [])
        ];
        const unique = Array.from(new Map(all.filter(Boolean).filter(s => s.vendor?.id === vendorId || s.vendorId === vendorId).map(s => [s.id, s])).values());
        return unique;
    }, [selectedProject, vendorId]);

    useEffect(() => {
        if (open) {
            loadProjects();
        }
    }, [open]);

    // Auto-populate items when vendor or availableSamples change
    useEffect(() => {
        if (vendorId && availableSamples.length > 0) {
            if (open) { // only auto-populate when dialog is open
                setItems(availableSamples.map((s: any) => ({
                    sampleId: s.id,
                    commodityId: s.opportunityItem?.commodityId || s.project?.commodityId || selectedProject?.commodityId || "",
                    commodityName: s.opportunityItem?.productName || s.opportunityItem?.commodity?.name || s.project?.commodity?.name || s.id.substring(0, 8),
                    quantity: "",
                    rate: s.priceQuoted ? String(s.priceQuoted) : "",
                    amount: ""
                })));
            }
        } else if (!vendorId) {
            setItems([]);
        }
    }, [availableSamples, vendorId, open]);

    async function loadProjects() {
        const result = await getProcurementProjects({ type: "PROJECT" });
        if (result.success && result.data) {
            setProjects(result.data);
        }
    }

    const updateItem = (index: number, field: string, value: string) => {
        const newItems = [...items];
        (newItems[index] as any)[field] = value;

        // Auto-calculate amount
        if (field === 'quantity' || field === 'rate') {
            const qty = parseFloat(field === 'quantity' ? value : newItems[index].quantity) || 0;
            const rate = parseFloat(field === 'rate' ? value : newItems[index].rate) || 0;
            if (qty > 0 && rate > 0) {
                newItems[index].amount = (qty * 1000 * rate).toFixed(2);
            } else {
                newItems[index].amount = "";
            }
        }
        setItems(newItems);
    };

    const removeItem = (index: number) => {
        setItems(items.filter((_, i) => i !== index));
    };

    async function handleCreate() {
        const validItems = items.filter(it => parseFloat(it.quantity) > 0 && parseFloat(it.rate) > 0 && parseFloat(it.amount) > 0);

        if (!projectId || !vendorId || validItems.length === 0) {
            toast.error("Please fill in quantity and rate for at least one item.");
            return;
        }

        setLoading(true);
        try {
            const selectedProject = projects.find(p => p.id === projectId);

            const result = await createManualPurchaseOrder({
                projectId,
                vendorId,
                totalAmount: validItems.reduce((sum, it) => sum + parseFloat(it.amount), 0),
                status: "DRAFT",
                items: validItems.map(it => ({
                    commodityId: it.commodityId || selectedProject?.commodityId || "",
                    sampleId: it.sampleId,
                    quantity: parseFloat(it.quantity),
                    quantityUnit: "MT",
                    rate: parseFloat(it.rate),
                    amount: parseFloat(it.amount)
                }))
            });

            if (result.success) {
                toast.success("Purchase Order created successfully");
                setOpen(false);
                setProjectId("");
                setVendorId("");
                setItems([]);
            } else {
                toast.error("Failed to create purchase order");
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
                {trigger ? trigger : (
                    <Button>
                        <Plus className="h-4 w-4 mr-2" />
                        Create Purchase Order
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Create Purchase Order</DialogTitle>
                    <DialogDescription>
                        Create a multi-item purchase order for a project. Valid items (with quantity {`> 0`}) will be added to the order.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label>Project <span className="text-red-500">*</span></Label>
                        <Combobox
                            options={projects.map(p => ({ label: p.name, value: p.id }))}
                            value={projectId}
                            onChange={(val) => {
                                setProjectId(val);
                                setVendorId(""); // Reset vendor when project changes
                                setItems([]);
                            }}
                            placeholder="Select project..."
                            searchPlaceholder="Search project..."
                            emptyMessage="No projects found"
                        />
                    </div>

                    <div className="grid gap-2">
                        <Label>Vendor <span className="text-red-500">*</span></Label>
                        <Combobox
                            options={vendors.map((v: any) => ({ label: v.name, value: v.id }))}
                            value={vendorId}
                            onChange={(val) => {
                                setVendorId(val);
                            }}
                            placeholder={!projectId ? "Select project first" : "Select vendor..."}
                            searchPlaceholder="Search vendor..."
                            emptyMessage="No vendors in this project"
                        />
                        {projectId && vendors.length === 0 && (
                            <p className="text-xs text-red-500">
                                This project has no vendors. Add a vendor to the project first.
                            </p>
                        )}

                        {availableSamples.length === 0 && projectId && vendorId && (
                            <div className="grid gap-2 mt-4 text-sm text-muted-foreground p-3 border rounded-md bg-slate-50">
                                No approved samples found for this vendor in this project. You must have an approved sample to order an item.
                            </div>
                        )}

                        {items.length > 0 && (
                            <div className="grid gap-3 mt-4">
                                <Label>Order Items <span className="text-red-500">*</span></Label>
                                {items.map((item, idx) => (
                                    <div key={idx} className="grid grid-cols-12 gap-3 items-end border p-4 rounded-md bg-slate-50 relative">
                                        <div className="col-span-12 font-medium text-sm text-slate-800 border-b pb-2 mb-1">
                                            {item.commodityName}
                                        </div>
                                        <div className="col-span-4">
                                            <Label className="text-xs text-slate-500">Quantity (MT)</Label>
                                            <Input
                                                type="number"
                                                placeholder="0.00"
                                                value={item.quantity}
                                                onChange={(e) => updateItem(idx, 'quantity', e.target.value)}
                                                className="bg-white"
                                            />
                                        </div>
                                        <div className="col-span-4">
                                            <Label className="text-xs text-slate-500">Rate (₹/kg)</Label>
                                            <Input
                                                type="number"
                                                placeholder="0.00"
                                                value={item.rate}
                                                onChange={(e) => updateItem(idx, 'rate', e.target.value)}
                                                className="bg-white"
                                            />
                                        </div>
                                        <div className="col-span-4">
                                            <Label className="text-xs text-slate-500">Total Amount</Label>
                                            <Input
                                                type="number"
                                                placeholder="0.00"
                                                value={item.amount}
                                                onChange={(e) => updateItem(idx, 'amount', e.target.value)}
                                                className="bg-slate-100 font-mono"
                                            />
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="absolute top-2 right-2 h-6 w-6 text-red-400 hover:text-red-600 hover:bg-red-50"
                                            onClick={() => removeItem(idx)}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                ))}

                                <div className="flex justify-between items-center mt-2 px-1">
                                    <span className="text-sm text-muted-foreground">
                                        {items.filter(it => parseFloat(it.quantity) > 0).length} items selected
                                    </span>
                                    <div className="text-right">
                                        <span className="text-sm font-medium text-slate-500 mr-2">Order Total:</span>
                                        <span className="text-lg font-bold">
                                            ₹{items.reduce((sum, it) => sum + (parseFloat(it.amount) || 0), 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
                <DialogFooter>
                    <Button
                        onClick={handleCreate}
                        disabled={loading || !projectId || !vendorId || items.filter(it => parseFloat(it.quantity) > 0 && parseFloat(it.rate) > 0).length === 0}
                    >
                        {loading ? "Creating Order..." : "Create Purchase Order"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
