
import { getPurchaseOrder } from "@/app/actions/procurement";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default async function PurchaseOrderPrintPage({ params }: { params: { id: string } }) {
    const { id } = await params;
    const { data: order, error } = await getPurchaseOrder(id);

    if (error || !order) {
        notFound();
    }

    // In a real app, this would come from a settings or company profile
    const buyerDetails = {
        name: "Atlas Agrofood",
        address: "123 Business Park, Mumbai, India",
        phone: "+91 98765 43210",
        email: "procurement@atlasagrofood.com"
    };

    // Use direct values from the Purchase Order
    const quantity = (order as any).quantity ? Number((order as any).quantity) : 0;
    const quantityUnit = (order as any).quantityUnit || "MT";
    const totalAmount = Number(order.totalAmount);

    // Calculate implied rate if not stored
    // Total = Qty * 1000 * Rate (if MT/Kg logic)
    // Rate = Total / (Qty * 1000)
    let impliedRate = 0;
    if (quantity > 0) {
        if (quantityUnit === 'MT') {
            impliedRate = totalAmount / (quantity * 1000);
        } else {
            impliedRate = totalAmount / quantity;
        }
    }

    return (
        <div className="p-8 max-w-[210mm] mx-auto bg-white min-h-screen text-black print:p-0">
            {/* Header */}
            <div className="flex justify-between items-start mb-12">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">PURCHASE ORDER</h1>
                    <p className="text-slate-500 mt-1">PO #: {order.id.slice(0, 8).toUpperCase()}</p>
                    <p className="text-slate-500">Date: {format(new Date(order.createdAt), "PPP")}</p>
                </div>
                <div className="text-right">
                    <h2 className="text-xl font-bold text-slate-800">{buyerDetails.name}</h2>
                    <div className="text-sm text-slate-600 mt-2">
                        <p>{buyerDetails.address}</p>
                        <p>{buyerDetails.phone}</p>
                        <p>{buyerDetails.email}</p>
                    </div>
                </div>
            </div>

            {/* Vendor & Ship To */}
            <div className="grid grid-cols-2 gap-12 mb-12">
                <div>
                    <h3 className="font-bold text-slate-700 border-b pb-2 mb-4 uppercase text-sm tracking-wide">Vendor</h3>
                    <div className="text-slate-800">
                        <p className="font-bold text-lg">{order.vendor.name}</p>
                        <p>{[order.vendor.city?.name, order.vendor.state?.name, order.vendor.country?.name].filter(Boolean).join(", ")}</p>
                        {order.vendor.phone && <p>Phone: {order.vendor.phone}</p>}
                        {order.vendor.email && <p>Email: {order.vendor.email}</p>}
                    </div>
                </div>
                <div>
                    <h3 className="font-bold text-slate-700 border-b pb-2 mb-4 uppercase text-sm tracking-wide">Ship To</h3>
                    <div className="text-slate-800">
                        <p className="font-bold text-lg">{buyerDetails.name}</p>
                        <p>Warehouse No. 4</p>
                        <p>{buyerDetails.address}</p>
                    </div>
                </div>
            </div>

            {/* Items Table */}
            <div className="mb-12">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="text-slate-900 font-bold">Item Description</TableHead>
                            <TableHead className="text-right text-slate-900 font-bold">Quantity</TableHead>
                            <TableHead className="text-right text-slate-900 font-bold">Rate</TableHead>
                            <TableHead className="text-right text-slate-900 font-bold">Total</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        <TableRow>
                            <TableCell>
                                <span className="font-medium">{order.project.name}</span>
                                {order.sample && (
                                    <div className="text-xs text-slate-500 mt-1">
                                        Ref Sample: {order.sample.id.slice(0, 8)}
                                        {/* Show quoted price if differs from PO price? */}
                                    </div>
                                )}
                            </TableCell>
                            <TableCell className="text-right">
                                {quantity} {quantityUnit}
                            </TableCell>
                            <TableCell className="text-right">
                                ₹{impliedRate.toFixed(2)} / kg
                            </TableCell>
                            <TableCell className="text-right font-bold">
                                ₹{totalAmount.toLocaleString()}
                            </TableCell>
                        </TableRow>
                    </TableBody>
                </Table>
            </div>

            {/* Totals */}
            <div className="flex justify-end mb-16">
                <div className="w-1/3">
                    <div className="flex justify-between border-b pb-2 mb-2">
                        <span className="text-slate-600">Subtotal</span>
                        <span className="font-medium">₹{totalAmount.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between border-b pb-2 mb-2">
                        <span className="text-slate-600">Tax (0%)</span>
                        <span className="font-medium">₹0.00</span>
                    </div>
                    <div className="flex justify-between pt-2">
                        <span className="font-bold text-lg">Total</span>
                        <span className="font-bold text-lg">₹{totalAmount.toLocaleString()}</span>
                    </div>
                </div>
            </div>

            {/* Signature */}
            <div className="grid grid-cols-2 gap-12 mt-auto">
                <div>
                    <div className="border-t border-slate-400 pt-4 mt-16">
                        <p className="font-bold text-slate-700">Authorized Signature</p>
                        <p className="text-sm text-slate-500">For {buyerDetails.name}</p>
                    </div>
                </div>
                <div>
                    <div className="border-t border-slate-400 pt-4 mt-16">
                        <p className="font-bold text-slate-700">Vendor Acceptance</p>
                        <p className="text-sm text-slate-500">Date: _________________</p>
                    </div>
                </div>
            </div>

            {/* Print Trigger */}
            <PrintTrigger />
        </div>
    );
}

// Client component to trigger print dialog automatically
import { PrintTrigger } from "./_components/print-trigger";
