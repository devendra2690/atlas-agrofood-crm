'use client';

import { useState, useEffect } from 'react';
import { getCommodities, createCommodity, deleteCommodity } from '@/app/actions/commodity';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Trash2, Plus, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { ManageVarietiesDialog } from './_components/manage-varieties-dialog';

type Commodity = {
    id: string;
    name: string;
};

export default function CommoditiesPage() {
    const [commodities, setCommodities] = useState<Commodity[]>([]);
    const [newCommodity, setNewCommodity] = useState('');
    const [newYield, setNewYield] = useState('100'); // Default 100%
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);

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
        const result = await createCommodity(newCommodity, isNaN(yieldVal) ? 100 : yieldVal);

        if (result.success && result.data) {
            toast.success("Commodity added");
            setNewCommodity('');
            setNewYield('100');
            loadCommodities();
        } else {
            toast.error(result.error || "Failed to add commodity");
        }
        setLoading(false);
    }

    async function handleDelete(id: string) {
        if (!confirm("Are you sure you want to delete this commodity?")) return;

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

            <Card>
                <CardHeader>
                    <CardTitle>Add New Commodity</CardTitle>
                    <CardDescription>Enter the name and yield percentage.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex gap-4 items-end">
                        <div className="grid gap-2 flex-1">
                            <label className="text-sm font-medium">Name</label>
                            <Input
                                placeholder="e.g. Banana Powder"
                                value={newCommodity}
                                onChange={(e) => setNewCommodity(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                            />
                        </div>
                        <div className="grid gap-2 w-[120px]">
                            <label className="text-sm font-medium">Yield %</label>
                            <Input
                                type="number"
                                placeholder="100"
                                value={newYield}
                                onChange={(e) => setNewYield(e.target.value)}
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
                <CardHeader>
                    <CardTitle>Existing Commodities</CardTitle>
                </CardHeader>
                <CardContent>
                    {fetching ? (
                        <div className="flex justify-center py-8">
                            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {commodities.length === 0 ? (
                                <p className="text-muted-foreground text-center py-4">No commodities found.</p>
                            ) : (
                                commodities.map((commodity: any) => (
                                    <div key={commodity.id} className="flex items-center justify-between p-3 border rounded-md bg-white hover:bg-slate-50">
                                        <div className="flex items-center gap-2">
                                            <div className="flex items-center gap-4">
                                                <span className="font-medium">{commodity.name}</span>
                                                <span className="text-xs text-muted-foreground bg-slate-100 px-2 py-1 rounded">
                                                    Yield: {commodity.yieldPercentage}%
                                                </span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <ManageVarietiesDialog
                                                commodityId={commodity.id}
                                                commodityName={commodity.name}
                                            />
                                            <Button variant="ghost" size="sm" onClick={() => handleDelete(commodity.id)}>
                                                <Trash2 className="h-4 w-4 text-red-500" />
                                            </Button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
