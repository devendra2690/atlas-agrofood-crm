'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button"; // For reset if needed
import { formatCurrency } from "@/lib/utils"; // Assuming this exists, or I will use Intl.NumberFormat
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Download } from 'lucide-react';

interface Variety {
    id: string;
    name: string;
    yieldPercentage: number;
}

interface Commodity {
    id: string;
    name: string;
    yieldPercentage: number;
    varieties: Variety[];
}

interface QuoteCalculatorProps {
    commodities: Commodity[];
    companies: any[]; // Using any for simplicity as Company type might be complex to import here, or import { Company } from "@prisma/client"
}

interface QuoteItem {
    id: string;
    commodityName: string;
    varietyName: string;
    yieldPercentage: number;
    rawMaterialPrice: number;
    finalPriceExclGST: number;
    remarks: string;
}

import { Check, ChevronsUpDown, Plus, Trash2 } from "lucide-react";
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

export function QuoteCalculator({ commodities, companies }: QuoteCalculatorProps) {
    // Client State
    const [clientName, setClientName] = useState<string>('');
    const [isClientOpen, setIsClientOpen] = useState(false);
    const [quoteItems, setQuoteItems] = useState<QuoteItem[]>([]);

    // Canvas Inputs
    const [selectedCommodityId, setSelectedCommodityId] = useState<string>('');
    const [selectedVarietyId, setSelectedVarietyId] = useState<string>('');
    const [rawMaterialPrice, setRawMaterialPrice] = useState<number>(0);
    const [batchDuration, setBatchDuration] = useState<number>(0); // Hours
    const [numberOfLaborers, setNumberOfLaborers] = useState<number>(0);
    const [costPerLaborer, setCostPerLaborer] = useState<number>(0);
    const [packagingCost, setPackagingCost] = useState<number>(0);
    const [transportCost, setTransportCost] = useState<number>(0);
    const [gstRate, setGstRate] = useState<number>(5); // Default 5%

    // Derived States for Display
    const [yieldPercentage, setYieldPercentage] = useState<number>(0);

    const [marginPercentage, setMarginPercentage] = useState<number>(25); // Default 25%

    const [electricityRate, setElectricityRate] = useState<number>(8.5); // Default 8.5

    // Constants
    // const FIXED_ELECTRICITY_RATE = 8.50; // Now dynamic
    const POWER_CONSUMPTION_RATE = 12.5; // units per hour per 100kg input

    useEffect(() => {
        if (selectedCommodityId) {
            const commodity = commodities.find(c => c.id === selectedCommodityId);
            if (selectedVarietyId) {
                const variety = commodity?.varieties.find(v => v.id === selectedVarietyId);
                if (variety) {
                    setYieldPercentage(variety.yieldPercentage);
                }
            } else if (commodity) {
                // Fallback to commodity default yield
                setYieldPercentage(commodity.yieldPercentage);
            }
        } else {
            setYieldPercentage(0);
        }
    }, [selectedCommodityId, selectedVarietyId, commodities]);


    // Calculations
    const totalLaborCost = numberOfLaborers * costPerLaborer;

    // Power Cost
    const unitsConsumed = batchDuration * POWER_CONSUMPTION_RATE;
    const totalPowerCost = unitsConsumed * electricityRate;

    // Total Production Cost (for 100kg INPUT)
    // Note: Raw Material Price is per Kg. So for 100kg batch:
    const rawMaterialBatchCost = rawMaterialPrice * 100;

    const totalProductionCost = rawMaterialBatchCost + totalPowerCost + totalLaborCost + packagingCost + transportCost;

    // Yield Processing
    // Finished Goods (FG) Weight = 100 kg * Yield % / 100
    const fgWeight = 100 * (yieldPercentage / 100);

    // Margin Addition
    // Margin Addition
    const marginAmount = totalProductionCost * (marginPercentage / 100);
    const totalWithMargin = totalProductionCost + marginAmount;

    // Selling Prices
    // This 'totalWithMargin' is for the entire batch (which resulted in fgWeight kg of product)
    const finalSellingPriceExclGST = totalWithMargin;

    // Per Kg Selling Price (Excl. GST)
    const perKgSellingPriceExclGST = fgWeight > 0 ? finalSellingPriceExclGST / fgWeight : 0;

    // GST Amount
    const gstAmountPerKg = perKgSellingPriceExclGST * (gstRate / 100);

    // Final Landing Price (Incl. GST)
    // Final Landing Price (Incl. GST)
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

    const addToQuote = () => {
        if (!selectedCommodity) return;

        const varietyName = selectedCommodity.varieties.find(v => v.id === selectedVarietyId)?.name || 'Default';

        const newItem: QuoteItem = {
            id: crypto.randomUUID(),
            commodityName: selectedCommodity.name,
            varietyName: varietyName,
            yieldPercentage: yieldPercentage,
            rawMaterialPrice: rawMaterialPrice,
            finalPriceExclGST: perKgSellingPriceExclGST,
            remarks: `${yieldPercentage}% Yield`
        };

        setQuoteItems([...quoteItems, newItem]);
    };

    const removeFromQuote = (id: string) => {
        setQuoteItems(quoteItems.filter(item => item.id !== id));
    };

    const generatePDF = async () => {
        const doc = new jsPDF();
        const pageWidth = doc.internal.pageSize.width;

        // Load Logo
        const logoUrl = '/logo.png';
        const logoImg = new Image();
        logoImg.src = logoUrl;

        try {
            await new Promise((resolve, reject) => {
                logoImg.onload = resolve;
                logoImg.onerror = reject;
            });
            doc.addImage(logoImg, 'PNG', 14, 10, 25, 25);
        } catch (e) {
            console.warn("Logo not found or failed to load", e);
        }

        // Header
        doc.setFontSize(20);
        doc.setTextColor(40, 40, 40);
        doc.text("Atlas Agrofood", 45, 22);

        doc.setFontSize(10);
        doc.setTextColor(100, 100, 100);
        doc.text("Quote Rate Calculation Report", 45, 28);
        doc.text(`Date: ${new Date().toLocaleDateString()}`, pageWidth - 14, 22, { align: 'right' });

        // Line
        doc.setLineWidth(0.5);
        doc.setDrawColor(200, 200, 200);
        doc.line(14, 38, pageWidth - 14, 38);

        // Input Parameters
        autoTable(doc, {
            startY: 45,
            head: [['Input Parameter', 'Value']],
            body: [
                ['Commodity', selectedCommodity?.name || '-'],
                ['Variety', selectedCommodity?.varieties.find(v => v.id === selectedVarietyId)?.name || 'Default'],
                ['Yield %', `${yieldPercentage}%`],
                ['Raw Material Price', formatMoney(rawMaterialPrice) + ' / Kg'],
                ['Batch Duration', `${batchDuration} Hours`],
                ['Electricity Rate', `${electricityRate} / Unit`],
                ['Labor', `${numberOfLaborers} @ ${formatMoney(costPerLaborer)}`],
                ['Overheads (Pkg + Tpt)', formatMoney(packagingCost + transportCost)],
                ['Margin', `${marginPercentage}%`],
                ['GST Rate', `${gstRate}%`],
            ],
            theme: 'striped',
            headStyles: { fillColor: [41, 128, 185], textColor: 255, fontStyle: 'bold' },
            styles: { fontSize: 9, cellPadding: 3 },
            alternateRowStyles: { fillColor: [245, 245, 245] }
        });

        // Cost Analysis
        autoTable(doc, {
            //@ts-ignore
            startY: doc.lastAutoTable.finalY + 10,
            head: [['Cost Component', 'Value']],
            body: [
                ['Raw Material (100kg)', formatMoney(rawMaterialBatchCost)],
                ['Power', formatMoney(totalPowerCost)],
                ['Labor', formatMoney(totalLaborCost)],
                ['Overheads', formatMoney(packagingCost + transportCost)],
                ['Total Production Cost', formatMoney(totalProductionCost)],
            ],
            theme: 'grid',
            headStyles: { fillColor: [52, 152, 219], textColor: 255, fontStyle: 'bold' },
            styles: { fontSize: 9, cellPadding: 3 }
        });

        // Final Quote
        autoTable(doc, {
            //@ts-ignore
            startY: doc.lastAutoTable.finalY + 10,
            head: [['Metric', 'Value']],
            body: [
                ['Output Weight', `${fgWeight.toFixed(2)} Kg`],
                ['Batch Revenue (Excl. GST)', formatMoney(finalSellingPriceExclGST)],
                ['Selling Price (Excl. GST)', `${formatMoney(perKgSellingPriceExclGST)} / Kg`],
                ['GST Amount', `${formatMoney(gstAmountPerKg)} / Kg`],
                ['Final Landing Price', `${formatMoney(finalLandingPriceInclGST)} / Kg`],
                ['Final Landing Price (Per Ton)', formatMoney(finalLandingPricePerTon)],
            ],
            theme: 'grid',
            headStyles: { fillColor: [39, 174, 96], textColor: 255, fontStyle: 'bold' }, // Green for money
            columnStyles: {
                0: { fontStyle: 'bold' },
                1: { fontStyle: 'bold', halign: 'right' }
            },
            styles: { fontSize: 10, cellPadding: 4 }
        });

        // Footer
        const pageCount = doc.getNumberOfPages();
        doc.setFontSize(8);
        doc.setTextColor(150);
        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            doc.text('Generated by Atlas Agrofood CRM', 14, doc.internal.pageSize.height - 10);
            doc.text(`Page ${i} of ${pageCount}`, pageWidth - 14, doc.internal.pageSize.height - 10, { align: 'right' });
        }

        doc.save(`Quote_${selectedCommodity?.name || 'Calculation'}_${new Date().toISOString().split('T')[0]}.pdf`);
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
                                        // Update client Name as user types to support "Creatable" behavior
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
                            <CardDescription>Enter batch details based on 100kg Input</CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Commodity</Label>
                            <Select value={selectedCommodityId} onValueChange={(val) => {
                                setSelectedCommodityId(val);
                                setSelectedVarietyId(''); // Reset variety
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
                            <Select value={selectedVarietyId} onValueChange={setSelectedVarietyId} disabled={!selectedCommodityId}>
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

                    <div className="space-y-2">
                        <Label>Batch Duration (Hours)</Label>
                        <Input
                            type="number"
                            value={batchDuration || ''}
                            onChange={e => setBatchDuration(Number(e.target.value))}
                            placeholder="Hours for 100kg input"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>Electricity Rate (Per Unit)</Label>
                        <Input
                            type="number"
                            value={electricityRate || ''}
                            onChange={e => setElectricityRate(Number(e.target.value))}
                            placeholder="e.g. 8.5"
                        />
                    </div>

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
                                placeholder="Total per person"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Packaging Cost</Label>
                            <Input
                                type="number"
                                value={packagingCost || ''}
                                onChange={e => setPackagingCost(Number(e.target.value))}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Transport Cost</Label>
                            <Input
                                type="number"
                                value={transportCost || ''}
                                onChange={e => setTransportCost(Number(e.target.value))}
                            />
                        </div>
                    </div>

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
                        <CardTitle className="text-slate-800">Cost Analysis</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm">
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Raw Material (100kg)</span>
                            <span>{formatMoney(rawMaterialBatchCost)}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Power ({unitsConsumed} units)</span>
                            <span>{formatMoney(totalPowerCost)}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Labor</span>
                            <span>{formatMoney(totalLaborCost)}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Overheads (Pkg + Tpt)</span>
                            <span>{formatMoney(packagingCost + transportCost)}</span>
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
                        <CardDescription>Based on {yieldPercentage}% Yield ({fgWeight.toFixed(2)} Kg Output)</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-muted-foreground">Per Kg Calculation Base</span>
                            <span className="font-medium bg-slate-100 px-2 py-0.5 rounded text-slate-700">Batch Revenue: {formatMoney(finalSellingPriceExclGST)}</span>
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
                                        <TableHead>Raw Material</TableHead>
                                        <TableHead className="text-right">Price (Excl. GST)</TableHead>
                                        <TableHead className="w-[50px]"></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {quoteItems.map((item) => (
                                        <TableRow key={item.id}>
                                            <TableCell className="font-medium">{item.commodityName}</TableCell>
                                            <TableCell>{item.varietyName}</TableCell>
                                            <TableCell>{item.yieldPercentage}%</TableCell>
                                            <TableCell>{formatMoney(item.rawMaterialPrice)}</TableCell>
                                            <TableCell className="text-right font-bold">{formatMoney(item.finalPriceExclGST)}</TableCell>
                                            <TableCell>
                                                <Button type="button" variant="ghost" size="icon" onClick={() => removeFromQuote(item.id)}>
                                                    <Trash2 className="h-4 w-4 text-red-500" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </div>
            )}
        </div >
    );
}
