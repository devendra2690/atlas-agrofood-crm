"use client";

import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Plus, Trash2, Tag, Settings2 } from "lucide-react";
import { getCommodityVarieties, createCommodityVariety, deleteCommodityVariety } from "@/app/actions/commodity";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { VarietyConfigDialog } from "./variety-config-dialog";

interface ManageVarietiesDialogProps {
    commodityId: string;
    commodityName: string;
    commodityYield: number;
    commodityWastage: number;
    trigger?: React.ReactNode;
}

export function ManageVarietiesDialog({ commodityId, commodityName, commodityYield, commodityWastage, trigger }: ManageVarietiesDialogProps) {
    const [open, setOpen] = useState(false);
    const [varieties, setVarieties] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [newVariety, setNewVariety] = useState("");
    const [newYield, setNewYield] = useState(commodityYield.toString());
    const [newWastage, setNewWastage] = useState(commodityWastage.toString());
    const [creating, setCreating] = useState(false);

    // Config Dialog State
    const [configOpen, setConfigOpen] = useState(false);
    const [selectedVariety, setSelectedVariety] = useState<any>(null);

    const loadVarieties = async () => {
        setLoading(true);
        const res = await getCommodityVarieties(commodityId);
        if (res.success && res.data) {
            setVarieties(res.data);
        }
        setLoading(false);
    };

    useEffect(() => {
        if (open) {
            loadVarieties();
        }
    }, [open, commodityId]);

    const handleCreate = async () => {
        if (!newVariety.trim()) return;

        setCreating(true);
        const res = await createCommodityVariety(
            commodityId,
            newVariety,
            parseFloat(newYield) || 100,
            parseFloat(newWastage) || 0
        );
        if (res.success) {
            toast.success("Variety added");
            setNewVariety("");
            setNewYield(commodityYield.toString());
            setNewWastage(commodityWastage.toString());
            loadVarieties();
        } else {
            toast.error("Failed to add variety");
        }
        setCreating(false);
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure?")) return;
        const res = await deleteCommodityVariety(id);
        if (res.success) {
            toast.success("Variety removed");
            loadVarieties();
        } else {
            toast.error("Failed to remove variety");
        }
    };

    const openConfig = (variety: any) => {
        setSelectedVariety(variety);
        setConfigOpen(true);
    };

    return (
        <>
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogTrigger asChild>
                    {trigger || <Button variant="outline" size="sm"><Tag className="w-4 h-4 mr-2" /> Varieties</Button>}
                </DialogTrigger>
                <DialogContent className="sm:max-w-[600px]">
                    <DialogHeader>
                        <DialogTitle>Manage Varieties: {commodityName}</DialogTitle>
                        <DialogDescription>
                            Add or remove varieties for this commodity. Configure specific forms per variety.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        <div className="flex gap-2 items-end">
                            <div className="flex-1">
                                <label className="text-xs font-medium mb-1 block">Name</label>
                                <Input
                                    placeholder="Variety Name (e.g. Red Onion)"
                                    value={newVariety}
                                    onChange={(e) => setNewVariety(e.target.value)}
                                    onKeyDown={(e) => e.key === "Enter" && handleCreate()}
                                />
                            </div>
                            <div className="w-[80px]">
                                <label className="text-xs font-medium mb-1 block">Yield %</label>
                                <Input
                                    type="number"
                                    placeholder="%"
                                    value={newYield}
                                    onChange={(e) => setNewYield(e.target.value)}
                                    onKeyDown={(e) => e.key === "Enter" && handleCreate()}
                                />
                            </div>
                            <div className="w-[80px]">
                                <label className="text-xs font-medium mb-1 block">Wastage %</label>
                                <Input
                                    type="number"
                                    placeholder="%"
                                    value={newWastage}
                                    onChange={(e) => setNewWastage(e.target.value)}
                                    onKeyDown={(e) => e.key === "Enter" && handleCreate()}
                                />
                            </div>
                            <Button onClick={handleCreate} disabled={creating || !newVariety.trim()}>
                                {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                            </Button>
                        </div>

                        <div className="rounded-md border p-4 max-h-[400px] overflow-y-auto bg-slate-50 min-h-[100px]">
                            {loading ? (
                                <div className="flex justify-center py-4">
                                    <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                                </div>
                            ) : varieties.length === 0 ? (
                                <div className="text-center text-sm text-muted-foreground py-8">
                                    No varieties added yet.
                                </div>
                            ) : (
                                <div className="grid gap-2">
                                    {varieties.map((variety) => (
                                        <div key={variety.id} className="flex items-center justify-between bg-white p-2 rounded border shadow-sm text-sm">
                                            <div className="flex flex-col">
                                                <span className="font-medium">{variety.name}</span>
                                                <div className="flex gap-2 text-xs text-muted-foreground">
                                                    <span>
                                                        Yield: {variety.yieldPercentage > 0 ? variety.yieldPercentage : commodityYield}%
                                                        {variety.yieldPercentage === 0 && <span className="text-[10px] ml-1 text-slate-400">(Inherited)</span>}
                                                    </span>
                                                    <span>•</span>
                                                    <span>
                                                        Wastage: {variety.wastagePercentage > 0 ? variety.wastagePercentage : commodityWastage}%
                                                        {variety.wastagePercentage === 0 && <span className="text-[10px] ml-1 text-slate-400">(Inherited)</span>}
                                                    </span>
                                                    {variety.forms && variety.forms.length > 0 && (
                                                        <>
                                                            <span>•</span>
                                                            <span className="text-blue-600">{variety.forms.length} forms configured</span>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="flex gap-1">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-8 w-8"
                                                    onClick={() => openConfig(variety)}
                                                    title="Configure Forms"
                                                >
                                                    <Settings2 className="w-4 h-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-8 w-8 text-muted-foreground hover:text-red-500"
                                                    onClick={() => handleDelete(variety.id)}
                                                    title="Delete Variety"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {selectedVariety && (
                <VarietyConfigDialog
                    open={configOpen}
                    onOpenChange={setConfigOpen}
                    variety={selectedVariety}
                    commodityYield={commodityYield}
                    commodityWastage={commodityWastage}
                    onSuccess={loadVarieties}
                />
            )}
        </>
    );
}
