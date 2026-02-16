'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { numberToWords } from "@/lib/utils";
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
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
    rawMaterialPrice: number;
    finalPriceExclGST: number;
    remarks: string;
}

export function QuoteCalculator({ commodities, companies }: QuoteCalculatorProps) {
    // Client State
    const [clientName, setClientName] = useState<string>('');
    const [isClientOpen, setIsClientOpen] = useState(false);
    const [quoteItems, setQuoteItems] = useState<QuoteItem[]>([]);

    // Canvas Inputs
    const [selectedCommodityId, setSelectedCommodityId] = useState<string>('');
    const [selectedVarietyId, setSelectedVarietyId] = useState<string>('');
    const [selectedVarietyFormId, setSelectedVarietyFormId] = useState<string>('');
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

    // NEW: Quoted Quantity State
    const [quotedQuantity, setQuotedQuantity] = useState<number>(0);

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
        const quantityToQuote = quotedQuantity > 0 ? quotedQuantity : fgWeight;

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
        try {
            const doc = new jsPDF();
            const pageWidth = doc.internal.pageSize.width;

            // --- Helper Constants ---
            const leftMargin = 14;
            const rightMargin = pageWidth - 14;
            const startY = 10;
            let currentY = startY;

            // --- 1. Title ---
            doc.setFontSize(14);
            doc.setFont("helvetica", "bold");
            doc.text("Quotation", pageWidth / 2, currentY + 5, { align: 'center' });
            doc.setLineWidth(0.5);
            doc.line(leftMargin, currentY + 7, rightMargin, currentY + 7);
            currentY += 15;

            // --- 2. Header Section ---
            // Company Details
            doc.setFontSize(10);
            doc.setFont("helvetica", "bold");
            doc.text("Atlas Agrofood", 14, startY + 5);
            doc.setFont("helvetica", "normal");
            doc.setFontSize(9);
            doc.text("123, Business Park,\nMumbai, Maharashtra, India.\nGSTIN: 27AAAAA0000A1Z5\nEmail: contact@atlasagrofood.com", 14, startY + 10);

            // Invoice Details (Right Side)
            doc.text(`Invoice No: PG/Q/${new Date().getFullYear()}/${Math.floor(Math.random() * 1000)}`, rightMargin, startY + 5, { align: 'right' });
            doc.text(`Date: ${new Date().toLocaleDateString('en-GB')}`, rightMargin, startY + 10, { align: 'right' });
            doc.text(`Terms: 100% Advance`, rightMargin, startY + 15, { align: 'right' });

            currentY += 25;

            // Client & Consignee Table
            autoTable(doc, {
                startY: currentY,
                theme: 'grid',
                body: [
                    [
                        { content: `Buyer (Bill To):\n${clientName || 'Cash Client'}\nAddress: [Client Address Here]\nGSTIN: [Client GSTIN]`, styles: { halign: 'left', cellWidth: pageWidth / 2 - 14 } },
                        { content: `Consignee (Ship To):\n${clientName || 'Same as Buyer'}\n[Ship Address Here]`, styles: { halign: 'left', cellWidth: pageWidth / 2 - 14 } }
                    ]
                ],
                styles: {
                    fontSize: 9,
                    cellPadding: 3,
                    lineColor: [0, 0, 0],
                    lineWidth: 0.1,
                }
            });

            // @ts-ignore
            currentY = doc.lastAutoTable.finalY + 5;

            // --- 3. Items & Totals Table ---

            // Calculate Totals First
            let totalTaxable = 0;
            let totalCGST = 0;
            let totalSGST = 0;

            const itemsToCalc = quoteItems.length > 0 ? quoteItems : (selectedCommodityId ? [{
                finalPriceExclGST: perKgSellingPriceExclGST,
                yieldPercentage: yieldPercentage,
                quantity: quotedQuantity > 0 ? quotedQuantity : fgWeight,
                isSingleItem: true,
                commodityName: selectedCommodity?.name,
                varietyName: selectedVariety?.name
            }] : []);

            itemsToCalc.forEach((item: any) => {
                const quantity = item.quantity;
                const rateVal = item.finalPriceExclGST;
                totalTaxable += (quantity * rateVal);
            });

            const gstRateVal = quoteItems.length > 0 ? 5 : gstRate;
            totalCGST = totalTaxable * ((gstRateVal / 2) / 100);
            totalSGST = totalTaxable * ((gstRateVal / 2) / 100);
            const grandTotal = totalTaxable + totalCGST + totalSGST;

            // Build Table Body
            let tableBody = [];

            if (quoteItems.length > 0) {
                tableBody = quoteItems.map((item, index) => {
                    const quantity = item.quantity;
                    const rateVal = item.finalPriceExclGST;
                    const lineAmount = quantity * rateVal;
                    const cgstRate = 2.5;
                    const sgstRate = 2.5;

                    return [
                        index + 1,
                        `${item.commodityName} - ${item.varietyName}`,
                        '0804',
                        quantity.toFixed(2),
                        formatMoney(rateVal).replace('₹', ''),
                        'Kg',
                        `${cgstRate}%`,
                        `${sgstRate}%`,
                        formatMoney(lineAmount).replace('₹', '')
                    ];
                });
            } else if (selectedCommodityId) {
                const quantity = quotedQuantity > 0 ? quotedQuantity : fgWeight;
                const rateVal = perKgSellingPriceExclGST;
                const lineAmount = quantity * rateVal;

                let desc = `${selectedCommodity?.name} - ${selectedVariety?.name || 'Default'}`;
                if (selectedVarietyFormId && selectedVariety?.forms) {
                    const form = selectedVariety.forms.find((f: any) => f.id === selectedVarietyFormId);
                    if (form) {
                        desc += ` - ${form.formName}`;
                    }
                }

                tableBody.push([
                    1,
                    desc,
                    '0804',
                    quantity.toFixed(2),
                    formatMoney(rateVal).replace('₹', ''),
                    'Kg',
                    `${gstRateVal / 2}%`,
                    `${gstRateVal / 2}%`,
                    formatMoney(lineAmount).replace('₹', '')
                ]);
            }

            // Append Totals Rows with colSpan
            tableBody.push(
                // @ts-ignore
                [{ content: 'Total Taxable', colSpan: 8, styles: { halign: 'right' } }, formatMoney(totalTaxable).replace('₹', '')],
                // @ts-ignore
                [{ content: 'CGST', colSpan: 8, styles: { halign: 'right' } }, formatMoney(totalCGST).replace('₹', '')],
                // @ts-ignore
                [{ content: 'SGST', colSpan: 8, styles: { halign: 'right' } }, formatMoney(totalSGST).replace('₹', '')],
                // @ts-ignore
                [{ content: 'Total', colSpan: 8, styles: { halign: 'right', fontStyle: 'bold' } }, { content: formatMoney(grandTotal).replace('₹', ''), styles: { fontStyle: 'bold', halign: 'right' } }]
            );

            autoTable(doc, {
                startY: currentY,
                theme: 'grid',
                head: [
                    [
                        { content: 'Sr', styles: { halign: 'center', valign: 'middle' } },
                        { content: 'Description', styles: { halign: 'left', valign: 'middle' } },
                        { content: 'HSN', styles: { halign: 'center', valign: 'middle' } },
                        { content: 'Qty', styles: { halign: 'center', valign: 'middle' } },
                        { content: 'Rate', styles: { halign: 'center', valign: 'middle' } },
                        { content: 'Unit', styles: { halign: 'center', valign: 'middle' } },
                        { content: 'CGST', styles: { halign: 'center', valign: 'middle' } },
                        { content: 'SGST', styles: { halign: 'center', valign: 'middle' } },
                        { content: 'Amount', styles: { halign: 'center', valign: 'middle' } }
                    ]
                ],
                body: tableBody,
                styles: {
                    fontSize: 9,
                    cellPadding: 3,
                    lineColor: [0, 0, 0],
                    lineWidth: 0.1,
                    textColor: [0, 0, 0],
                    valign: 'middle'
                },
                columnStyles: {
                    0: { cellWidth: 10, halign: 'center' },
                    1: { cellWidth: 'auto' }, // Description
                    2: { cellWidth: 20, halign: 'center' },
                    3: { cellWidth: 15, halign: 'center' },
                    4: { cellWidth: 20, halign: 'right' },
                    5: { cellWidth: 15, halign: 'center' },
                    6: { cellWidth: 15, halign: 'center' },
                    7: { cellWidth: 15, halign: 'center' },
                    8: { cellWidth: 25, halign: 'right' }
                }
            });

            // @ts-ignore
            currentY = doc.lastAutoTable.finalY + 10;

            // Amount in Words
            doc.setFontSize(10);
            doc.setFont("helvetica", "bold");
            doc.text("Amount Chargeable (in words):", leftMargin, currentY);
            doc.setFont("helvetica", "normal");
            doc.text(`INR ${numberToWords(Math.round(grandTotal))} Only.`, leftMargin, currentY + 5);

            // Signature
            doc.text("For Atlas Agrofood", rightMargin, currentY + 15, { align: 'right' });
            doc.text("Authorized Signatory", rightMargin, currentY + 30, { align: 'right' });

            // Save
            const safeClientName = (clientName || 'Draft').replace(/[^a-z0-9]/gi, '_').substring(0, 50);
            doc.save(`Quotation_${safeClientName}_${new Date().toISOString().split('T')[0]}.pdf`);

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

                        {/* NEW: Quoted Quantity Input */}
                        <div className="space-y-2 pt-2">
                            <Label>Quoted Quantity (Kg)</Label>
                            <div className="flex gap-2">
                                <Input
                                    type="number"
                                    placeholder={`Batch Output: ${fgWeight.toFixed(2)}`}
                                    value={quotedQuantity || ''}
                                    onChange={(e) => setQuotedQuantity(Number(e.target.value))}
                                />
                                <div className="flex items-center text-sm font-medium whitespace-nowrap px-3 bg-slate-100 rounded border border-slate-200">
                                    Total: {formatMoney((quotedQuantity || fgWeight) * perKgSellingPriceExclGST)}
                                </div>
                            </div>
                            <p className="text-[10px] text-muted-foreground">Leave empty to use batch output ({fgWeight.toFixed(2)} Kg)</p>
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
                                            <TableCell>{item.quantity.toFixed(2)}</TableCell>
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
