"use client";

import { useState, useEffect } from "react";
import { OpportunityPoAttachment } from "./po-attachment";
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
import { getCommodityVarieties } from "@/app/actions/commodity";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { OpportunityStatus } from "@prisma/client";
import { useRouter } from "next/navigation";
import { Combobox } from "@/components/ui/combobox";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

interface Commodity {
    id: string;
    name: string;
    yieldPercentage?: number;
    forms?: any[];
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

export type OpportunityItemData = {
    localId: string;
    id?: string;
    productName: string;
    commodityId: string;
    varietyId: string;
    varietyFormId: string;
    targetPrice: string;
    priceType: "PER_KG" | "PER_MT" | "TOTAL_AMOUNT";
    quantity: string;
    procurementQuantity: string;
    notes: string;
};

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

    // Global Opportunity State
    const [companyId, setCompanyId] = useState(initialData?.companyId || "");
    const [opportunityType, setOpportunityType] = useState<"ONE_TIME" | "RECURRING">(initialData?.type || "ONE_TIME");
    const [recurringFrequency, setRecurringFrequency] = useState(initialData?.recurringFrequency || "MONTHLY");
    const [deadline, setDeadline] = useState(initialData?.deadline ? new Date(initialData.deadline).toISOString().split('T')[0] : "");
    const [status, setStatus] = useState<OpportunityStatus>(initialData?.status || "OPEN");
    const [notes, setNotes] = useState(initialData?.notes || "");
    const [electricityRate, setElectricityRate] = useState("8.50"); // Buldhana default

    // Line Items State
    const [items, setItems] = useState<OpportunityItemData[]>([]);
    const [varietiesMap, setVarietiesMap] = useState<Record<string, any[]>>({});

    useEffect(() => {
        if (open) {
            setCompanyId(initialData?.companyId || "");
            setOpportunityType(initialData?.type || "ONE_TIME");
            setRecurringFrequency(initialData?.recurringFrequency || "MONTHLY");
            setDeadline(initialData?.deadline ? new Date(initialData.deadline).toISOString().split('T')[0] : "");
            setStatus(initialData?.status || "OPEN");
            setNotes(initialData?.notes || "");

            if (initialData?.items && initialData.items.length > 0) {
                setItems(initialData.items.map((it: any) => ({
                    localId: Math.random().toString(),
                    id: it.id,
                    productName: it.productName || "",
                    commodityId: it.commodityId || "",
                    varietyId: it.varietyId || "",
                    varietyFormId: it.varietyFormId || "",
                    targetPrice: it.targetPrice?.toString() || "",
                    priceType: it.priceType || "PER_KG",
                    quantity: it.quantity?.toString() || "",
                    procurementQuantity: it.procurementQuantity?.toString() || "",
                    notes: it.notes || ""
                })));
            } else {
                setItems([{ localId: Math.random().toString(), productName: "", commodityId: "", varietyId: "", varietyFormId: "", targetPrice: "", priceType: "PER_KG", quantity: "", procurementQuantity: "", notes: "" }]);
            }
        }
    }, [initialData, open]);

    // The user requested to see ALL commodities dynamically
    const availableCommodities = commodities || [];

    useEffect(() => {
        const fetchVarieties = async () => {
            const neededCommodityIds = [...new Set(items.map(i => i.commodityId).filter(Boolean))];
            const newVarietiesMap = { ...varietiesMap };
            let updated = false;

            for (const cId of neededCommodityIds) {
                if (!newVarietiesMap[cId]) {
                    const res = await getCommodityVarieties(cId);
                    if (res.success && res.data) {
                        newVarietiesMap[cId] = res.data;
                        updated = true;
                    }
                }
            }
            if (updated) setVarietiesMap(newVarietiesMap);
        };
        fetchVarieties();
    }, [items, varietiesMap]);

    const handleItemChange = (index: number, field: keyof OpportunityItemData, value: string) => {
        const newItems = [...items];
        newItems[index] = { ...newItems[index], [field]: value };

        // Auto-generate product name if commodity changed
        if (field === 'commodityId') {
            newItems[index].varietyId = "";
            newItems[index].varietyFormId = "";
            const comm = availableCommodities.find(c => c.id === value);
            if (comm) newItems[index].productName = comm.name;
        }

        // Auto-calc proc qty
        if (['quantity', 'commodityId', 'varietyId', 'varietyFormId'].includes(field)) {
            const it = newItems[index];
            if (it.quantity && it.commodityId) {
                const commodity = availableCommodities.find(c => c.id === it.commodityId);
                let yieldPerc = commodity?.yieldPercentage || 100;

                if (it.varietyId && varietiesMap[it.commodityId]) {
                    const variety = varietiesMap[it.commodityId].find((v: any) => v.id === it.varietyId);
                    if (variety) {
                        if (it.varietyFormId && variety.forms) {
                            const form = variety.forms.find((f: any) => f.id === it.varietyFormId);
                            if (form?.yieldPercentage) yieldPerc = form.yieldPercentage;
                            else if (variety.yieldPercentage) yieldPerc = variety.yieldPercentage;
                        } else if (variety.yieldPercentage) yieldPerc = variety.yieldPercentage;
                    }
                } else if (!it.varietyId && it.varietyFormId && commodity?.forms) {
                    const form = commodity.forms.find((f: any) => f.id === it.varietyFormId);
                    if (form?.yieldPercentage) yieldPerc = form.yieldPercentage;
                }

                const qtyNum = parseFloat(it.quantity);
                if (!isNaN(qtyNum)) {
                    newItems[index].procurementQuantity = (qtyNum * (100 / yieldPerc)).toFixed(2);
                }
            }
        }

        setItems(newItems);
    };

    const addItem = () => setItems([...items, { localId: Math.random().toString(), productName: "", commodityId: "", varietyId: "", varietyFormId: "", targetPrice: "", priceType: "PER_KG", quantity: "", procurementQuantity: "", notes: "" }]);
    const removeItem = (index: number) => setItems(items.filter((_, i) => i !== index));

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setLoading(true);
        try {
            if (!companyId) { toast.error("Company is required"); setLoading(false); return; }
            if (!deadline) { toast.error("Deadline is required"); setLoading(false); return; }
            if (items.length === 0) { toast.error("At least one item is required"); setLoading(false); return; }

            // Validate items
            for (let i = 0; i < items.length; i++) {
                const item = items[i];
                if (!item.commodityId) { toast.error(`Item ${i + 1}: Commodity is required`); setLoading(false); return; }
                if (!item.productName.trim()) { toast.error(`Item ${i + 1}: Product name is required`); setLoading(false); return; }
                if (!item.quantity || parseFloat(item.quantity) <= 0) { toast.error(`Item ${i + 1}: Quantity is required`); setLoading(false); return; }
                if (!item.targetPrice || parseFloat(item.targetPrice) <= 0) { toast.error(`Item ${i + 1}: Target price is required`); setLoading(false); return; }
            }

            const activeItemsData = items.map(item => ({
                id: item.id || undefined,
                productName: item.productName,
                commodityId: item.commodityId,
                varietyId: item.varietyId || undefined,
                varietyFormId: item.varietyFormId || undefined,
                targetPrice: parseFloat(item.targetPrice),
                priceType: item.priceType,
                quantity: parseFloat(item.quantity),
                procurementQuantity: item.procurementQuantity ? parseFloat(item.procurementQuantity) : undefined,
                notes: item.notes
            }));

            const payload = {
                companyId,
                deadline: new Date(deadline),
                status,
                type: opportunityType,
                recurringFrequency: opportunityType === 'RECURRING' ? (recurringFrequency as any) : undefined,
                notes,
                items: activeItemsData
            };

            let result;
            if (initialData) {
                result = await updateOpportunity(initialData.id, payload);
            } else {
                result = await createOpportunity(payload);
            }

            if (result.success) {
                toast.success(initialData ? "Opportunity updated" : "Opportunity created");
                setOpen(false);
                router.refresh();
                if (!initialData) {
                    setCompanyId("");
                    setItems([{ localId: Math.random().toString(), productName: "", commodityId: "", varietyId: "", varietyFormId: "", targetPrice: "", priceType: "PER_KG", quantity: "", procurementQuantity: "", notes: "" }]);
                }
            } else {
                toast.error(result.error || "Failed to save opportunity");
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
            <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto w-[90vw]">
                <DialogHeader>
                    <DialogTitle>{initialData ? "Edit Opportunity" : "Add Opportunity"}</DialogTitle>
                    <DialogDescription>
                        {initialData ? "Update deal details." : "Create a new sales opportunity / deal."}
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-6 py-4">
                    {/* General Opportunity Info */}
                    <div className="grid gap-4">
                        <div className="grid md:grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="company">Company (Client) <span className="text-red-500">*</span></Label>
                                <Combobox
                                    options={companies.map(c => ({ label: c.name, value: c.id }))}
                                    value={companyId}
                                    onChange={setCompanyId}
                                    placeholder="Select company..."
                                    searchPlaceholder="Search company..."
                                    emptyMessage="No company found."
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="status">Status <span className="text-red-500">*</span></Label>
                                <Select value={status} onValueChange={(val: any) => setStatus(val)}>
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

                        <div className="grid md:grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="type">Type <span className="text-red-500">*</span></Label>
                                <Select
                                    value={opportunityType}
                                    onValueChange={(val: any) => setOpportunityType(val)}
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
                                    <Select value={recurringFrequency} onValueChange={setRecurringFrequency}>
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
                            {opportunityType !== 'RECURRING' && <div></div>}
                            <div className="grid gap-2">
                                <Label htmlFor="deadline">Deadline <span className="text-red-500">*</span></Label>
                                <Input
                                    id="deadline"
                                    type="date"
                                    value={deadline}
                                    onChange={(e) => setDeadline(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="grid md:grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="notes">Global Notes</Label>
                                <Input
                                    id="notes"
                                    placeholder="Additional details..."
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="elecRate">Electricity Rate (₹ / KWh)</Label>
                                <Input
                                    id="elecRate"
                                    type="number"
                                    step="0.1"
                                    value={electricityRate}
                                    onChange={(e) => setElectricityRate(e.target.value)}
                                />
                                <p className="text-[10px] text-muted-foreground mt-1 text-right">
                                    Factory unit cost for processing
                                </p>
                            </div>
                        </div>
                    </div>

                    <Separator />

                    {/* Line Items */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <Label className="text-lg font-semibold">Commodity Items</Label>
                            <Button type="button" variant="outline" size="sm" onClick={addItem}>
                                <Plus className="h-4 w-4 mr-2" /> Add Item
                            </Button>
                        </div>

                        {items.map((item, index) => {
                            const commodityObj = availableCommodities.find(c => c.id === item.commodityId) as any;
                            const availableVarieties = varietiesMap[item.commodityId] || [];
                            const varietyObj = availableVarieties.find((v: any) => v.id === item.varietyId);
                            const availableForms = item.varietyId ? (varietyObj?.forms || []) : (commodityObj?.forms || []);
                            const formObj = availableForms.find((f: any) => f.id === item.varietyFormId);

                            // Energy Calculation
                            const baseUnits = commodityObj?.baseBatchElectricityUnits || 0;
                            const formMultiplier = formObj?.formElectricityMultiplier || 0;
                            const finishedQtyKG = (parseFloat(item.quantity) || 0) * 1000;
                            const grindingUnits = finishedQtyKG * formMultiplier;
                            const totalEnergyUnits = baseUnits + grindingUnits;
                            const elecRateVal = parseFloat(electricityRate) || 8.50;
                            const estEnergyCost = totalEnergyUnits * elecRateVal;

                            return (
                                <Card key={item.localId} className="relative overflow-visible">
                                    {items.length > 1 && (
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            className="absolute -top-3 -right-3 h-8 w-8 rounded-full bg-destructive text-destructive-foreground hover:bg-destructive/90 z-10"
                                            onClick={() => removeItem(index)}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    )}
                                    <CardContent className="p-4 space-y-4">
                                        <div className="grid md:grid-cols-2 gap-4">
                                            <div className="grid gap-2">
                                                <Label>Commodity <span className="text-red-500">*</span></Label>
                                                <Combobox
                                                    options={availableCommodities.map((c: any) => ({ label: c.name, value: c.id }))}
                                                    value={item.commodityId}
                                                    onChange={(val) => handleItemChange(index, 'commodityId', val)}
                                                    placeholder="Select commodity..."
                                                    searchPlaceholder="Search commodity..."
                                                    emptyMessage="No commodities found"
                                                />
                                            </div>
                                            <div className="grid gap-2">
                                                <Label>Product Name / Title <span className="text-red-500">*</span></Label>
                                                <Input
                                                    placeholder="e.g. Premium Grade A"
                                                    value={item.productName}
                                                    onChange={(e) => handleItemChange(index, 'productName', e.target.value)}
                                                    required
                                                />
                                            </div>
                                        </div>

                                        <div className="grid md:grid-cols-2 gap-4">
                                            {availableVarieties.length > 0 && (
                                                <div className="grid gap-2">
                                                    <Label>Variety</Label>
                                                    <Combobox
                                                        options={availableVarieties.map((v: any) => ({ label: `${v.name} (Yield: ${v.yieldPercentage}%)`, value: v.id }))}
                                                        value={item.varietyId}
                                                        onChange={(val) => handleItemChange(index, 'varietyId', val)}
                                                        placeholder="Select variety..."
                                                        searchPlaceholder="Search variety..."
                                                        emptyMessage="No varieties"
                                                    />
                                                </div>
                                            )}
                                            {availableForms.length > 0 && (
                                                <div className="grid gap-2">
                                                    <Label>Form</Label>
                                                    <Combobox
                                                        options={availableForms.map((f: any) => ({ label: `${f.formName} (Yield: ${f.yieldPercentage}%)`, value: f.id }))}
                                                        value={item.varietyFormId}
                                                        onChange={(val) => handleItemChange(index, 'varietyFormId', val)}
                                                        placeholder="Select form..."
                                                        searchPlaceholder="Search form..."
                                                        emptyMessage="No forms found"
                                                    />
                                                </div>
                                            )}
                                        </div>

                                        <div className="grid md:grid-cols-2 gap-4">
                                            <div className="grid gap-2">
                                                <Label>Quantity (MT) <span className="text-red-500">*</span></Label>
                                                <Input
                                                    type="number"
                                                    value={item.quantity}
                                                    onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                                                />
                                            </div>
                                            <div className="grid gap-2">
                                                <Label>Raw Material Needed (MT) <span className="text-red-500">*</span></Label>
                                                <Input
                                                    type="number"
                                                    value={item.procurementQuantity}
                                                    onChange={(e) => handleItemChange(index, 'procurementQuantity', e.target.value)}
                                                    placeholder="Auto-calculated"
                                                />
                                                {item.commodityId && (
                                                    <p className="text-[10px] text-muted-foreground mt-1 text-right">
                                                        Auto-calc based on Yield %
                                                    </p>
                                                )}
                                            </div>
                                        </div>

                                        <div className="grid md:grid-cols-2 gap-4">
                                            <div className="grid gap-2">
                                                <Label>Target Price (INR) <span className="text-red-500">*</span></Label>
                                                <div className="flex gap-2">
                                                    <Input
                                                        type="number"
                                                        step="0.01"
                                                        className="flex-1"
                                                        value={item.targetPrice}
                                                        onChange={(e) => handleItemChange(index, 'targetPrice', e.target.value)}
                                                    />
                                                    <Select value={item.priceType} onValueChange={(val: any) => handleItemChange(index, 'priceType', val)}>
                                                        <SelectTrigger className="w-[110px]">
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="PER_KG">/ Kg</SelectItem>
                                                            <SelectItem value="PER_MT">/ MT</SelectItem>
                                                            <SelectItem value="TOTAL_AMOUNT">Total</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                            </div>
                                            {item.commodityId && (
                                                <div className="grid gap-2 border rounded p-2 bg-slate-50 text-sm">
                                                    <Label className="text-blue-700 font-semibold mb-1">Energy Profile Estimate</Label>
                                                    <div className="flex justify-between text-muted-foreground text-xs">
                                                        <span>Base Units (Category):</span>
                                                        <span>{baseUnits.toLocaleString()} KWh</span>
                                                    </div>
                                                    {formMultiplier > 0 && (
                                                        <div className="flex justify-between text-muted-foreground text-xs">
                                                            <span>Grinding ({formMultiplier} x {finishedQtyKG.toLocaleString()}kg):</span>
                                                            <span>{grindingUnits.toLocaleString()} KWh</span>
                                                        </div>
                                                    )}
                                                    <div className="flex justify-between font-medium text-slate-700 text-xs border-t pt-1 mt-1">
                                                        <span>Est. Electricity Cost:</span>
                                                        <span>₹ {estEnergyCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>

                    {initialData && (
                        <div className="mt-4">
                            <OpportunityPoAttachment
                                opportunityId={initialData.id}
                                initialUrl={initialData.poUrl}
                            />
                        </div>
                    )}

                    <DialogFooter className="mt-4">
                        <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                        <Button type="submit" disabled={loading}>
                            {loading ? "Saving..." : (initialData ? "Update Opportunity" : "Create Opportunity")}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog >
    );
}
