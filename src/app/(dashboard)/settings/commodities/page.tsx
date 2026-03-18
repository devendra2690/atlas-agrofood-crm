'use client';

import { useState, useEffect } from 'react';
import { getCommodities, createCommodity, deleteCommodity, getDefaultWastage } from '@/app/actions/commodity';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Trash2, Plus, Loader2, Settings2, Search } from 'lucide-react';
import { toast } from 'sonner';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { DataManagement } from './_components/data-management';
import { CommodityManageSheet } from './_components/commodity-manage-sheet';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
    Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from "@/components/ui/sheet";

type Commodity = {
    id: string;
    name: string;
    yieldPercentage: number;
    wastagePercentage: number;
    category?: string;
    baseBatchElectricityUnits?: number;
    forms?: any[];
    varieties?: any[];
    documentTemplate?: any;
};

const CATEGORY_STYLES: Record<string, string> = {
    Fruit: "bg-orange-50 text-orange-700 border border-orange-200",
    Leafy: "bg-green-50 text-green-700 border border-green-200",
    Bulb: "bg-purple-50 text-purple-700 border border-purple-200",
    Other: "bg-slate-100 text-slate-600 border border-slate-200",
};

export default function CommoditiesPage() {
    const [commodities, setCommodities] = useState<Commodity[]>([]);
    const [fetching, setFetching] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    // Add commodity sheet state
    const [addOpen, setAddOpen] = useState(false);
    const [newCommodity, setNewCommodity] = useState('');
    const [newYield, setNewYield] = useState('100');
    const [newWastage, setNewWastage] = useState('0');
    const [newCategory, setNewCategory] = useState('Other');
    const [adding, setAdding] = useState(false);

    // Manage sheet state
    const [manageOpen, setManageOpen] = useState(false);
    const [selectedCommodity, setSelectedCommodity] = useState<Commodity | null>(null);

    async function loadCommodities() {
        setFetching(true);
        const result = await getCommodities();
        if (result.success && result.data) {
            setCommodities(result.data as Commodity[]);
        } else {
            toast.error("Failed to load commodities");
        }
        setFetching(false);
    }

    useEffect(() => { loadCommodities(); }, []);

    async function handleAdd() {
        if (!newCommodity.trim()) return;
        setAdding(true);
        const result = await createCommodity(
            newCommodity,
            parseFloat(newYield) || 100,
            parseFloat(newWastage) || 0,
            newCategory,
        );
        if (result.success) {
            toast.success("Commodity added");
            setNewCommodity(''); setNewYield('100'); setNewWastage('0'); setNewCategory('Other');
            setAddOpen(false);
            loadCommodities();
        } else {
            toast.error(result.error || "Failed to add commodity");
        }
        setAdding(false);
    }

    async function handleDelete(id: string) {
        const result = await deleteCommodity(id);
        if (result.success) {
            toast.success("Commodity deleted");
            loadCommodities();
        } else {
            toast.error("Failed to delete commodity");
        }
    }

    function openManage(commodity: Commodity) {
        setSelectedCommodity(commodity);
        setManageOpen(true);
    }

    const filtered = commodities.filter(c =>
        c.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="space-y-6">
            {/* Page header */}
            <div className="flex items-start justify-between">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Commodities</h2>
                    <p className="text-sm text-muted-foreground mt-1">
                        Manage commodities, their forms, varieties, and dehydration guides.
                    </p>
                </div>
                <Button onClick={() => setAddOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" /> Add Commodity
                </Button>
            </div>

            <DataManagement />

            {/* Commodity list */}
            <Card>
                <CardHeader className="pb-3">
                    <div className="flex items-center justify-between gap-4">
                        <CardTitle className="text-base">
                            All Commodities
                            {!fetching && (
                                <span className="ml-2 text-sm font-normal text-muted-foreground">
                                    ({filtered.length})
                                </span>
                            )}
                        </CardTitle>
                        <div className="relative w-64">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search commodities…"
                                className="pl-8"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="pt-0">
                    {fetching ? (
                        <div className="flex justify-center py-12">
                            <Loader2 className="h-7 w-7 animate-spin text-muted-foreground" />
                        </div>
                    ) : filtered.length === 0 ? (
                        <p className="text-center text-muted-foreground py-10 text-sm">
                            {searchQuery ? "No commodities match your search." : "No commodities added yet."}
                        </p>
                    ) : (
                        <div className="divide-y">
                            {filtered.map((commodity) => {
                                const cat = commodity.category || "Other";
                                return (
                                    <div
                                        key={commodity.id}
                                        className="flex items-center justify-between py-3 px-1 hover:bg-slate-50 transition-colors rounded-sm"
                                    >
                                        {/* Left: name + badges */}
                                        <div className="flex items-center gap-3 min-w-0">
                                            <div>
                                                <p className="font-medium text-sm leading-tight">{commodity.name}</p>
                                                <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                                                    <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${CATEGORY_STYLES[cat]}`}>
                                                        {cat}
                                                    </span>
                                                    <span className="text-xs text-muted-foreground bg-slate-100 px-1.5 py-0.5 rounded">
                                                        Yield {commodity.yieldPercentage}%
                                                    </span>
                                                    <span className="text-xs text-muted-foreground bg-slate-100 px-1.5 py-0.5 rounded">
                                                        Waste {commodity.wastagePercentage || 0}%
                                                    </span>
                                                    {(commodity.baseBatchElectricityUnits || 0) > 0 && (
                                                        <span className="text-xs text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100">
                                                            {commodity.baseBatchElectricityUnits} KWh
                                                        </span>
                                                    )}
                                                    {(commodity.forms?.length ?? 0) > 0 && (
                                                        <span className="text-xs text-slate-500">
                                                            {commodity.forms!.length} form{commodity.forms!.length > 1 ? 's' : ''}
                                                        </span>
                                                    )}
                                                    {(commodity.varieties?.length ?? 0) > 0 && (
                                                        <span className="text-xs text-slate-500">
                                                            {commodity.varieties!.length} variet{commodity.varieties!.length > 1 ? 'ies' : 'y'}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Right: actions */}
                                        <div className="flex items-center gap-2 shrink-0">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => openManage(commodity)}
                                            >
                                                <Settings2 className="h-4 w-4 mr-1.5" /> Manage
                                            </Button>
                                            <AlertDialog>
                                                <AlertDialogTrigger asChild>
                                                    <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-red-500">
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </AlertDialogTrigger>
                                                <AlertDialogContent onClick={(e) => e.stopPropagation()}>
                                                    <AlertDialogHeader>
                                                        <AlertDialogTitle>Delete {commodity.name}?</AlertDialogTitle>
                                                        <AlertDialogDescription>
                                                            This cannot be undone. All associated forms, varieties, and guides will be permanently deleted.
                                                        </AlertDialogDescription>
                                                    </AlertDialogHeader>
                                                    <AlertDialogFooter>
                                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                        <AlertDialogAction
                                                            onClick={() => handleDelete(commodity.id)}
                                                            className="bg-red-600 hover:bg-red-700 text-white"
                                                        >
                                                            Delete
                                                        </AlertDialogAction>
                                                    </AlertDialogFooter>
                                                </AlertDialogContent>
                                            </AlertDialog>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Add Commodity Sheet */}
            <Sheet open={addOpen} onOpenChange={setAddOpen}>
                <SheetContent side="right" className="sm:max-w-md">
                    <SheetHeader>
                        <SheetTitle>Add New Commodity</SheetTitle>
                        <SheetDescription>
                            Enter the commodity details. You can configure forms, varieties, and guides after adding it.
                        </SheetDescription>
                    </SheetHeader>
                    <div className="space-y-4 mt-6">
                        <div className="grid gap-1.5">
                            <Label>Name</Label>
                            <Input
                                placeholder="e.g. Banana Powder"
                                value={newCommodity}
                                onChange={(e) => setNewCommodity(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                                onBlur={async () => {
                                    if (!newCommodity.trim()) return;
                                    const res = await getDefaultWastage(newCommodity);
                                    if (res.success && res.data) {
                                        setNewWastage(res.data.defaultWastagePercentage.toString());
                                        toast.info(`Auto-filled default wastage for ${res.data.commodityName}`);
                                    }
                                }}
                            />
                        </div>
                        <div className="grid gap-1.5">
                            <Label>Category</Label>
                            <Select value={newCategory} onValueChange={setNewCategory}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Other">Other</SelectItem>
                                    <SelectItem value="Fruit">Fruit</SelectItem>
                                    <SelectItem value="Leafy">Leafy</SelectItem>
                                    <SelectItem value="Bulb">Bulb</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="grid gap-1.5">
                                <Label>Yield %</Label>
                                <Input
                                    type="number" placeholder="100"
                                    value={newYield}
                                    onChange={(e) => setNewYield(e.target.value)}
                                />
                            </div>
                            <div className="grid gap-1.5">
                                <Label>Wastage %</Label>
                                <Input
                                    type="number" placeholder="0"
                                    value={newWastage}
                                    onChange={(e) => setNewWastage(e.target.value)}
                                />
                            </div>
                        </div>
                        <Button
                            className="w-full mt-2"
                            onClick={handleAdd}
                            disabled={adding || !newCommodity.trim()}
                        >
                            {adding && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            <Plus className="mr-2 h-4 w-4" /> Add Commodity
                        </Button>
                    </div>
                </SheetContent>
            </Sheet>

            {/* Manage Sheet */}
            {selectedCommodity && (
                <CommodityManageSheet
                    open={manageOpen}
                    onOpenChange={setManageOpen}
                    commodity={selectedCommodity}
                    allCommodities={commodities}
                    onSuccess={() => {
                        loadCommodities();
                        // Refresh selectedCommodity with latest data after load
                    }}
                />
            )}
        </div>
    );
}
