"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Pencil } from "lucide-react";
import { updateCommodity } from "@/app/actions/commodity";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface EditCommodityDialogProps {
    commodity: {
        id: string;
        name: string;
        yieldPercentage: number;
        wastagePercentage: number;
        category?: string;
        baseBatchElectricityUnits?: number;
    };
    onSuccess: () => void;
}

export function EditCommodityDialog({ commodity, onSuccess }: EditCommodityDialogProps) {
    const [open, setOpen] = useState(false);

    const [name, setName] = useState(commodity.name);
    const [yieldPercentage, setYieldPercentage] = useState(commodity.yieldPercentage.toString());
    const [wastagePercentage, setWastagePercentage] = useState((commodity.wastagePercentage || 0).toString());
    const [category, setCategory] = useState(commodity.category || "Other");
    const [electricityUnits, setElectricityUnits] = useState((commodity.baseBatchElectricityUnits || 0).toString());
    const [loading, setLoading] = useState(false);

    const handleUpdate = async () => {
        if (!name.trim()) return;

        setLoading(true);
        const yieldVal = parseFloat(yieldPercentage);
        const wastageVal = parseFloat(wastagePercentage);
        const finalYield = isNaN(yieldVal) ? 0 : yieldVal;
        const finalWastage = isNaN(wastageVal) ? 0 : wastageVal;
        const finalUnits = parseFloat(electricityUnits) || 0;

        const result = await updateCommodity(commodity.id, name, finalYield, finalWastage, undefined, category, finalUnits);

        if (result.success) {
            toast.success("Commodity updated");
            setOpen(false);
            onSuccess();
        } else {
            toast.error("Failed to update commodity");
        }
        setLoading(false);
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="ghost" size="sm">
                    <Pencil className="h-4 w-4" />
                    <span className="sr-only">Edit</span>
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Edit Commodity</DialogTitle>
                    <DialogDescription>
                        Update the commodity name, yield percentage, and wastage percentage.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="name" className="text-right">
                            Name
                        </Label>
                        <Input
                            id="name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="col-span-3"
                        />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="yield" className="text-right">
                            Yield %
                        </Label>
                        <Input
                            id="yield"
                            type="number"
                            value={yieldPercentage}
                            onChange={(e) => setYieldPercentage(e.target.value)}
                            className="col-span-3"
                        />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="wastage" className="text-right">
                            Wastage %
                        </Label>
                        <Input
                            id="wastage"
                            type="number"
                            value={wastagePercentage}
                            onChange={(e) => setWastagePercentage(e.target.value)}
                            className="col-span-3"
                        />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label className="text-right text-xs">
                            Category
                        </Label>
                        <div className="col-span-3">
                            <Select value={category} onValueChange={setCategory}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Other">Other</SelectItem>
                                    <SelectItem value="Fruit">Fruit</SelectItem>
                                    <SelectItem value="Leafy">Leafy</SelectItem>
                                    <SelectItem value="Bulb">Bulb</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="energy" className="text-right text-xs" title="Base Batch Electricity Units">
                            Base Energy (KWh)
                        </Label>
                        <Input
                            id="energy"
                            type="number"
                            value={electricityUnits}
                            onChange={(e) => setElectricityUnits(e.target.value)}
                            className="col-span-3"
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button type="submit" onClick={handleUpdate} disabled={loading || !name.trim()}>
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Save changes
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
