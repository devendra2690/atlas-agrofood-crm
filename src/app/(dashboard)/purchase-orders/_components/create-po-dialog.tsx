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
        opportunityItemId?: string;
        quantity: string;
        maxQuantity?: number;
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
            setProjectId(defaultProjectId || "");
            setVendorId(defaultVendorId || "");
            loadProjects();
        }
    }, [open, defaultProjectId, defaultVendorId]);

    // Auto-populate items when vendor or availableSamples change
    useEffect(() => {
        if (vendorId && availableSamples.length > 0) {
            if (open) { // only auto-populate when dialog is open
                setItems(availableSamples.map((s: any) => {
                    const commodityId = s.opportunityItem?.commodityId || s.project?.commodityId || selectedProject?.commodityId || "";
                    let maxQuantity = undefined;

                    if (selectedProject && selectedProject.salesOpportunities && commodityId) {
                        const itemDemand = selectedProject.salesOpportunities
                            .filter((opp: any) => opp.status === 'OPEN' || opp.status === 'CLOSED_WON')
                            .reduce((sum: number, opp: any) => {
                                const itemsTotal = (opp.items || [])
                                    .filter((item: any) => s.opportunityItemId ? item.id === s.opportunityItemId : item.commodityId === commodityId)
                                    .reduce((itemSum: number, item: any) => {
                                        const isVendorSupply = s?.vendor?.type === 'VENDOR';
                                        const demandValue = isVendorSupply
                                            ? (Number(item.procurementQuantity) || Number(item.quantity) || 0)
                                            : (Number(item.quantity) || 0);
                                        return itemSum + demandValue;
                                    }, 0);
                                return sum + itemsTotal;
                            }, 0);

                        const itemProcured = (selectedProject.purchaseOrders || [])
                            .filter((po: any) => po.status !== 'CANCELLED')
                            .reduce((sum: number, po: any) => {
                                if (po.items && po.items.length > 0) {
                                    const matchedItems = po.items.filter((it: any) => {
                                        if (s.opportunityItemId && it.opportunityItemId) return it.opportunityItemId === s.opportunityItemId;
                                        return it.commodityId === commodityId;
                                    });
                                    if (matchedItems.length > 0) {
                                        return sum + matchedItems.reduce((matchSum: number, it: any) => matchSum + (Number(it.quantity) || 0), 0);
                                    }
                                    return sum; // Stop here if it has items but none match, do not apply fallback legacy logic
                                }
                                const poItemId = po.sample?.submissions?.[0]?.opportunityItemId;
                                if (s.opportunityItemId && poItemId) return sum + (poItemId === s.opportunityItemId ? (Number(po.quantity) || 0) : 0);
                                if (po.sample?.project?.commodityId === commodityId) return sum + (Number(po.quantity) || 0);
                                return sum;
                            }, 0);

                        maxQuantity = Math.max(0, itemDemand - itemProcured);
                        // Due to floating point differences, round to 5 decimal places to avoid visual bugs like 0.0045 -> 0.005
                        maxQuantity = Math.round(maxQuantity * 100000) / 100000;
                    }

                    return {
                        sampleId: s.id,
                        commodityId,
                        commodityName: s.opportunityItem?.productName || s.opportunityItem?.commodity?.name || s.project?.commodity?.name || s.id.substring(0, 8),
                        opportunityItemId: s.opportunityItemId || undefined,
                        quantity: "",
                        maxQuantity,
                        rate: s.priceQuoted ? String(s.priceQuoted) : "",
                        amount: ""
                    };
                }));
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
        let val = value;

        // Enforce max quantity limit
        if (field === 'quantity') {
            const maxVal = newItems[index].maxQuantity;
            if (maxVal !== undefined && parseFloat(val) > maxVal) {
                val = maxVal.toString();
                toast.error(`Cannot order more than remaining demand: ${maxVal} MT`);
            }
        }

        (newItems[index] as any)[field] = val;

        // Auto-calculate amount
        if (field === 'quantity' || field === 'rate') {
            const qty = parseFloat(field === 'quantity' ? val : newItems[index].quantity) || 0;
            const rate = parseFloat(field === 'rate' ? val : newItems[index].rate) || 0;
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
                sampleId: validItems[0]?.sampleId, // Pass at root level for legacy/single-sample tracking
                items: validItems.map(it => ({
                    commodityId: it.commodityId || selectedProject?.commodityId || "",
                    opportunityItemId: it.opportunityItemId || undefined,
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
                                            <Label className="text-xs text-slate-500">
                                                Quantity (MT)
                                                {item.maxQuantity !== undefined && (
                                                    <span className="text-blue-600 ml-1 block mt-0.5">Max: {item.maxQuantity} MT</span>
                                                )}
                                            </Label>
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
