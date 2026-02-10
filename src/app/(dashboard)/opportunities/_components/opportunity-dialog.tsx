"use client";

import { useState, useEffect } from "react";
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
import { createOpportunity, updateOpportunity } from "@/app/actions/opportunity";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { OpportunityStatus } from "@prisma/client";
import { useRouter } from "next/navigation";
import { Combobox } from "@/components/ui/combobox";

interface Commodity {
    id: string;
    name: string;
    yieldPercentage?: number;
}

interface CompanyOption {
    id: string;
    name: string;
    commodities: Commodity[];
}

interface OpportunityDialogProps {
    companies: CompanyOption[];
    commodities: Commodity[];
    initialData?: any;
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
    trigger?: React.ReactNode;
}

export function OpportunityDialog({ companies, commodities, initialData, open: controlledOpen, onOpenChange: setControlledOpen, trigger }: OpportunityDialogProps) {
    const router = useRouter();
    const [internalOpen, setInternalOpen] = useState(false);
    const [loading, setLoading] = useState(false);

    const isControlled = controlledOpen !== undefined;
    const open = isControlled ? controlledOpen : internalOpen;

    const setOpen = (val: boolean) => {
        if (isControlled && setControlledOpen) {
            setControlledOpen(val);
        } else {
            setInternalOpen(val);
        }
    };

    const [companyId, setCompanyId] = useState(initialData?.companyId || "");
    const [commodityId, setCommodityId] = useState(initialData?.commodityId || "");
    const [productName, setProductName] = useState(initialData?.productName || "");
    const [opportunityType, setOpportunityType] = useState<"ONE_TIME" | "RECURRING">(initialData?.type || "ONE_TIME");

    // Controlled Quantity & ProcurementQty
    const [quantity, setQuantity] = useState<string>(initialData?.quantity?.toString() || "");
    const [procurementQuantity, setProcurementQuantity] = useState<string>(initialData?.procurementQuantity?.toString() || "");

    // Update state when initialData changes or dialog opens
    useEffect(() => {
        if (open) {
            setCompanyId(initialData?.companyId || "");
            setCommodityId(initialData?.commodityId || "");
            setProductName(initialData?.productName || "");
            setOpportunityType(initialData?.type || "ONE_TIME");
            setQuantity(initialData?.quantity?.toString() || "");
            setProcurementQuantity(initialData?.procurementQuantity?.toString() || "");
        }
    }, [initialData, open]);

    // Filter available commodities
    const selectedCompany = companies.find(c => c.id === companyId);

    // If company is selected, show ONLY their commodities. 
    // If no company selected, show ALL commodities (or empty? Let's show all for flexibility until company picked)
    const availableCommodities = selectedCompany
        ? (selectedCompany.commodities || [])
        : (commodities || []);

    // Auto-calculate procurement quantity
    useEffect(() => {
        if (!quantity || !commodityId) return;

        const comm = availableCommodities.find(c => c.id === commodityId);
        const yieldPerc = comm?.yieldPercentage || 100;

        if (!comm && !yieldPerc) {
            return;
        }

        const qtyNum = parseFloat(quantity);
        if (!isNaN(qtyNum)) {
            // Needed = Qty * (100 / Yield)
            const needed = qtyNum * (100 / yieldPerc);
            setProcurementQuantity(needed.toFixed(2));
        }
    }, [quantity, commodityId, availableCommodities]); // Depends on these changing

    const handleCommodityChange = (val: string) => {
        setCommodityId(val);
        const comm = availableCommodities.find(c => c.id === val);
        const selectedCompany = companies.find(c => c.id === companyId);

        if (comm) {
            if (selectedCompany) {
                setProductName(`${comm.name} - ${selectedCompany.name}`);
            } else {
                setProductName(comm.name);
            }
        }
    };

    async function handleSubmit(formData: FormData) {
        setLoading(true);
        try {
            const productName = formData.get("productName") as string;
            const targetPriceStr = formData.get("targetPrice") as string;
            const priceType = formData.get("priceType") as any;
            // Quantity is controlled state 'quantity' but we can read from formData too
            const quantityStr = quantity;
            const procurementQuantityStr = procurementQuantity;

            const deadlineStr = formData.get("deadline") as string;
            const status = formData.get("status") as OpportunityStatus;
            const type = formData.get("type") as any;
            const recurringFrequency = formData.get("recurringFrequency") as any;
            const notes = formData.get("notes") as string;

            if (!companyId) {
                toast.error("Company is required");
                setLoading(false);
                return;
            }
            if (!commodityId) {
                toast.error("Commodity is required");
                setLoading(false);
                return;
            }
            if (!productName.trim()) {
                toast.error("Product name is required");
                setLoading(false);
                return;
            }
            if (!quantityStr || parseFloat(quantityStr) <= 0) {
                toast.error("Quantity is required");
                setLoading(false);
                return;
            }
            if (!procurementQuantityStr || parseFloat(procurementQuantityStr) <= 0) {
                toast.error("Raw material needed is required");
                setLoading(false);
                return;
            }
            if (!targetPriceStr || parseFloat(targetPriceStr) <= 0) {
                toast.error("Target selling price is required");
                setLoading(false);
                return;
            }
            if (!deadlineStr) {
                toast.error("Deadline is required");
                setLoading(false);
                return;
            }

            const data = {
                companyId,
                productName,
                commodityId: commodityId || undefined,
                targetPrice: targetPriceStr ? parseFloat(targetPriceStr) : undefined,
                priceType: priceType || "PER_KG",
                quantity: quantityStr ? parseFloat(quantityStr) : undefined,
                procurementQuantity: procurementQuantityStr ? parseFloat(procurementQuantityStr) : undefined,
                deadline: deadlineStr ? new Date(deadlineStr) : undefined,
                status: status || "OPEN",
                type: type || "ONE_TIME",
                recurringFrequency: recurringFrequency || undefined,
                notes: notes
            };

            let result;
            if (initialData) {
                result = await updateOpportunity(initialData.id, data);
            } else {
                result = await createOpportunity(data);
            }

            if (result.success) {
                toast.success(initialData ? "Opportunity updated" : "Opportunity created");
                setOpen(false);
                router.refresh();
                if (!initialData) {
                    setCompanyId("");
                    setCommodityId("");
                    setProductName("");
                    setQuantity("");
                    setProcurementQuantity("");
                }
            } else {
                toast.error(result.error || (initialData ? "Failed to update opportunity" : "Failed to create opportunity"));
            }
        } catch (error) {
            console.error(error);
            toast.error("An error occurred");
        } finally {
            setLoading(false);
        }
    }

    return (
        <Dialog open={open} onOpenChange={(val) => {
            setOpen(val);
            if (!val && !initialData) {
                setOpportunityType("ONE_TIME");
            }
        }}>
            {trigger === undefined ? (
                <DialogTrigger asChild>
                    <Button>
                        <Plus className="h-4 w-4 mr-2" />
                        Add Opportunity
                    </Button>
                </DialogTrigger>
            ) : (
                trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>
            )}
            <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{initialData ? "Edit Opportunity" : "Add Opportunity"}</DialogTitle>
                    <DialogDescription>
                        {initialData ? "Update deal details." : "Create a new sales opportunity / deal."}
                    </DialogDescription>
                </DialogHeader>
                <form action={handleSubmit}>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="company">Company (Client) <span className="text-red-500">*</span></Label>
                            <Combobox
                                options={companies.map(c => ({ label: c.name, value: c.id }))}
                                value={companyId}
                                onChange={(val) => {
                                    setCompanyId(val);
                                    setCommodityId("");
                                }}
                                placeholder="Select company..."
                                searchPlaceholder="Search company..."
                                emptyMessage="No company found."
                            />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="commodity">Commodity <span className="text-red-500">*</span></Label>
                            <Combobox
                                options={availableCommodities.map(c => ({ label: c.name, value: c.id }))}
                                value={commodityId}
                                onChange={handleCommodityChange}
                                placeholder="Select commodity..."
                                searchPlaceholder="Search commodity..."
                                emptyMessage="No commodities found"
                            />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="productName">Product Name / Deal Title <span className="text-red-500">*</span></Label>
                            <Input
                                id="productName"
                                name="productName"
                                placeholder="e.g. Banana Powder"
                                value={productName}
                                onChange={(e) => setProductName(e.target.value)}
                                required
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="type">Type <span className="text-red-500">*</span></Label>
                                <Select
                                    name="type"
                                    value={opportunityType}
                                    onValueChange={(val) => setOpportunityType(val as any)}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="ONE_TIME">One Time</SelectItem>
                                        <SelectItem value="RECURRING">Recurring</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            {opportunityType === 'RECURRING' && (
                                <div className="grid gap-2">
                                    <Label htmlFor="recurringFrequency">Frequency</Label>
                                    <Select name="recurringFrequency" defaultValue={initialData?.recurringFrequency || "MONTHLY"}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select frequency" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="WEEKLY">Weekly</SelectItem>
                                            <SelectItem value="MONTHLY">Monthly</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="quantity">Quantity (MT) <span className="text-red-500">*</span></Label>
                                <Input
                                    id="quantity"
                                    name="quantity"
                                    type="number"
                                    value={quantity}
                                    onChange={(e) => setQuantity(e.target.value)}
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="procurementQuantity">Raw Material Needed (MT) <span className="text-red-500">*</span></Label>
                                <Input
                                    id="procurementQuantity"
                                    name="procurementQuantity"
                                    type="number"
                                    value={procurementQuantity}
                                    onChange={(e) => setProcurementQuantity(e.target.value)}
                                    placeholder={!commodityId ? "Select commodity" : "Auto-calculated"}
                                />
                                {commodityId && (
                                    <p className="text-[10px] text-muted-foreground">
                                        Yield: {availableCommodities.find(c => c.id === commodityId)?.yieldPercentage || 100}%
                                    </p>
                                )}
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="targetPrice">Target Selling Price (INR) <span className="text-red-500">*</span></Label>
                                <div className="flex gap-2">
                                    <Input
                                        id="targetPrice"
                                        name="targetPrice"
                                        type="number"
                                        step="0.01"
                                        className="flex-1"
                                        defaultValue={initialData?.targetPrice}
                                    />
                                    <Select name="priceType" defaultValue={initialData?.priceType || "PER_KG"}>
                                        <SelectTrigger className="w-[110px]">
                                            <SelectValue placeholder="Unit" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="PER_KG">/ Kg</SelectItem>
                                            <SelectItem value="PER_MT">/ MT</SelectItem>
                                            <SelectItem value="TOTAL_AMOUNT">Total</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="status">Status <span className="text-red-500">*</span></Label>
                                <Select name="status" defaultValue={initialData?.status || "OPEN"}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="OPEN">New / Open</SelectItem>
                                        <SelectItem value="QUALIFICATION">Qualification</SelectItem>
                                        <SelectItem value="PROPOSAL">Proposal</SelectItem>
                                        <SelectItem value="NEGOTIATION">Negotiation</SelectItem>
                                        <SelectItem value="CLOSED_WON">Closed Won</SelectItem>
                                        <SelectItem value="CLOSED_LOST">Closed Lost</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        {/* Deadline Field - Was missing or previously garbled */}
                        <div className="grid gap-2">
                            <Label htmlFor="deadline">Deadline <span className="text-red-500">*</span></Label>
                            <Input
                                id="deadline"
                                name="deadline"
                                type="date"
                                defaultValue={initialData?.deadline ? new Date(initialData.deadline).toISOString().split('T')[0] : ''}
                            />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="notes">Notes</Label>
                            <textarea
                                id="notes"
                                name="notes"
                                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                placeholder="Additional details..."
                                defaultValue={initialData?.notes}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="submit" disabled={loading}>
                            {loading ? "Saving..." : (initialData ? "Update Opportunity" : "Create Opportunity")}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
