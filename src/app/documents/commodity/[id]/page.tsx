"use client";

import { useEffect, useState } from "react";
import { getCommodity } from "@/app/actions/commodity";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, Printer, ArrowLeft, Globe } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { useParams } from "next/navigation";
import { useRef } from "react";

export default function GenerateDocumentPage() {
    const params = useParams();
    const id = params?.id as string;

    const [commodity, setCommodity] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [formData, setFormData] = useState<any>({ "FooterEmail": "sales@atlasagrofood.co.in" });
    const [docId] = useState(`DOC-${Math.floor(Math.random() * 10000)}`);

    const printRef = useRef(null);

    // Initial Load
    useEffect(() => {
        // Unwrap params if necessary (Next.js 15+ might need await, but relying on prop for now or use hook)
        // Check Next.js version usage. Next.js 15 params are async. 
        // I will assume params can be accessed directly or I need to unwrap. 
        // Given previous file `ProcurementProjectPage` used `await params`, I should probably handle it.
        // But this is a client component. Client components receive params as promise in Next 15?
        // Let's assume params is available or unwrap it.
        // Actually, let's treat it as if params is already resolved for safety, or wrap in async if needed.
        // Since `use client`, params are props.

        if (id) {
            loadCommodity(id);
        }
    }, [id]);

    async function loadCommodity(id: string) {
        setLoading(true);
        const result = await getCommodity(id);
        if (result.success) {
            setCommodity(result.data);
            // Initialize form data with defaults
            const initialData: any = {};
            const data = result.data as any;
            if (data?.documentTemplate?.sections) {
                data.documentTemplate.sections.forEach((section: any) => {
                    section.fields.forEach((field: any) => {
                        initialData[field.label] = field.defaultValue || "";
                    });
                });
            }
            // Add some meta fields
            // Add some meta fields
            initialData["Date"] = format(new Date(), "yyyy-MM-dd");
            initialData["FooterEmail"] = "sales@atlasagrofood.co.in";
            setFormData(initialData);
        }
        setLoading(false);
    }

    const handlePrint = () => {
        window.print();
    };

    const handleChange = (label: string, value: string) => {
        setFormData((prev: any) => ({ ...prev, [label]: value }));
    };

    if (loading) {
        return <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin" /></div>;
    }

    if (!commodity) {
        return <div className="p-8">Commodity not found.</div>;
    }

    if (!commodity.documentTemplate) {
        return (
            <div className="p-8">
                <h1 className="text-2xl font-bold mb-4">Document Generation</h1>
                <p className="mb-4 text-muted-foreground">No document template is defined for {commodity.name}.</p>
                <Link href="/settings/commodities">
                    <Button>Go to Settings to Define Template</Button>
                </Link>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 p-6 print:p-0 print:bg-white">
            <style jsx global>{`
                @media print {
                    @page {
                        margin: 0;
                    }
                    body {
                        margin: 1.6cm;
                    }
                }
            `}</style>
            <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6 print:block">

                {/* Controls (Hidden in Print) */}
                <div className="space-y-6 print:hidden">
                    <div className="flex items-center gap-2">
                        <Link href="/settings/commodities">
                            <Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4" /></Button>
                        </Link>
                        <h1 className="text-xl font-bold">Generate Document: {commodity.name}</h1>
                    </div>

                    <Card>
                        <CardContent className="p-4 space-y-4">
                            <div className="flex items-center justify-between">
                                <h3 className="font-semibold">Document Details</h3>
                                <Button onClick={handlePrint}>
                                    <Printer className="h-4 w-4 mr-2" /> Print / PDF
                                </Button>
                            </div>

                            <hr />

                            <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
                                {/* Meta Fields */}
                                <div className="grid gap-2">
                                    <Label>Date</Label>
                                    <Input
                                        type="date"
                                        value={formData["Date"] || ""}
                                        onChange={(e) => handleChange("Date", e.target.value)}
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label>Footer Email</Label>
                                    <Input
                                        value={formData["FooterEmail"] || ""}
                                        onChange={(e) => handleChange("FooterEmail", e.target.value)}
                                        placeholder="sales@atlasagrofood.co.in"
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label>Client Name</Label>
                                    <Input
                                        value={formData["Client Name"] || ""}
                                        onChange={(e) => handleChange("Client Name", e.target.value)}
                                        placeholder="Enter client name..."
                                    />
                                </div>

                                {/* Dynamic Fields */}
                                {commodity.documentTemplate.sections.map((section: any, sIdx: number) => (
                                    <div key={sIdx} className="space-y-3 pt-2">
                                        <h4 className="text-sm font-semibold text-slate-700 bg-slate-100 p-1 px-2 rounded">{section.title}</h4>
                                        {section.fields.map((field: any, fIdx: number) => (
                                            <div key={fIdx} className="grid gap-1.5">
                                                <Label className="text-xs">{field.label}</Label>
                                                {field.type === 'textarea' ? (
                                                    <Textarea
                                                        value={formData[field.label] || ""}
                                                        onChange={(e) => handleChange(field.label, e.target.value)}
                                                        className="h-20"
                                                    />
                                                ) : (
                                                    <Input
                                                        type={field.type}
                                                        value={formData[field.label] || ""}
                                                        onChange={(e) => handleChange(field.label, e.target.value)}
                                                    />
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Print Preview Area */}
                <div className="lg:col-span-2 print:w-full">
                    <div className="bg-white shadow-lg p-8 min-h-[1100px] w-full print:shadow-none print:p-0 print:min-h-0" id="document-preview">

                        {/* Header */}
                        <div className="flex items-center gap-3 border-b-2 border-green-700 pb-4 mb-8">
                            {/* Logo */}
                            <div>
                                <img src="/logo.png" alt="Atlas Agro Food Logo" className="h-28 w-auto object-contain" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-slate-800">ATLAS AGRO FOOD PVT. LTD.</h1>
                                <p className="text-sm text-slate-600">Agri Commodities | Feed Ingredients | Oilseed Products</p>
                                <div className="flex items-center gap-2 mt-1 text-sm text-green-700 font-medium">
                                    <Globe className="h-4 w-4" />
                                    <span>www.atlasagrofood.co.in</span>
                                </div>
                            </div>
                        </div>

                        {/* Title */}
                        <div className="mb-6">
                            <h2 className="text-3xl font-bold text-slate-900 mb-2">{commodity.name}</h2>
                            <h3 className="text-xl font-semibold bg-blue-600 text-white p-2 px-4 shadow-sm" style={{ printColorAdjust: "exact", WebkitPrintColorAdjust: "exact" }}>
                                Requirement Gathering Document – Trial Order
                            </h3>
                        </div>

                        {/* Order Info */}
                        <div className="mb-6 flex justify-between text-sm">
                            <div>
                                <span className="font-semibold text-slate-700">Client:</span> {formData["Client Name"]}
                            </div>
                            <div>
                                <span className="font-semibold text-slate-700">Date:</span> {formData["Date"]}
                            </div>
                        </div>

                        {/* Content Table */}
                        <div className="border border-slate-300">
                            {commodity.documentTemplate.sections.map((section: any, sIdx: number) => (
                                <div key={sIdx}>
                                    <div className="bg-blue-50 p-2 px-3 font-bold text-blue-900 border-b border-t border-slate-300 first:border-t-0 text-sm" style={{ printColorAdjust: "exact", WebkitPrintColorAdjust: "exact" }}>
                                        {sIdx + 1}. {section.title}
                                    </div>
                                    <table className="w-full text-sm">
                                        <tbody>
                                            {section.fields.map((field: any, fIdx: number) => (
                                                <tr key={fIdx} className="border-b border-slate-200 last:border-0">
                                                    <td className="p-2 w-1/2 text-slate-700 font-medium align-top border-r border-slate-200">
                                                        {field.label}
                                                    </td>
                                                    <td className="p-2 align-top">
                                                        {formData[field.label]}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ))}
                        </div>

                        {/* Buyer Confirmation */}
                        <div className="mt-8 pt-6 border-t border-slate-300">
                            <h4 className="font-bold text-slate-800 mb-4 text-lg">Buyer Confirmation</h4>
                            <div className="space-y-4 text-sm text-slate-700">
                                <div className="grid grid-cols-[200px_1fr] gap-4 items-end">
                                    <span className="font-semibold">Name:</span>
                                    <div className="border-b border-slate-400 h-1"></div>
                                </div>
                                <div className="grid grid-cols-[200px_1fr] gap-4 items-end">
                                    <span className="font-semibold">Company:</span>
                                    <div className="border-b border-slate-400 h-1"></div>
                                </div>
                                <div className="grid grid-cols-[200px_1fr] gap-4 items-end">
                                    <span className="font-semibold">Signature / Email Confirmation:</span>
                                    <div className="border-b border-slate-400 h-1"></div>
                                </div>
                                <div className="grid grid-cols-[200px_1fr] gap-4 items-end">
                                    <span className="font-semibold">Date:</span>
                                    <div className="border-b border-slate-400 h-1"></div>
                                </div>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="mt-12 pt-4 border-t border-slate-300 text-xs text-slate-500 text-center">
                            <p>Atlas Agro Food Pvt. Ltd. | India</p>
                            <p>Email: {formData["FooterEmail"]} | Website: www.atlasagrofood.co.in</p>
                            <p className="mt-1 italic">This document is confidential and intended for business communication only.</p>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
}
