'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { generateQuotationPDF } from "@/lib/pdf-generator";
import { Download, Check, ChevronsUpDown, Plus, Trash2 } from 'lucide-react';
import { cn } from "@/lib/utils";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";

interface VarietyForm {
    id: string;
    formName: string;
    yieldPercentage: number;
}

interface Variety {
    id: string;
    name: string;
    yieldPercentage: number;
    forms?: VarietyForm[];
}

interface Commodity {
    id: string;
    name: string;
    yieldPercentage: number;
    varieties: Variety[];
}

interface QuoteCalculatorProps {
    commodities: Commodity[];
    companies: any[];
}

interface QuoteItem {
    id: string;
    commodityName: string;
    varietyName: string;
    yieldPercentage: number;
    quantity: number; // User defined quantity
    unit: 'Kg' | 'Ton';
    rawMaterialPrice: number;
    finalPriceExclGST: number;
    remarks: string;
    calculationMode: 'batch' | 'order'; // NEW
}

export function QuoteCalculator({ commodities, companies }: QuoteCalculatorProps) {
    // Client State
    const [clientName, setClientName] = useState<string>('');
    const [isClientOpen, setIsClientOpen] = useState(false);
    const [quoteItems, setQuoteItems] = useState<QuoteItem[]>([]);

    // Mode Toggle
    const [calculationMode, setCalculationMode] = useState<'batch' | 'order'>('batch');
    const [dryingMethod, setDryingMethod] = useState<'electric' | 'solar'>('electric'); // NEW: Drying Method State

    // Canvas Inputs
    const [selectedCommodityId, setSelectedCommodityId] = useState<string>('');
    const [selectedVarietyId, setSelectedVarietyId] = useState<string>('');
    const [selectedVarietyFormId, setSelectedVarietyFormId] = useState<string>('');
    const [rawMaterialPrice, setRawMaterialPrice] = useState<number>(0);
    const [gstRate, setGstRate] = useState<number>(5); // Default 5%
    const [marginPercentage, setMarginPercentage] = useState<number>(25); // Default 25%

    // --- BATCH MODE INPUTS ---
    const [batchDuration, setBatchDuration] = useState<number>(0); // Hours
    const [numberOfLaborers, setNumberOfLaborers] = useState<number>(0);
    const [costPerLaborer, setCostPerLaborer] = useState<number>(0);
    const [packagingCost, setPackagingCost] = useState<number>(0);
    const [transportCost, setTransportCost] = useState<number>(0);
    const [electricityRate, setElectricityRate] = useState<number>(8.32); // Default 8.32 (Buldhana Rate)

    // --- ORDER MODE INPUTS ---
    const [targetOrderQty, setTargetOrderQty] = useState<number>(1000); // Default 1 ton
    const [lumpSumLaborCost, setLumpSumLaborCost] = useState<number>(0);
    const [lumpSumPackagingCost, setLumpSumPackagingCost] = useState<number>(0);
    const [lumpSumTransportCost, setLumpSumTransportCost] = useState<number>(0);
    const [lumpSumPowerCost, setLumpSumPowerCost] = useState<number>(0); // Entered directly or calculated? Let's allow direct first.

    // Derived States for Display
    const [yieldPercentage, setYieldPercentage] = useState<number>(0);

    // NEW: Quoted Quantity State (Used for 'Batch' mode mainly, synced in 'Order' mode)
    const [quotedQuantity, setQuotedQuantity] = useState<number>(0);
    const [quantityUnit, setQuantityUnit] = useState<'Kg' | 'Ton'>('Kg');

    // Constants
    const POWER_CONSUMPTION_RATE = 12.5; // units per hour per 100kg input

    useEffect(() => {
        if (selectedCommodityId) {
            const commodity = commodities.find(c => c.id === selectedCommodityId);
            if (selectedVarietyId) {
                const variety = commodity?.varieties.find(v => v.id === selectedVarietyId);
                if (variety) {
                    // Check if form is selected
                    if (selectedVarietyFormId) {
                        const form = variety.forms?.find((f: any) => f.id === selectedVarietyFormId);
                        if (form) {
                            setYieldPercentage(form.yieldPercentage);
                        } else {
                            setYieldPercentage(variety.yieldPercentage);
                        }
                    } else {
                        setYieldPercentage(variety.yieldPercentage);
                    }
                }
            } else if (commodity) {
                // Fallback to commodity default yield
                setYieldPercentage(commodity.yieldPercentage);
            }
        } else {
            setYieldPercentage(0);
        }
    }, [selectedCommodityId, selectedVarietyId, selectedVarietyFormId, commodities]);

    // --- CALCULATIONS ---

    let finalSellingPriceExclGST = 0;
    let perKgSellingPriceExclGST = 0;
    let rawMaterialBatchCost = 0;
    let unitsConsumed = 0;
    let totalPowerCost = 0;
    let totalLaborCost = 0;
    let totalProductionCost = 0;
    let fgWeight = 0;
    let marginAmount = 0;

    if (calculationMode === 'batch') {
        // --- BATCH MODE CALC ---
        fgWeight = 100 * (yieldPercentage / 100); // Output from 100kg Input
        rawMaterialBatchCost = rawMaterialPrice * 100; // Cost for 100kg Input

        totalLaborCost = (numberOfLaborers * costPerLaborer) * (dryingMethod === 'solar' ? 1.5 : 1);
        unitsConsumed = batchDuration * POWER_CONSUMPTION_RATE;
        // Solar Tunnel = No Electricity Cost
        totalPowerCost = dryingMethod === 'solar' ? 0 : (unitsConsumed * electricityRate);

        totalProductionCost = rawMaterialBatchCost + totalPowerCost + totalLaborCost + packagingCost + transportCost;

        marginAmount = totalProductionCost * (marginPercentage / 100);
        const totalWithMargin = totalProductionCost + marginAmount;

        // Per Kg Selling Price
        perKgSellingPriceExclGST = fgWeight > 0 ? totalWithMargin / fgWeight : 0;
        finalSellingPriceExclGST = totalWithMargin; // For the Batch

    } else {
        // --- ORDER MODE CALC (Reverse) ---
        // Target: targetOrderQty (e.g., 1000kg)
        // Yield: 10%
        // RM Needed = Target / Yield %
        const rmNeeded = yieldPercentage > 0 ? targetOrderQty / (yieldPercentage / 100) : 0;

        rawMaterialBatchCost = rmNeeded * rawMaterialPrice; // Total RM Cost for Order

        // Lump Sum Costs are direct inputs
        totalLaborCost = lumpSumLaborCost * (dryingMethod === 'solar' ? 1.5 : 1);
        // Solar Tunnel = No Power Cost
        totalPowerCost = dryingMethod === 'solar' ? 0 : lumpSumPowerCost;

        // We use the lump sum state variables directly
        const pkgCost = lumpSumPackagingCost;
        const tptCost = lumpSumTransportCost;

        totalProductionCost = rawMaterialBatchCost + totalLaborCost + totalPowerCost + pkgCost + tptCost;

        marginAmount = totalProductionCost * (marginPercentage / 100);
        const totalWithMargin = totalProductionCost + marginAmount;

        // Per Kg Selling Price
        perKgSellingPriceExclGST = targetOrderQty > 0 ? totalWithMargin / targetOrderQty : 0;
        finalSellingPriceExclGST = totalWithMargin; // For the entire Order

        // Sync fgWeight for display/logic consistency
        fgWeight = targetOrderQty;
    }

    // Common Totals
    const gstAmountPerKg = perKgSellingPriceExclGST * (gstRate / 100);
    const finalLandingPriceInclGST = perKgSellingPriceExclGST + gstAmountPerKg;
    const finalLandingPricePerTon = finalLandingPriceInclGST * 1000;


    const formatMoney = (amount: number) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 2
        }).format(amount);
    };

    const selectedCommodity = commodities.find(c => c.id === selectedCommodityId);
    const selectedVariety = selectedCommodity?.varieties.find(v => v.id === selectedVarietyId); // Helper

    const addToQuote = () => {
        if (!selectedCommodity) return;

        // Use user input quantity or fallback to batch output if 0/empty
        const quantityToQuote = calculationMode === 'order'
            ? targetOrderQty
            : (quotedQuantity > 0 ? quotedQuantity : fgWeight);

        const unitToQuote = calculationMode === 'order'
            ? 'Kg' // Order mode targets Kg usually, but let's default to Kg for simplicity or use existing unit selection
            : (quotedQuantity > 0 ? quantityUnit : 'Kg');

        let varietyName = selectedVariety?.name || 'Default';

        // Append Form Name if selected
        if (selectedVarietyFormId && selectedVariety?.forms) {
            const form = selectedVariety.forms.find((f: any) => f.id === selectedVarietyFormId);
            if (form) {
                varietyName += ` - ${form.formName}`;
            }
        }

        const newItem: QuoteItem = {
            id: crypto.randomUUID(),
            commodityName: selectedCommodity.name,
            varietyName: varietyName,
            yieldPercentage: yieldPercentage,
            quantity: quantityToQuote,
            unit: unitToQuote,
            rawMaterialPrice: rawMaterialPrice,
            finalPriceExclGST: perKgSellingPriceExclGST,
            remarks: calculationMode === 'order' ? 'Project Based' : `${yieldPercentage}% Yield`,
            calculationMode: calculationMode
        };

        setQuoteItems([...quoteItems, newItem]);
    };

    const removeFromQuote = (id: string) => {
        setQuoteItems(quoteItems.filter(item => item.id !== id));
    };

    const generatePDF = async () => {
        try {
            // Calculate Item Array
            const itemsToCalc = quoteItems.length > 0 ? quoteItems : (selectedCommodityId ? [{
                finalPriceExclGST: perKgSellingPriceExclGST,
                yieldPercentage: yieldPercentage,
                quantity: calculationMode === 'order' ? targetOrderQty : (quotedQuantity > 0 ? quotedQuantity : fgWeight),
                unit: calculationMode === 'order' ? 'Kg' : (quotedQuantity > 0 ? quantityUnit : 'Kg'),
                isSingleItem: true,
                commodityName: selectedCommodity?.name,
                varietyName: selectedVariety?.name
            }] : []);

            if (itemsToCalc.length === 0) return;

            // Try to match clientName with a company in the list
            const matchedCompany = companies.find(c => c.name === clientName);
            let phone = "";
            let email = ""; // Not strictly in the table, but good to have if needed by PDF later

            if (matchedCompany) {
                // Could fetch phone from matchedCompany if the schema has it exposed to this component. 
                // Currently companies prop might just be name/ids.  
            }

            const pdfItems = itemsToCalc.map((item: any) => {
                let desc = item.isSingleItem
                    ? `${selectedCommodity?.name} - ${selectedVariety?.name || 'Default'}`
                    : `${item.commodityName} - ${item.varietyName}`;

                if (item.isSingleItem) {
                    if (selectedVarietyFormId && selectedVariety?.forms) {
                        const form = selectedVariety.forms.find((f: any) => f.id === selectedVarietyFormId);
                        if (form) {
                            desc += ` - ${form.formName}`;
                        }
                    }
                }

                // For simplicity, we create the 4 tiers relative to the calculated base price for THIS item.
                // In exact legacy behavior, it just printed one row per item. But the new requirement is "tiered pricing tables".
                // Since this calculator calculates a specific base cost, we will generate tiers off that.
                const baseCost = item.finalPriceExclGST;

                return {
                    productName: desc,
                    tiers: [
                        { weight: "100 kg", price: baseCost * 1.25, mult: "1.25x" },
                        { weight: "250 kg", price: baseCost * 1.22, mult: "1.22x" },
                        { weight: "500 kg", price: baseCost * 1.20, mult: "1.20x" },
                        { weight: "1000kg", price: baseCost * 1.18, mult: "1.18x" }
                    ]
                };
            });

            await generateQuotationPDF(
                {
                    clientName: clientName || "Valued Customer",
                    company: "N/A",
                    phone: phone || "Not Provided"
                },
                pdfItems
            );

        } catch (error) {
            console.error("PDF Generation Error:", error);
            alert("Failed to generate PDF. Check console for details.");
        }
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
                <CardHeader className="space-y-4">
                    <div className="flex flex-col space-y-2">
                        <Label>Client Name</Label>
                        <Popover open={isClientOpen} onOpenChange={setIsClientOpen}>
                            <PopoverTrigger asChild>
                                <Button
                                    variant="outline"
                                    role="combobox"
                                    aria-expanded={isClientOpen}
                                    className="w-full justify-between"
                                >
                                    {clientName ? clientName : "Select or type client name..."}
                                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-[300px] p-0">
                                <Command>
                                    <CommandInput placeholder="Search client..." onValueChange={(search) => {
                                        if (search) setClientName(search);
                                    }} />
                                    <CommandList>
                                        <CommandEmpty>Typing new client: "{clientName}"</CommandEmpty>
                                        <CommandGroup>
                                            {companies.map((company) => (
                                                <CommandItem
                                                    key={company.id}
                                                    value={company.name}
                                                    onSelect={(currentValue) => {
                                                        setClientName(currentValue)
                                                        setIsClientOpen(false)
                                                    }}
                                                >
                                                    <Check
                                                        className={cn(
                                                            "mr-2 h-4 w-4",
                                                            clientName === company.name ? "opacity-100" : "opacity-0"
                                                        )}
                                                    />
                                                    {company.name}
                                                </CommandItem>
                                            ))}
                                        </CommandGroup>
                                    </CommandList>
                                </Command>
                            </PopoverContent>
                        </Popover>
                    </div>
                    <Separator />
                    <div className="flex flex-row items-center justify-between">
                        <div>
                            <CardTitle>Input Parameters</CardTitle>
                            <CardDescription>
                                {calculationMode === 'batch'
                                    ? "Enter details for a 100kg Input Batch"
                                    : "Enter details for the Total Project Order"}
                            </CardDescription>
                        </div>
                    </div>
                    <Tabs value={calculationMode} onValueChange={(val) => setCalculationMode(val as 'batch' | 'order')} className="w-full">
                        <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="batch">Standard (Batch Mode)</TabsTrigger>
                            <TabsTrigger value="order">Project (Order Mode)</TabsTrigger>
                        </TabsList>
                    </Tabs>

                    <div className="pt-2">
                        <Label className="text-sm font-medium mb-2 block">Drying Method</Label>
                        <Tabs value={dryingMethod} onValueChange={(val) => setDryingMethod(val as 'electric' | 'solar')} className="w-full">
                            <TabsList className="grid w-full grid-cols-2">
                                <TabsTrigger value="electric">Electric Drier</TabsTrigger>
                                <TabsTrigger value="solar">Solar Tunnel (No Electricity)</TabsTrigger>
                            </TabsList>
                        </Tabs>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Commodity</Label>
                            <Select value={selectedCommodityId} onValueChange={(val) => {
                                setSelectedCommodityId(val);
                                setSelectedVarietyId(''); // Reset variety
                                setSelectedVarietyFormId(''); // Reset form
                            }}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select commodity" />
                                </SelectTrigger>
                                <SelectContent>
                                    {commodities.map(c => (
                                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Variety (Yield %)</Label>
                            <Select value={selectedVarietyId} onValueChange={(val) => {
                                setSelectedVarietyId(val);
                                setSelectedVarietyFormId(''); // Reset form
                            }} disabled={!selectedCommodityId}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select variety" />
                                </SelectTrigger>
                                <SelectContent>
                                    {selectedCommodity?.varieties.map(v => (
                                        <SelectItem key={v.id} value={v.id}>
                                            {v.name} ({v.yieldPercentage}%)
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        {selectedVariety?.forms && selectedVariety.forms.length > 0 && (
                            <div className="space-y-2">
                                <Label>Form (Yield)</Label>
                                <Select value={selectedVarietyFormId} onValueChange={setSelectedVarietyFormId}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select form" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {selectedVariety.forms.map((f: any) => (
                                            <SelectItem key={f.id} value={f.id}>
                                                {f.formName} ({f.yieldPercentage}%)
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        )}
                        <div className="space-y-2">
                            <Label>Yield (%)</Label>
                            <Input
                                type="number"
                                value={yieldPercentage || ''}
                                onChange={e => setYieldPercentage(Number(e.target.value))}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Raw Material Price (Per Kg)</Label>
                        <Input
                            type="number"
                            value={rawMaterialPrice || ''}
                            onChange={e => setRawMaterialPrice(Number(e.target.value))}
                            placeholder="e.g. 20"
                        />
                    </div>

                    {/* CONDITIONAL INPUTS BASED ON MODE */}
                    {calculationMode === 'batch' ? (
                        <>
                            <div className="space-y-2">
                                <Label>Batch Duration (Hours - for 100kg)</Label>
                                <Input
                                    type="number"
                                    value={batchDuration || ''}
                                    onChange={e => setBatchDuration(Number(e.target.value))}
                                    placeholder="Hours for 100kg input"
                                />
                            </div>
                            {dryingMethod === 'electric' && (
                                <div className="space-y-2">
                                    <Label>Electricity Rate (Per Unit)</Label>
                                    <Input
                                        type="number"
                                        value={electricityRate || ''}
                                        onChange={e => setElectricityRate(Number(e.target.value))}
                                        placeholder="e.g. 8.5"
                                    />
                                </div>
                            )}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>No. of Laborers</Label>
                                    <Input
                                        type="number"
                                        value={numberOfLaborers || ''}
                                        onChange={e => setNumberOfLaborers(Number(e.target.value))}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Cost per Laborer</Label>
                                    <Input
                                        type="number"
                                        value={costPerLaborer || ''}
                                        onChange={e => setCostPerLaborer(Number(e.target.value))}
                                        placeholder="Total per "
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Batch Packaging Cost</Label>
                                    <Input
                                        type="number"
                                        value={packagingCost || ''}
                                        onChange={e => setPackagingCost(Number(e.target.value))}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Batch Transport Cost</Label>
                                    <Input
                                        type="number"
                                        value={transportCost || ''}
                                        onChange={e => setTransportCost(Number(e.target.value))}
                                    />
                                </div>
                            </div>
                        </>
                    ) : (
                        // ORDER MODE INPUTS
                        <>
                            <div className="space-y-2 border-l-4 border-blue-500 pl-4 bg-blue-50/50 py-2">
                                <Label className="text-blue-700">Target Order Quantity (Kg)</Label>
                                <Input
                                    type="number"
                                    className="font-bold text-lg"
                                    value={targetOrderQty || ''}
                                    onChange={e => setTargetOrderQty(Number(e.target.value))}
                                    placeholder="e.g. 1000"
                                />
                                <p className="text-xs text-muted-foreground">
                                    RM Needed: {yieldPercentage > 0 ? (targetOrderQty / (yieldPercentage / 100)).toFixed(0) : 0} Kg
                                </p>
                            </div>

                            <div className="space-y-1">
                                <Label>Total Project Lump Sum Costs</Label>
                                <Separator />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Total Labor Cost</Label>
                                    <Input
                                        type="number"
                                        value={lumpSumLaborCost || ''}
                                        onChange={e => setLumpSumLaborCost(Number(e.target.value))}
                                        placeholder="Total for Project"
                                    />
                                </div>
                                {dryingMethod === 'electric' && (
                                    <div className="space-y-2">
                                        <Label>Total Power Cost</Label>
                                        <Input
                                            type="number"
                                            value={lumpSumPowerCost || ''}
                                            onChange={e => setLumpSumPowerCost(Number(e.target.value))}
                                            placeholder="Total Power Bill"
                                        />
                                    </div>
                                )}
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Total Packaging Cost</Label>
                                    <Input
                                        type="number"
                                        value={lumpSumPackagingCost || ''}
                                        onChange={e => setLumpSumPackagingCost(Number(e.target.value))}
                                        placeholder="Total Bags/Boxes"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Total Transport Cost</Label>
                                    <Input
                                        type="number"
                                        value={lumpSumTransportCost || ''}
                                        onChange={e => setLumpSumTransportCost(Number(e.target.value))}
                                        placeholder="Total Truck/Logs"
                                    />
                                </div>
                            </div>
                        </>
                    )}


                    <div className="space-y-2">
                        <Label>GST Rate (%)</Label>
                        <Select value={gstRate.toString()} onValueChange={(val) => setGstRate(Number(val))}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="0">0%</SelectItem>
                                <SelectItem value="5">5%</SelectItem>
                                <SelectItem value="12">12%</SelectItem>
                                <SelectItem value="18">18%</SelectItem>
                                <SelectItem value="28">28%</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label>Margin (%)</Label>
                        <Select value={marginPercentage.toString()} onValueChange={(val) => setMarginPercentage(Number(val))}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="10">10%</SelectItem>
                                <SelectItem value="15">15%</SelectItem>
                                <SelectItem value="20">20%</SelectItem>
                                <SelectItem value="25">25% (Default)</SelectItem>
                                <SelectItem value="30">30%</SelectItem>
                                <SelectItem value="35">35%</SelectItem>
                                <SelectItem value="40">40%</SelectItem>
                                <SelectItem value="50">50%</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>



            <div className="space-y-6">
                <Card className="bg-slate-50 border-slate-200">
                    <CardHeader>
                        <CardTitle className="text-slate-800">Cost Analysis ({calculationMode === 'batch' ? 'Per 100kg Input' : 'Total Project'})</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm">
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Raw Material Cost</span>
                            <span>{formatMoney(rawMaterialBatchCost)}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Power Cost</span>
                            <span>{formatMoney(totalPowerCost)}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Labor Cost</span>
                            <span>{formatMoney(totalLaborCost)}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Overheads (Pkg + Tpt)</span>
                            <span>{formatMoney((calculationMode === 'batch' ? (packagingCost + transportCost) : (lumpSumPackagingCost + lumpSumTransportCost)))}</span>
                        </div>
                        <Separator className="my-2" />
                        <div className="flex justify-between font-medium text-base">
                            <span>Total Production Cost</span>
                            <span>{formatMoney(totalProductionCost)}</span>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-primary/5 border-primary/20">
                    <CardHeader>
                        <CardTitle className="text-primary">Quote Result</CardTitle>
                        <CardDescription>Based on {yieldPercentage}% Yield ({calculationMode === 'batch' ? `${fgWeight.toFixed(2)} Kg Output` : `${targetOrderQty.toFixed(2)} Kg Order`})</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-muted-foreground">Per Kg Calculation Base</span>
                            <span className="font-medium bg-slate-100 px-2 py-0.5 rounded text-slate-700">Total Revenue: {formatMoney(finalSellingPriceExclGST)}</span>
                        </div>

                        <div className="grid grid-cols-2 gap-4 pt-2">
                            <div className="p-3 bg-white rounded-lg border shadow-sm">
                                <div className="text-xs text-muted-foreground mb-1">Selling Price (Excl. GST)</div>
                                <div className="text-lg font-bold text-slate-900">{formatMoney(perKgSellingPriceExclGST)}</div>
                                <div className="text-[10px] text-muted-foreground">Per Kg</div>
                            </div>
                            <div className="p-3 bg-white rounded-lg border shadow-sm">
                                <div className="text-xs text-muted-foreground mb-1">GST Amount ({gstRate}%)</div>
                                <div className="text-lg font-bold text-slate-900">{formatMoney(gstAmountPerKg)}</div>
                                <div className="text-[10px] text-muted-foreground">Per Kg</div>
                            </div>
                        </div>

                        {/* NEW: Quoted Quantity Input & Unit Selection */}
                        <div className="space-y-2 pt-2">
                            <Label>Quoted Quantity</Label>
                            <div className="flex gap-2">
                                <div className="flex-1">
                                    <Input
                                        type="number"
                                        placeholder={`Output: ${fgWeight.toFixed(2)}`}
                                        // In Order Mode, this is read-only or synced
                                        value={calculationMode === 'order' ? targetOrderQty : (quotedQuantity || '')}
                                        onChange={(e) => {
                                            if (calculationMode === 'batch') setQuotedQuantity(Number(e.target.value));
                                            else setTargetOrderQty(Number(e.target.value));
                                        }}
                                        disabled={calculationMode === 'order'}
                                    />
                                </div>
                                <div className="w-[100px]">
                                    <Select
                                        value={calculationMode === 'order' ? 'Kg' : quantityUnit}
                                        onValueChange={(val: 'Kg' | 'Ton') => setQuantityUnit(val)}
                                        disabled={calculationMode === 'order'}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Kg">Kg</SelectItem>
                                            <SelectItem value="Ton">Ton</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="flex items-center text-sm font-medium whitespace-nowrap px-3 bg-slate-100 rounded border border-slate-200">
                                    Total: {formatMoney(calculationMode === 'order' ? (targetOrderQty * perKgSellingPriceExclGST) : ((quotedQuantity || fgWeight) * (quantityUnit === 'Ton' ? 1000 : 1) * perKgSellingPriceExclGST))}
                                </div>
                            </div>
                            <p className="text-[10px] text-muted-foreground">
                                {quantityUnit === 'Ton' && calculationMode === 'batch'
                                    ? `Rate will be converted to Per Ton (${formatMoney(perKgSellingPriceExclGST * 1000)})`
                                    : `Final Quote Value`}
                            </p>
                        </div>

                        <div className="grid grid-cols-2 gap-4 mt-4">
                            <Button type="button" onClick={addToQuote} className="w-full" variant="secondary">
                                <Plus className="w-4 h-4 mr-2" /> Add to Quote
                            </Button>
                            <Button type="button" variant="default" onClick={generatePDF} title="Download PDF" className="w-full">
                                <Download className="h-4 w-4 mr-2" /> Generate PDF ({quoteItems.length})
                            </Button>
                        </div>

                        <div className="p-4 bg-primary text-primary-foreground rounded-lg mt-4 shadow-md">
                            <div className="flex justify-between items-end">
                                <div>
                                    <div className="text-sm opacity-90">Final Landing Price</div>
                                    <div className="text-xs opaque-80">Inclusive of GST</div>
                                </div>
                                <div className="text-3xl font-bold tracking-tight">
                                    {formatMoney(finalLandingPriceInclGST)}
                                </div>
                            </div>
                            <div className="mt-2 text-right border-t border-primary-foreground/20 pt-2">
                                <span className="text-xs opacity-80 mr-2">Per Ton:</span>
                                <span className="text-lg font-bold">{formatMoney(finalLandingPricePerTon)}</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Quote Items List */}
            {quoteItems.length > 0 && (
                <div className="md:col-span-2">
                    <Card>
                        <CardHeader>
                            <CardTitle>Items in Quote Report</CardTitle>
                            <CardDescription>Client: {clientName || 'Not Selected'}</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Commodity</TableHead>
                                        <TableHead>Variety</TableHead>
                                        <TableHead>Yield</TableHead>
                                        <TableHead>Qty</TableHead>
                                        <TableHead>Rate</TableHead>
                                        <TableHead className="text-right">Price (Excl. GST)</TableHead>
                                        <TableHead className="w-[50px]"></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {quoteItems.map((item) => {
                                        const multiplier = item.unit === 'Ton' ? 1000 : 1;
                                        return (
                                            <TableRow key={item.id}>
                                                <TableCell className="font-medium">{item.commodityName}</TableCell>
                                                <TableCell>{item.varietyName}</TableCell>
                                                <TableCell>{item.yieldPercentage}%</TableCell>
                                                <TableCell>{item.quantity.toFixed(2)} {item.unit}</TableCell>
                                                <TableCell>{formatMoney(item.finalPriceExclGST * multiplier)}/{item.unit}</TableCell>
                                                <TableCell className="text-right font-bold">{formatMoney(item.finalPriceExclGST)}</TableCell>
                                                <TableCell>
                                                    <Button type="button" variant="ghost" size="icon" onClick={() => removeFromQuote(item.id)}>
                                                        <Trash2 className="h-4 w-4 text-red-500" />
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </div>
            )}
        </div >
    );
}
