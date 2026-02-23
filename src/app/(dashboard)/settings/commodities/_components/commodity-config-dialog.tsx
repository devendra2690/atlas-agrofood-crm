"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Plus, Trash2, X } from "lucide-react";
import { addCommodityForm, deleteVarietyForm } from "@/app/actions/commodity";
import { toast } from "sonner";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface CommodityConfigDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    commodity: {
        id: string;
        name: string;
        yieldPercentage: number;
        wastagePercentage: number;
        forms?: any[];
    };
    onSuccess: () => void;
}

export function CommodityConfigDialog({ open, onOpenChange, commodity, onSuccess }: CommodityConfigDialogProps) {
    const [loading, setLoading] = useState(false);
    const [newFormName, setNewFormName] = useState("");

    // Effective values for default state
    const effectiveYield = commodity.yieldPercentage;
    const effectiveWastage = commodity.wastagePercentage || 0;

    const [newYield, setNewYield] = useState(effectiveYield.toString());
    const [newWastage, setNewWastage] = useState(effectiveWastage.toString());
    const [creating, setCreating] = useState(false);

    const FORM_OPTIONS = ["Powder", "Flakes", "Chips", "Granules", "Paste", "Dehydrated"];
    const formsList = commodity.forms || [];
    const availableOptions = FORM_OPTIONS.filter(opt => !formsList.some(f => f.formName === opt));

    const handleCreate = async () => {
        if (!newFormName.trim()) return;

        setCreating(true);
        const res = await addCommodityForm(
            commodity.id,
            newFormName,
            parseFloat(newYield) || 100,
            parseFloat(newWastage) || 0
        );

        if (res.success) {
            toast.success("Form added");
            setNewFormName("");
            setNewYield(effectiveYield.toString());
            setNewWastage(effectiveWastage.toString());
            onSuccess();
        } else {
            toast.error("Failed to add form");
        }
        setCreating(false);
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this form?")) return;

        setLoading(true);
        const res = await deleteVarietyForm(id);
        if (res.success) {
            toast.success("Form deleted");
            onSuccess();
        } else {
            toast.error("Failed to delete form");
        }
        setLoading(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle>Configure Base Forms: {commodity.name}</DialogTitle>
                    <DialogDescription>
                        Define specific yield and wastage for different product forms (e.g., Powder, Flakes).
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    {/* Add New Form */}
                    <div className="grid grid-cols-12 gap-2 items-end border-b pb-4">
                        <div className="col-span-5">
                            <Label className="text-xs mb-1 block">Form Name</Label>
                            <Select value={newFormName} onValueChange={setNewFormName}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select Form" />
                                </SelectTrigger>
                                <SelectContent>
                                    {availableOptions.map((option) => (
                                        <SelectItem key={option} value={option}>
                                            {option}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        {/* ... existing yield/wastage inputs ... */}
                        <div className="col-span-3">
                            <Label className="text-xs mb-1 block">Yield %</Label>
                            <Input
                                type="number"
                                value={newYield}
                                onChange={(e) => setNewYield(e.target.value)}
                            />
                        </div>
                        <div className="col-span-3">
                            <Label className="text-xs mb-1 block">Wastage %</Label>
                            <Input
                                type="number"
                                value={newWastage}
                                onChange={(e) => setNewWastage(e.target.value)}
                            />
                        </div>
                        <div className="col-span-1">
                            <Button onClick={handleCreate} disabled={creating || !newFormName.trim()} size="icon">
                                {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                            </Button>
                        </div>
                    </div>

                    {/* List Forms */}
                    <div className="space-y-2 max-h-[300px] overflow-y-auto">
                        {formsList.length === 0 ? (
                            <p className="text-center text-muted-foreground text-sm py-8">
                                No base forms configured for this commodity.
                            </p>
                        ) : (
                            formsList.map((form) => (
                                <div key={form.id} className="grid grid-cols-12 gap-2 items-center bg-slate-50 p-2 rounded border">
                                    <div className="col-span-5 font-medium text-sm">{form.formName}</div>
                                    <div className="col-span-3 text-sm text-muted-foreground">
                                        Yield: {form.yieldPercentage > 0 ? form.yieldPercentage : effectiveYield}%
                                        {form.yieldPercentage === 0 && <span className="text-[10px] ml-1 text-slate-400">(Inherited)</span>}
                                    </div>
                                    <div className="col-span-3 text-sm text-muted-foreground">
                                        Wastage: {form.wastagePercentage > 0 ? form.wastagePercentage : effectiveWastage}%
                                        {form.wastagePercentage === 0 && <span className="text-[10px] ml-1 text-slate-400">(Inherited)</span>}
                                    </div>
                                    <div className="col-span-1 text-right">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                                            onClick={() => handleDelete(form.id)}
                                            disabled={loading}
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
