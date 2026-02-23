"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Combobox } from "@/components/ui/combobox";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Loader2, HelpCircle } from "lucide-react";
import { getCommodities } from "@/app/actions/commodity";
import { toast } from "sonner";
import { generateQuotationPDF } from "@/lib/pdf-generator";
import { Download } from "lucide-react";

export default function QuoteCalculatorPage() {
    const [loading, setLoading] = useState(true);
    const [commodities, setCommodities] = useState<any[]>([]);

    // Form State
    const [commodityId, setCommodityId] = useState<string>("");
    const [varietyId, setVarietyId] = useState<string>("");
    const [formId, setFormId] = useState<string>("");
    const [powerSource, setPowerSource] = useState<string>("electric");
    const [mandiRate, setMandiRate] = useState<string>("");

    useEffect(() => {
        async function load() {
            setLoading(true);
            const result = await getCommodities();
            if (result.success && result.data) {
                setCommodities(result.data);
            } else {
                toast.error("Failed to load generic commodities");
            }
            setLoading(false);
        }
        load();
    }, []);

    // Derived Data for Dropdowns
    const selectedCommodity = commodities.find(c => c.id === commodityId);

    // Varieties for this commodity
    const availableVarieties = selectedCommodity?.varieties || [];
    const selectedVariety = availableVarieties.find((v: any) => v.id === varietyId);

    // Forms: if a variety is selected, use its forms. Otherwise, use base commodity forms.
    const availableForms = selectedVariety ? (selectedVariety.forms || []) : (selectedCommodity?.forms || []);
    const selectedForm = availableForms.find((f: any) => f.id === formId);

    // Calculate active yield for UI display
    const activeYield = selectedForm ? (selectedForm.yieldPercentage || selectedCommodity?.yieldPercentage || 100) : null;

    // Reset dependents when parents change
    useEffect(() => {
        setVarietyId("");
        setFormId("");
    }, [commodityId]);

    useEffect(() => {
        setFormId("");
    }, [varietyId]);

    // Perform Calculation
    const calculateTCP = () => {
        if (!selectedCommodity || !selectedForm || !mandiRate) return null;

        const rate = parseFloat(mandiRate) || 0;
        const rawWeight = 300; // Fixed Batch Size

        // 1. Hierarchical Lookup
        // Wastage
        const cmWastageIdx = selectedCommodity.wastagePercentage || 0;
        const vWastageIdx = selectedVariety?.wastagePercentage || 0;

        // Yield (Specificity: Form -> Base Form -> Base Commodity Yield)
        const formYield = selectedForm.yieldPercentage || selectedCommodity.yieldPercentage || 100;

        // 2. Waterfall Math Gates (Raw -> Cleaned -> Peeled -> Dehydrated)
        const w1 = rawWeight * (1 - (cmWastageIdx / 100)); // Cleaned weight
        const w2 = w1 * (1 - (vWastageIdx / 100));         // Peeled/Processed weight
        // The final dehydration factor must only apply to the peeled weight
        const finalOutputKg = w2 * (formYield / 100);

        if (finalOutputKg <= 0) return null;

        // 3. OpEx
        const rmCost = rate * rawWeight;
        // Solar takes longer, so multiply labor by 1.5 if solar
        const laborCost = powerSource === 'solar' ? 600 * 1.5 : 600;
        const overheadCost = 700;

        // 4. Energy Profile Specificity
        // Base Units (from Commodity)
        let baseUnits = selectedCommodity.baseBatchElectricityUnits;
        if (!baseUnits || baseUnits === 0) {
            // Category Defaults from Requirements
            const cat = selectedCommodity.category || '';
            const name = selectedCommodity.name.toLowerCase();

            if (cat === 'Leafy' || name.includes('spinach') || name.includes('moringa')) baseUnits = 70;
            else if (cat === 'Bulb' || name.includes('onion') || name.includes('garlic')) baseUnits = 130; // Onion needs 130 units
            else if (cat === 'Root' || name.includes('beet') || name.includes('ginger') || name.includes('potato')) baseUnits = 150;
            else if (cat === 'Fruit' || name.includes('banana') || name.includes('tomato') || name.includes('apple')) baseUnits = 220;
            else baseUnits = 150; // Generic fallback if all else fails so Solar always works
        }

        const powerFactor = powerSource === 'solar' ? 0.4 : 1.0;
        const effectiveBaseUnits = baseUnits * powerFactor;

        // Grinding Units (from Form multiplier)
        const formElecMultiplier = selectedForm.formElectricityMultiplier || 0;
        const grindingUnits = finalOutputKg * formElecMultiplier;

        // Total Electricity
        const totalEnergyUnits = effectiveBaseUnits + grindingUnits;
        const elecRate = 8.32; // Real-world Buldhana rate
        const electricityCost = totalEnergyUnits * elecRate;

        // 5. Total TCP & Unit Cost
        const tcpAmount = rmCost + laborCost + overheadCost + electricityCost;
        const baseUnitCost = tcpAmount / finalOutputKg;

        return {
            rawWeight,
            finalOutputKg,
            rmCost,
            laborCost,
            electricityCost,
            overheadCost,
            tcpAmount,
            baseUnitCost,
            // Math details
            rate,
            cmWastageIdx,
            vWastageIdx,
            formYield,
            baseUnits,
            grindingUnits,
            totalEnergyUnits,
            powerFactor,
            elecRate
        };
    };

    const result = calculateTCP();

    const getQuoteTiers = (baseCost: number) => {
        return [
            { weight: "100 kg", price: baseCost * 1.25, mult: "1.25x" },
            { weight: "250 kg", price: baseCost * 1.22, mult: "1.22x" },
            { weight: "500 kg", price: baseCost * 1.20, mult: "1.20x" },
            { weight: "1 Ton", price: baseCost * 1.18, mult: "1.18x" }
        ];
    };

    const handleWhatsApp = (baseCost: number) => {
        if (!selectedCommodity || !selectedForm) return;

        const priceFor1Ton = (baseCost * 1.18).toFixed(2);
        const name = selectedVariety ? `${selectedVariety.name} ${selectedForm.formName}` : `${selectedCommodity.name} ${selectedForm.formName}`;

        const text = `Atlas AgroFood Quote:\n*${name}*\n\n1 Ton @ ₹${priceFor1Ton}/kg.\n\n_Valid for 3 days._`;
        const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
        window.open(url, '_blank');
    };

    const handleDownloadPDF = async () => {
        if (!selectedCommodity || !result) return;

        const productName = selectedVariety ? `${selectedVariety.name} ${selectedForm?.formName || ''}` : `${selectedCommodity.name} ${selectedForm?.formName || ''}`;

        await generateQuotationPDF(
            {
                clientName: "Valued Customer",
                company: "N/A",
                phone: ""
            },
            [{
                productName: productName.trim(),
                tiers: getQuoteTiers(result.baseUnitCost)
            }]
        );
    };

    if (loading) {
        return <div className="flex h-[50vh] items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>;
    }

    return (
        <div className="space-y-6 max-w-5xl mx-auto">
            <div>
                <h2 className="text-3xl font-bold tracking-tight text-slate-800">Pricing Engine</h2>
                <p className="text-muted-foreground text-sm mt-1">
                    Calculate Total Cost of Production (TCP) and export sales pricing using the Hierarchical Waterfall logic.
                </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
                {/* Configuration Panel */}
                <Card className="shadow-sm border-slate-200 relative">
                    <CardHeader className="bg-slate-50 border-b pb-4">
                        <div className="space-y-1.5 pr-10">
                            <CardTitle className="text-lg">Production Parameters</CardTitle>
                            <CardDescription>Select the exact product hierarchy for a 300kg RM batch.</CardDescription>
                        </div>
                        <div className="absolute top-4 right-4">
                            <Dialog>
                                <DialogTrigger asChild>
                                    <Button variant="outline" size="icon" className="h-8 w-8 rounded-full border-slate-300 text-slate-500 hover:text-blue-600 hover:bg-blue-50 hover:border-blue-200 shadow-sm bg-white">
                                        <HelpCircle className="h-4 w-4" />
                                    </Button>
                                </DialogTrigger>
                                <DialogContent className="max-w-2xl">
                                    <DialogHeader>
                                        <DialogTitle>Hierarchical Engine Math</DialogTitle>
                                        <DialogDescription>
                                            How the Total Cost of Production (TCP) is calculated.
                                        </DialogDescription>
                                    </DialogHeader>
                                    <div className="space-y-4 text-sm text-slate-700 leading-relaxed mt-2">
                                        <div className="bg-slate-50 p-4 rounded-lg border">
                                            <h4 className="font-semibold text-slate-900 mb-2 border-b pb-1">1. Weight Gates (300kg RM Batch)</h4>
                                            <p>Raw material flows through three cascading weight loss gates:</p>
                                            <ul className="list-disc pl-5 mt-1 space-y-1">
                                                <li><span className="font-mono text-xs bg-slate-200 px-1 rounded">W1 (Cleaning)</span> = 300kg - Base Commodity Wastage %</li>
                                                <li><span className="font-mono text-xs bg-slate-200 px-1 rounded">W2 (Processing)</span> = W1 - Variety Wastage %</li>
                                                <li><span className="font-mono text-xs bg-blue-100 px-1 rounded text-blue-800">Final Yield</span> = W2 * Exact Form Yield %</li>
                                            </ul>
                                        </div>

                                        <div className="bg-slate-50 p-4 rounded-lg border">
                                            <h4 className="font-semibold text-slate-900 mb-2 border-b pb-1">2. Operational Expenditure (OPEX)</h4>
                                            <p>Costs are layered on top of the batch processing:</p>
                                            <ul className="list-disc pl-5 mt-1 space-y-1">
                                                <li><strong>RM Cost</strong> = Mandi Rate * 300kg</li>
                                                <li><strong>Energy Profile</strong> = (Category Base Units + Grinding Units) * Power Source Multiplier * ₹8.50 Rate</li>
                                                <li><strong>Labor & Overhead</strong> = Fixed factory defaults per batch</li>
                                            </ul>
                                        </div>

                                        <p className="text-xs text-muted-foreground pt-2">
                                            <strong>Specificity-First Lookup:</strong> If a variety isn't selected, the engine securely falls back to the base commodity parameters to guarantee a calculation.
                                        </p>
                                    </div>
                                </DialogContent>
                            </Dialog>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4 pt-6">
                        <div className="grid gap-2">
                            <Label>Commodity <span className="text-red-500">*</span></Label>
                            <Combobox
                                options={commodities.map(c => ({ label: c.name, value: c.id }))}
                                value={commodityId}
                                onChange={setCommodityId}
                                placeholder="Select base commodity..."
                                searchPlaceholder="Search..."
                            />
                        </div>

                        {commodityId && availableVarieties.length > 0 && (
                            <div className="grid gap-2 fade-in">
                                <Label>Variety <span className="text-muted-foreground text-xs font-normal">(Optional fallback to root)</span></Label>
                                <Combobox
                                    options={availableVarieties.map((v: any) => ({ label: v.name, value: v.id }))}
                                    value={varietyId}
                                    onChange={setVarietyId}
                                    placeholder="Any Variety..."
                                    searchPlaceholder="Search..."
                                />
                            </div>
                        )}

                        {commodityId && (
                            <div className="grid gap-2 fade-in">
                                <div className="flex justify-between items-end">
                                    <Label>Output Form <span className="text-red-500">*</span></Label>
                                    {activeYield !== null && (
                                        <span className="text-xs bg-emerald-50 text-emerald-700 font-semibold px-2 py-0.5 rounded-full border border-emerald-100 uppercase tracking-wider">
                                            {activeYield}% Final Yield
                                        </span>
                                    )}
                                </div>
                                <Combobox
                                    options={availableForms.map((f: any) => ({ label: f.formName, value: f.id }))}
                                    value={formId}
                                    onChange={setFormId}
                                    placeholder="Select form..."
                                    searchPlaceholder="Search..."
                                    emptyMessage="No forms configured for this level"
                                />
                            </div>
                        )}

                        <div className="grid gap-2 pt-2">
                            <Label>Power Source</Label>
                            <ToggleGroup type="single" value={powerSource} onValueChange={(val) => val && setPowerSource(val)} className="justify-start">
                                <ToggleGroupItem value="electric" aria-label="Electric" className="data-[state=on]:bg-blue-100 data-[state=on]:text-blue-800 border">
                                    🔌 Standard Electric
                                </ToggleGroupItem>
                                <ToggleGroupItem value="solar" aria-label="Solar" className="data-[state=on]:bg-orange-100 data-[state=on]:text-orange-800 border">
                                    ☀️ Solar Hybrid
                                </ToggleGroupItem>
                            </ToggleGroup>
                            {powerSource === 'solar' && (
                                <p className="text-xs text-orange-600 mt-1">Applies 0.4 multiplier to heating components.</p>
                            )}
                        </div>

                        <div className="grid gap-2 pt-2 border-t mt-4 border-slate-100">
                            <Label>Current Mandi Rate (₹/KG) <span className="text-red-500">*</span></Label>
                            <Input
                                type="number"
                                placeholder="e.g. 15"
                                value={mandiRate}
                                onChange={(e) => setMandiRate(e.target.value)}
                                className="font-mono text-lg py-6"
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Results Panel */}
                <div className="space-y-6">
                    {result ? (
                        <>
                            <Card className="bg-slate-900 text-slate-50 shadow-xl overflow-hidden border-0">
                                <div className="absolute top-0 right-0 p-3 opacity-10">
                                    <span className="text-8xl font-serif leading-none">₹</span>
                                </div>
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-xl font-light text-slate-300">Total Factory Cost</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="flex items-baseline gap-2">
                                        <span className="text-5xl font-bold tracking-tight">₹{result.baseUnitCost.toFixed(2)}</span>
                                        <span className="text-slate-400 text-lg">/ kg</span>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4 mt-6 text-sm border-t border-slate-800 pt-4">
                                        <div>
                                            <p className="text-slate-500 mb-1">Batch Yield (300kg)</p>
                                            <p className="font-medium text-lg">{result.finalOutputKg.toFixed(2)} <span className="text-slate-400 text-sm">kg</span></p>
                                        </div>
                                        <div>
                                            <p className="text-slate-500 mb-1">TCP per Batch</p>
                                            <p className="font-medium text-lg">₹{(result.tcpAmount / 1000).toFixed(1)}<span className="text-slate-400 text-sm">k</span></p>
                                        </div>
                                    </div>

                                    {/* OPEX Breakdown Accordion */}
                                    <div className="mt-4 pt-2 border-t border-slate-800">
                                        <Accordion type="single" collapsible className="w-full">
                                            <AccordionItem value="opex" className="border-0">
                                                <AccordionTrigger className="py-2 text-sm text-slate-400 hover:text-slate-300 hover:no-underline flex gap-2 justify-start">
                                                    <span className="font-medium">View OPEX Breakdown</span>
                                                    <span className="text-xs font-normal opacity-70">(300kg RM Batch)</span>
                                                </AccordionTrigger>
                                                <AccordionContent className="pt-2 pb-4 text-slate-300 space-y-1 text-sm max-w-sm">
                                                    <div className="flex flex-col py-1.5 px-3 -mx-3">
                                                        <div className="flex justify-between items-center">
                                                            <span className="text-slate-400 font-medium">Raw Material Cost</span>
                                                            <span className="font-mono text-slate-200">₹{result.rmCost.toFixed(2)}</span>
                                                        </div>
                                                        <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                                                            ({result.rawWeight} kg × ₹{result.rate.toFixed(2)}/kg)
                                                        </div>
                                                    </div>
                                                    <div className="flex flex-col py-1.5 bg-slate-800/40 px-3 -mx-3 rounded-md">
                                                        <div className="flex justify-between items-center">
                                                            <span className="text-slate-400 font-medium">Electricity <span className="text-[10px] opacity-60 font-normal">({powerSource})</span></span>
                                                            <span className="font-mono text-orange-400">₹{result.electricityCost.toFixed(2)}</span>
                                                        </div>
                                                        <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                                                            (({result.baseUnits} base + {result.grindingUnits.toFixed(1)} grinding/milling units) × {result.powerFactor}x multiplier × ₹{result.elecRate.toFixed(2)})
                                                        </div>
                                                    </div>
                                                    <div className="flex flex-col py-1.5 px-3 -mx-3">
                                                        <div className="flex justify-between items-center">
                                                            <span className="text-slate-400 font-medium">Labor Cost</span>
                                                            <span className="font-mono text-slate-200">₹{result.laborCost.toFixed(2)}</span>
                                                        </div>
                                                        <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                                                            {powerSource === 'solar' ? '(300kg batch factory default × 1.5x Solar duration)' : '(Standard 300kg batch factory default)'}
                                                        </div>
                                                    </div>
                                                    <div className="flex flex-col py-1.5 bg-slate-800/40 px-3 -mx-3 rounded-md">
                                                        <div className="flex justify-between items-center">
                                                            <span className="text-slate-400 font-medium">Overhead <span className="text-[10px] opacity-60 font-normal">(Transport/Maint)</span></span>
                                                            <span className="font-mono text-slate-200">₹{result.overheadCost.toFixed(2)}</span>
                                                        </div>
                                                        <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                                                            (Standard 300kg batch factory default)
                                                        </div>
                                                    </div>
                                                    <div className="flex justify-between items-center py-2 mt-2 border-t border-slate-700/50">
                                                        <span className="text-slate-400 font-medium">Total Cost of Production</span>
                                                        <span className="font-mono font-bold text-slate-200">₹{result.tcpAmount.toFixed(2)}</span>
                                                    </div>
                                                </AccordionContent>
                                            </AccordionItem>
                                        </Accordion>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="shadow-sm border-slate-200">
                                <CardHeader className="bg-slate-50 border-b pb-4 flex flex-row items-center justify-between space-y-0">
                                    <div>
                                        <CardTitle className="text-lg">Tiered Sales Quotes</CardTitle>
                                        <CardDescription>Export pricing structure</CardDescription>
                                    </div>
                                    <div className="flex gap-2">
                                        <Button
                                            onClick={handleDownloadPDF}
                                            variant="outline"
                                            size="sm"
                                        >
                                            <Download className="w-4 h-4 mr-2" />
                                            PDF
                                        </Button>
                                        <Button
                                            onClick={() => handleWhatsApp(result.baseUnitCost)}
                                            className="bg-green-600 hover:bg-green-700 text-white"
                                            size="sm"
                                        >
                                            WhatsApp
                                        </Button>
                                    </div>
                                </CardHeader>
                                <CardContent className="p-0">
                                    <div className="divide-y divide-slate-100">
                                        {getQuoteTiers(result.baseUnitCost).map((tier, idx) => (
                                            <div key={idx} className="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors">
                                                <div className="flex items-center gap-3">
                                                    <div className="bg-slate-100 text-slate-600 font-semibold px-3 py-1 rounded text-sm min-w-20 text-center">
                                                        {tier.weight}
                                                    </div>
                                                    <span className="text-xs text-muted-foreground bg-slate-100 px-2 py-0.5 rounded-full">{tier.mult} margin</span>
                                                </div>
                                                <div className="text-xl font-bold font-mono tracking-tight">
                                                    ₹{tier.price.toFixed(2)}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        </>
                    ) : (
                        <Card className="h-full flex flex-col items-center justify-center text-center p-8 bg-slate-50/50 border-dashed border-2 shadow-sm text-slate-500 min-h-[400px]">
                            <div className="h-16 w-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                                <span className="text-2xl">⚡️</span>
                            </div>
                            <h3 className="text-lg font-semibold text-slate-700 mb-2">Awaiting Parameters</h3>
                            <p className="text-sm max-w-[250px]">
                                Select a commodity, form, and enter a mandi rate to see hierarchical pricing calculations.
                            </p>
                        </Card>
                    )}
                </div>
            </div>
        </div >
    );
}
