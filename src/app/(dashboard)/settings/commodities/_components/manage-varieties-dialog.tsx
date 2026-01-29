"use client";

import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Plus, Trash2, Tag } from "lucide-react";
import { getCommodityVarieties, createCommodityVariety, deleteCommodityVariety } from "@/app/actions/commodity";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

interface ManageVarietiesDialogProps {
    commodityId: string;
    commodityName: string;
    trigger?: React.ReactNode;
}

export function ManageVarietiesDialog({ commodityId, commodityName, trigger }: ManageVarietiesDialogProps) {
    const [open, setOpen] = useState(false);
    const [varieties, setVarieties] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [newVariety, setNewVariety] = useState("");
    const [creating, setCreating] = useState(false);

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
        const res = await createCommodityVariety(commodityId, newVariety);
        if (res.success) {
            toast.success("Variety added");
            setNewVariety("");
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

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger || <Button variant="outline" size="sm"><Tag className="w-4 h-4 mr-2" /> Varieties</Button>}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Manage Varieties: {commodityName}</DialogTitle>
                    <DialogDescription>
                        Add or remove varieties for this commodity.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    <div className="flex gap-2">
                        <Input
                            placeholder="Add new variety (e.g. Red Onion)"
                            value={newVariety}
                            onChange={(e) => setNewVariety(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && handleCreate()}
                        />
                        <Button onClick={handleCreate} disabled={creating || !newVariety.trim()}>
                            {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                        </Button>
                    </div>

                    <div className="rounded-md border p-4 max-h-[300px] overflow-y-auto bg-slate-50 min-h-[100px]">
                        {loading ? (
                            <div className="flex justify-center py-4">
                                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                            </div>
                        ) : varieties.length === 0 ? (
                            <div className="text-center text-sm text-muted-foreground py-8">
                                No varieties added yet.
                            </div>
                        ) : (
                            <div className="flex flex-wrap gap-2">
                                {varieties.map((variety) => (
                                    <Badge key={variety.id} variant="secondary" className="px-3 py-1.5 flex items-center gap-2 bg-white border shadow-sm text-sm">
                                        {variety.name}
                                        <button onClick={() => handleDelete(variety.id)} className="text-muted-foreground hover:text-red-500">
                                            <Trash2 className="w-3 h-3" />
                                        </button>
                                    </Badge>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
