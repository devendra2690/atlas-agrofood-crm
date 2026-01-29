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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { createManualPurchaseOrder, getProcurementProjects } from "@/app/actions/procurement";

export function CreatePurchaseOrderDialog({
    defaultProjectId,
    defaultVendorId,
    trigger
}: {
    defaultProjectId?: string,
    defaultVendorId?: string,
    trigger?: React.ReactNode
}) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [projects, setProjects] = useState<any[]>([]);

    // Form State
    const [projectId, setProjectId] = useState(defaultProjectId || "");
    const [vendorId, setVendorId] = useState(defaultVendorId || "");
    const [amount, setAmount] = useState("");
    const [quantity, setQuantity] = useState("");
    const [rate, setRate] = useState("");

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

    useEffect(() => {
        if (open) {
            loadProjects();
        }
    }, [open]);

    async function loadProjects() {
        const result = await getProcurementProjects({ type: "PROJECT" });
        if (result.success && result.data) {
            setProjects(result.data);
        }
    }

    async function handleCreate() {
        if (!projectId || !vendorId || !amount || !quantity) return;
        setLoading(true);
        try {
            const result = await createManualPurchaseOrder({
                projectId,
                vendorId,
                totalAmount: parseFloat(amount),
                status: "DRAFT",
                quantity: parseFloat(quantity),
                quantityUnit: "MT"
            });

            if (result.success) {
                toast.success("Purchase Order created successfully");
                setOpen(false);
                setProjectId("");
                setVendorId("");
                setAmount("");
                setQuantity("");
                setRate("");
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
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Create Purchase Order</DialogTitle>
                    <DialogDescription>
                        Manually create a purchase order for a project.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label>Project</Label>
                        <Combobox
                            options={projects.map(p => ({ label: p.name, value: p.id }))}
                            value={projectId}
                            onChange={(val) => {
                                setProjectId(val);
                                setVendorId(""); // Reset vendor when project changes
                            }}
                            placeholder="Select project..."
                            searchPlaceholder="Search project..."
                            emptyMessage="No projects found"
                        />
                    </div>

                    <div className="grid gap-2">
                        <Label>Vendor</Label>
                        <Combobox
                            options={vendors.map((v: any) => ({ label: v.name, value: v.id }))}
                            value={vendorId}
                            onChange={setVendorId}
                            placeholder={!projectId ? "Select project first" : "Select vendor..."}
                            searchPlaceholder="Search vendor..."
                            emptyMessage="No vendors in this project"
                        />
                        {projectId && vendors.length === 0 && (
                            <p className="text-xs text-red-500">
                                This project has no vendors. Add a vendor to the project first.
                            </p>
                        )}

                        {(() => {
                            if (!selectedProject || !quantity) return null;
                            const qty = parseFloat(quantity) || 0;
                            if (qty <= 0) return null;

                            const totalDemand = selectedProject.salesOpportunities
                                .filter((opp: any) => opp.status === 'OPEN' || opp.status === 'CLOSED_WON')
                                .reduce((sum: number, opp: any) => sum + (Number(opp.procurementQuantity) || Number(opp.quantity) || 0), 0);

                            const currentProcured = selectedProject.purchaseOrders
                                .filter((po: any) => po.status !== 'CANCELLED')
                                .reduce((sum: number, po: any) => sum + (Number(po.quantity) || 0), 0);

                            const projectedTotal = currentProcured + qty;

                            if (projectedTotal > totalDemand) {
                                const surplus = projectedTotal - totalDemand;
                                return (
                                    <div className="rounded-md bg-amber-50 p-3 text-sm text-amber-800 border border-amber-200 mt-2">
                                        <p className="font-semibold flex items-center gap-2">
                                            ⚠️ Potential Surplus Warning
                                        </p>
                                        <p className="mt-1">
                                            Demand: <strong>{totalDemand.toFixed(2)} MT</strong><br />
                                            Already Procured: <strong>{currentProcured.toFixed(2)} MT</strong><br />
                                            <span className="text-red-600 font-medium">This PO will create a {surplus.toFixed(2)} MT surplus.</span>
                                        </p>
                                    </div>
                                );
                            }
                            return null;
                        })()}
                    </div>

                    <div className="grid gap-2">
                        <Label>Quantity (MT)</Label>
                        <Input
                            type="number"
                            placeholder="0.00"
                            value={quantity}
                            onChange={(e) => {
                                setQuantity(e.target.value);
                                if (e.target.value && rate) {
                                    // Quantity (MT) * 1000 * Rate (per kg)
                                    setAmount((parseFloat(e.target.value) * 1000 * parseFloat(rate)).toFixed(2));
                                }
                            }}
                        />
                    </div>

                    <div className="grid gap-2">
                        <Label>Rate (per kg)</Label>
                        <Input
                            type="number"
                            placeholder="0.00"
                            value={rate}
                            onChange={(e) => {
                                setRate(e.target.value);
                                if (quantity && e.target.value) {
                                    // Quantity (MT) * 1000 * Rate (per kg)
                                    setAmount((parseFloat(quantity) * 1000 * parseFloat(e.target.value)).toFixed(2));
                                }
                            }}
                        />
                    </div>

                    <div className="grid gap-2">
                        <Label>Total Amount</Label>
                        <Input
                            type="number"
                            placeholder="0.00"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                        // readOnly
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button onClick={handleCreate} disabled={loading || !projectId || !vendorId || !quantity || !amount}>
                        {loading ? "Creating..." : "Create Order"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
