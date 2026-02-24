'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Download, Upload, Loader2, Database } from 'lucide-react';
import Papa from 'papaparse';
import { toast } from 'sonner';
import {
    exportCommodities,
    exportVarieties,
    exportForms,
    importCommodities,
    importVarieties,
    importForms,
    exportDefaultWastage,
    importDefaultWastage
} from '@/app/actions/import-export';

export function DataManagement() {
    const [loading, setLoading] = useState<string | null>(null);

    const commodityInputRef = useRef<HTMLInputElement>(null);
    const varietyInputRef = useRef<HTMLInputElement>(null);
    const formInputRef = useRef<HTMLInputElement>(null);
    const wastageInputRef = useRef<HTMLInputElement>(null);

    const handleExport = async (type: 'commodity' | 'variety' | 'form' | 'wastage') => {
        setLoading(`export-${type}`);
        try {
            let res;
            let filename = '';
            if (type === 'commodity') {
                res = await exportCommodities();
                filename = 'commodities_export.csv';
            } else if (type === 'variety') {
                res = await exportVarieties();
                filename = 'varieties_export.csv';
            } else if (type === 'form') {
                res = await exportForms();
                filename = 'forms_export.csv';
            } else {
                res = await exportDefaultWastage();
                filename = 'default_wastage_export.csv';
            }

            if (res.success && res.data) {
                const csv = Papa.unparse(res.data as any[]);
                const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
                const url = URL.createObjectURL(blob);
                const link = document.createElement("a");
                link.setAttribute("href", url);
                link.setAttribute("download", filename);
                link.style.visibility = 'hidden';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                toast.success(`Export Success: ${res.data.length} ${type} records exported`);
            } else {
                toast.error(`Export Failed: ${res.error || "Unknown error"}`);
            }
        } catch (error) {
            toast.error("Export Failed: An unexpected error occurred");
        }
        setLoading(null);
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, type: 'commodity' | 'variety' | 'form' | 'wastage') => {
        const file = e.target.files?.[0];
        if (!file) return;

        setLoading(`import-${type}`);
        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: async (results: any) => {
                try {
                    const data = results.data as any[];
                    if (!data.length) {
                        toast.error("CSV file is empty");
                        setLoading(null);
                        return;
                    }

                    let res;
                    if (type === 'commodity') {
                        res = await importCommodities(data);
                    } else if (type === 'variety') {
                        res = await importVarieties(data);
                    } else if (type === 'form') {
                        res = await importForms(data);
                    } else {
                        res = await importDefaultWastage(data);
                    }

                    if (res?.success) {
                        toast.success(`Import Success: ${res.count} ${type} records updated`, {
                            duration: 3500 // Show toast longer
                        });
                        // Delay reload so user can read the success message
                        setTimeout(() => {
                            window.location.reload();
                        }, 2500);
                    } else {
                        toast.error(`Import Failed: ${res?.error || "Unknown error"}`, { duration: 5000 });
                    }
                } catch (error) {
                    toast.error("Import Failed: Failed to process CSV structure", { duration: 5000 });
                }
                setLoading(null);
                // Reset input
                if (e.target) e.target.value = '';
            },
            error: (error: any) => {
                toast.error(`Error parsing CSV: ${error.message}`);
                setLoading(null);
            }
        });
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Database className="h-5 w-5" />
                    Data Management (CSV)
                </CardTitle>
                <CardDescription>
                    Export configuration matrices directly to CSV, edit in Excel, and re-import.
                    Warning: Do not modify "id" columns if updating existing rows.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {/* Commodities */}
                    <div className="space-y-4 border p-4 rounded-lg bg-slate-50">
                        <h3 className="font-semibold text-sm">1. Base Commodities <span className="text-muted-foreground font-normal">(Commodity)</span></h3>
                        <p className="text-xs text-muted-foreground mb-4">
                            Includes names, base electricity units, and default cleaning wastage.
                        </p>
                        <div className="flex flex-col gap-2">
                            <Button
                                variant="outline"
                                className="w-full justify-start"
                                onClick={() => handleExport('commodity')}
                                disabled={loading !== null}
                            >
                                {loading === 'export-commodity' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
                                Export CSV
                            </Button>

                            <input
                                type="file"
                                accept=".csv"
                                className="hidden"
                                ref={commodityInputRef}
                                onChange={(e) => handleFileUpload(e, 'commodity')}
                            />
                            <Button
                                variant="secondary"
                                className="w-full justify-start"
                                onClick={() => commodityInputRef.current?.click()}
                                disabled={loading !== null}
                            >
                                {loading === 'import-commodity' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                                Import CSV
                            </Button>
                        </div>
                    </div>

                    {/* Varieties */}
                    <div className="space-y-4 border p-4 rounded-lg bg-slate-50">
                        <h3 className="font-semibold text-sm">2. Crop Varieties <span className="text-muted-foreground font-normal">(CommodityVariety)</span></h3>
                        <p className="text-xs text-muted-foreground mb-4">
                            Specific strains (e.g. Grand Naine) mapping to base commodities.
                        </p>
                        <div className="flex flex-col gap-2">
                            <Button
                                variant="outline"
                                className="w-full justify-start"
                                onClick={() => handleExport('variety')}
                                disabled={loading !== null}
                            >
                                {loading === 'export-variety' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
                                Export CSV
                            </Button>

                            <input
                                type="file"
                                accept=".csv"
                                className="hidden"
                                ref={varietyInputRef}
                                onChange={(e) => handleFileUpload(e, 'variety')}
                            />
                            <Button
                                variant="secondary"
                                className="w-full justify-start"
                                onClick={() => varietyInputRef.current?.click()}
                                disabled={loading !== null}
                            >
                                {loading === 'import-variety' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                                Import CSV
                            </Button>
                        </div>
                    </div>

                    {/* Forms */}
                    <div className="space-y-4 border p-4 rounded-lg bg-slate-50">
                        <h3 className="font-semibold text-sm">3. Output Forms <span className="text-muted-foreground font-normal">(VarietyForm)</span></h3>
                        <p className="text-xs text-muted-foreground mb-4">
                            Dehydration yields and peeling wastage metrics for specific outputs.
                        </p>
                        <div className="flex flex-col gap-2">
                            <Button
                                variant="outline"
                                className="w-full justify-start"
                                onClick={() => handleExport('form')}
                                disabled={loading !== null}
                            >
                                {loading === 'export-form' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
                                Export CSV
                            </Button>

                            <input
                                type="file"
                                accept=".csv"
                                className="hidden"
                                ref={formInputRef}
                                onChange={(e) => handleFileUpload(e, 'form')}
                            />
                            <Button
                                variant="secondary"
                                className="w-full justify-start"
                                onClick={() => formInputRef.current?.click()}
                                disabled={loading !== null}
                            >
                                {loading === 'import-form' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                                Import CSV
                            </Button>
                        </div>
                    </div>

                    {/* Default Wastage */}
                    <div className="space-y-4 border p-4 rounded-lg bg-slate-50">
                        <h3 className="font-semibold text-sm">4. Default Wastage <span className="text-muted-foreground font-normal">(DefaultWastageReference)</span></h3>
                        <p className="text-xs text-muted-foreground mb-4">
                            Fallback cleaning wastage reference by string name.
                        </p>
                        <div className="flex flex-col gap-2">
                            <Button
                                variant="outline"
                                className="w-full justify-start"
                                onClick={() => handleExport('wastage')}
                                disabled={loading !== null}
                            >
                                {loading === 'export-wastage' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
                                Export CSV
                            </Button>

                            <input
                                type="file"
                                accept=".csv"
                                className="hidden"
                                ref={wastageInputRef}
                                onChange={(e) => handleFileUpload(e, 'wastage')}
                            />
                            <Button
                                variant="secondary"
                                className="w-full justify-start"
                                onClick={() => wastageInputRef.current?.click()}
                                disabled={loading !== null}
                            >
                                {loading === 'import-wastage' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                                Import CSV
                            </Button>
                        </div>
                    </div>
                </div>

            </CardContent>
        </Card>
    );
}
