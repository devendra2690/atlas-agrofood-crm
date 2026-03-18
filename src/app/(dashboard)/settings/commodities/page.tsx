'use client';

import { useState, useEffect } from 'react';
import { getCommodities, createCommodity, deleteCommodity, getDefaultWastage } from '@/app/actions/commodity';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Trash2, Plus, Loader2, Printer, BookOpen } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { ManageVarietiesDialog } from './_components/manage-varieties-dialog';
import { EditCommodityDialog } from './_components/edit-commodity-dialog';
import { TemplateEditorDialog } from './_components/template-editor-dialog';
import { CommodityConfigDialog } from './_components/commodity-config-dialog';
import { DataManagement } from './_components/data-management';
import { DehydrationGuidesDialog } from './_components/dehydration-guides-dialog';
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

type Commodity = {
    id: string;
    name: string;
    yieldPercentage: number;
    documentTemplate?: any;
};

export default function CommoditiesPage() {
    const [commodities, setCommodities] = useState<Commodity[]>([]);
    const [newCommodity, setNewCommodity] = useState('');
    const [newYield, setNewYield] = useState('100'); // Default 100%
    const [newWastage, setNewWastage] = useState('0');
    const [newCategory, setNewCategory] = useState('Other');
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    const [configOpen, setConfigOpen] = useState(false);
    const [selectedCommodity, setSelectedCommodity] = useState<Commodity | null>(null);

    const [guidesOpen, setGuidesOpen] = useState(false);
    const [guidescommodity, setGuidesCommodity] = useState<any | null>(null);

    async function loadCommodities() {
        setFetching(true);
        const result = await getCommodities();
        if (result.success && result.data) {
            setCommodities(result.data);
        } else {
            toast.error("Failed to load commodities");
        }
        setFetching(false);
    }

    useEffect(() => {
        loadCommodities();
    }, []);

    async function handleAdd() {
        if (!newCommodity.trim()) return;

        setLoading(true);
        const yieldVal = parseFloat(newYield);
        const wastageVal = parseFloat(newWastage);
        const result = await createCommodity(
            newCommodity,
            isNaN(yieldVal) ? 100 : yieldVal,
            isNaN(wastageVal) ? 0 : wastageVal,
            newCategory
        );

        if (result.success && result.data) {
            toast.success("Commodity added");
            setNewCommodity('');
            setNewYield('100');
            setNewWastage('0');
            loadCommodities();
        } else {
            toast.error(result.error || "Failed to add commodity");
        }
        setLoading(false);
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

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-3xl font-bold tracking-tight">Commodity Settings</h2>
                <p className="text-muted-foreground">
                    Manage the list of commodities and their yield settings (Raw Material Conversion).
                </p>
            </div>

            <DataManagement />

            <Card>
                <CardHeader>
                    <CardTitle>Add New Commodity</CardTitle>
                    <CardDescription>Enter the name and yield percentage.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex gap-4 items-end">
                        <div className="grid gap-2 flex-1">
                            <Label className="text-sm font-medium">Name</Label>
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
                        <div className="grid gap-2 w-[120px]">
                            <Label className="text-sm font-medium">Category</Label>
                            <Select value={newCategory} onValueChange={setNewCategory}>
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
                        <div className="grid gap-2 w-[100px]">
                            <Label className="text-sm font-medium">Yield %</Label>
                            <Input
                                type="number"
                                placeholder="100"
                                value={newYield}
                                onChange={(e) => setNewYield(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                            />
                        </div>
                        <div className="grid gap-2 w-[100px]">
                            <Label className="text-sm font-medium">Wastage %</Label>
                            <Input
                                type="number"
                                placeholder="0"
                                value={newWastage}
                                onChange={(e) => setNewWastage(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                            />
                        </div>
                        <Button onClick={handleAdd} disabled={loading || !newCommodity.trim()}>
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            <Plus className="mr-2 h-4 w-4" /> Add
                        </Button>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0">
                    <CardTitle>Existing Commodities</CardTitle>
                    <div className="w-1/3">
                        <Input
                            placeholder="🔍 Search commodities..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </CardHeader>
                <CardContent>
                    {fetching ? (
                        <div className="flex justify-center py-8">
                            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {commodities.filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase())).length === 0 ? (
                                <p className="text-muted-foreground text-center py-4">No commodities found.</p>
                            ) : (
                                commodities.filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase())).map((commodity: any) => (
                                    <div key={commodity.id} className="flex items-center justify-between p-3 border rounded-md bg-white hover:bg-slate-50">
                                        <div className="flex items-center gap-2">
                                            <div className="flex items-center gap-4">
                                                <span className="font-medium">{commodity.name}</span>
                                                <span className="text-xs text-muted-foreground bg-slate-100 px-2 py-1 rounded">
                                                    Yield: {commodity.yieldPercentage}%
                                                </span>
                                                <span className="text-xs text-muted-foreground bg-slate-100 px-2 py-1 rounded">
                                                    Wastage: {commodity.wastagePercentage || 0}%
                                                </span>
                                                <span className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded font-semibold border border-blue-100" title="Energy Profile">
                                                    {commodity.category || 'Other'} ({commodity.baseBatchElectricityUnits || 0} Units)
                                                </span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => {
                                                    setSelectedCommodity(commodity);
                                                    setConfigOpen(true);
                                                }}
                                            >
                                                Base Forms
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => {
                                                    setGuidesCommodity(commodity);
                                                    setGuidesOpen(true);
                                                }}
                                            >
                                                <BookOpen className="h-4 w-4 mr-1" /> Guides
                                            </Button>
                                            <Link href={`/documents/commodity/${commodity.id}`}>
                                                <Button variant="ghost" size="sm">
                                                    <Printer className="h-4 w-4" />
                                                </Button>
                                            </Link>
                                            <ManageVarietiesDialog
                                                commodityId={commodity.id}
                                                commodityName={commodity.name}
                                                commodityYield={commodity.yieldPercentage}
                                                commodityWastage={commodity.wastagePercentage || 0}
                                            />
                                            <TemplateEditorDialog
                                                commodityId={commodity.id}
                                                initialTemplate={commodity.documentTemplate}
                                                commodities={commodities}
                                            />
                                            <EditCommodityDialog
                                                commodity={commodity}
                                                onSuccess={loadCommodities}
                                            />
                                            <AlertDialog>
                                                <AlertDialogTrigger asChild>
                                                    <Button variant="ghost" size="sm">
                                                        <Trash2 className="h-4 w-4 text-red-500" />
                                                    </Button>
                                                </AlertDialogTrigger>
                                                <AlertDialogContent onClick={(e) => e.stopPropagation()}>
                                                    <AlertDialogHeader>
                                                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                                        <AlertDialogDescription>
                                                            This action cannot be undone. This will permanently delete the commodity
                                                            and all of its associated setup data.
                                                        </AlertDialogDescription>
                                                    </AlertDialogHeader>
                                                    <AlertDialogFooter>
                                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                        <AlertDialogAction
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleDelete(commodity.id);
                                                            }}
                                                            className="bg-red-600 hover:bg-red-700 text-white"
                                                        >
                                                            Delete
                                                        </AlertDialogAction>
                                                    </AlertDialogFooter>
                                                </AlertDialogContent>
                                            </AlertDialog>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    )}
                </CardContent>
            </Card>

            {selectedCommodity && (
                <CommodityConfigDialog
                    open={configOpen}
                    onOpenChange={setConfigOpen}
                    commodity={selectedCommodity as any}
                    onSuccess={() => {
                        loadCommodities();
                    }}
                />
            )}

            {guidescommodity && (
                <DehydrationGuidesDialog
                    open={guidesOpen}
                    onOpenChange={setGuidesOpen}
                    commodity={guidescommodity}
                />
            )}
        </div>
    );
}
