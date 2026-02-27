import { notFound } from "next/navigation";
import { format } from "date-fns";
import { getBill } from "@/app/actions/finance";

import { atlasLogoBase64 } from "@/lib/logo-base64";

export default async function PurchaseInvoicePrintPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const result = await getBill(id);

    if (!result.success || !result.data) {
        notFound();
    }

    const bill = result.data;
    const vendor = bill.vendor;
    const order = bill.purchaseOrder;

    const atlasDetails = {
        name: "Atlas AgroFood",
        address: "SN-115, Plot : 56, Gajanan Colony, Khamgaon, District Buldhana, Maharashtra 444303",
        stateName: "Maharashtra",
        stateCode: "27",
        gstin: "27ABECA8433F1ZP",
        phone: "+91 70583 89496",
        email: "sales@atlasagrofood.co.in"
    };

    const quantity = order.quantity ? Number(order.quantity) : 0;
    const quantityUnit = order.quantityUnit || "MT";
    const taxableAmount = Number(bill.totalAmount);

    let impliedRate = 0;
    if (quantity > 0) {
        impliedRate = quantityUnit === 'MT' ? taxableAmount / (quantity * 1000) : taxableAmount / quantity;
    }

    const formattedTaxable = taxableAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    const cgstValue = taxableAmount * 0.025;
    const sgstValue = taxableAmount * 0.025;
    const finalTotalAmount = taxableAmount + cgstValue + sgstValue;

    const cgst = cgstValue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const sgst = sgstValue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const formattedFinalTotal = finalTotalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    const numberToWords = (num: number): string => {
        if (num === 0) return "Zero";
        const a = ["", "One ", "Two ", "Three ", "Four ", "Five ", "Six ", "Seven ", "Eight ", "Nine ", "Ten ", "Eleven ", "Twelve ", "Thirteen ", "Fourteen ", "Fifteen ", "Sixteen ", "Seventeen ", "Eighteen ", "Nineteen "];
        const b = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];
        const n = String(num).padStart(9, "0");
        const match = n.match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/);
        if (!match) return String(num);
        let str = "";
        str += parseInt(match[1]) != 0 ? (a[parseInt(match[1])] || b[parseInt(match[1][0])] + " " + a[parseInt(match[1][1])]) + "Crore " : "";
        str += parseInt(match[2]) != 0 ? (a[parseInt(match[2])] || b[parseInt(match[2][0])] + " " + a[parseInt(match[2][1])]) + "Lakh " : "";
        str += parseInt(match[3]) != 0 ? (a[parseInt(match[3])] || b[parseInt(match[3][0])] + " " + a[parseInt(match[3][1])]) + "Thousand " : "";
        str += parseInt(match[4]) != 0 ? (a[parseInt(match[4])] || b[parseInt(match[4][0])] + " " + a[parseInt(match[4][1])]) + "Hundred " : "";
        str += parseInt(match[5]) != 0 ? ((str != "") ? "and " : "") + (a[parseInt(match[5])] || b[parseInt(match[5][0])] + " " + a[parseInt(match[5][1])]) : "";
        return str.trim();
    };

    const vendorAddress = [
        vendor.city?.name,
        vendor.state?.name,
        vendor.country?.name
    ].filter(Boolean).join(", ");

    return (
        <div className="p-4 max-w-[210mm] mx-auto bg-white min-h-[297mm] text-black print:p-8 font-sans text-[11px] leading-snug relative">

            {/* Background Watermark */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden z-0 opacity-10">
                <img src={atlasLogoBase64} alt="Watermark Logo" className="w-[400px] h-auto object-contain grayscale" />
            </div>

            <div className="relative z-10">
                {/* Header: PURCHASE INVOICE */}
                <h1 className="text-center font-bold text-lg underline mb-2 tracking-wide">PURCHASE INVOICE</h1>

                <table className="w-full border-collapse border-2 border-black">
                    <tbody>
                        {/* Row 1: Split Left (Supplier) / Right (Invoice Info grid) */}
                        <tr className="align-top">
                            {/* LEFT COLUMN: Supplier Details. */}
                            <td className="w-1/2 border border-black p-1 px-2 border-r-2" rowSpan={3}>
                                <p className="text-[10px] underline mb-1">Supplier (Vendor)</p>
                                <p className="font-bold text-[13px]">{vendor.name}</p>
                                <p>{vendorAddress || "No address provided"}</p>
                                <p>State Name: {vendor.state?.name || "-"} </p>
                                <p>GSTIN/UIN: Unregistered</p>
                                <p>Contact: {vendor.phone || "-"}</p>
                            </td>

                            {/* RIGHT GRID TOP: Invoice No & Date */}
                            <td className="w-1/4 border border-black p-1 border-r">
                                <p className="text-[10px]">Invoice No.</p>
                                <p className="font-bold">{bill.invoiceNumber || bill.id.split('-')[0].toUpperCase()}</p>
                            </td>
                            <td className="w-1/4 border border-black p-1 border-r-0">
                                <p className="text-[10px]">Date</p>
                                <p className="font-bold">{format(new Date(bill.createdAt), "dd-MMM-yyyy")}</p>
                            </td>
                        </tr>

                        {/* Row 2: PO Ref */}
                        <tr className="align-top">
                            <td className="w-1/4 border border-black p-1 border-r">
                                <p className="text-[10px]">Buyer's Order No. (PO Ref)</p>
                                <p className="font-bold">{order.id.split('-')[0].toUpperCase()}</p>
                            </td>
                            <td className="w-1/4 border border-black p-1 border-r-0">
                                <p className="text-[10px]">Payment Due Date</p>
                                <p className="font-bold">{bill.dueDate ? format(new Date(bill.dueDate), "dd-MMM-yyyy") : "-"}</p>
                            </td>
                        </tr>

                        {/* Row 3 */}
                        <tr className="align-top">
                            <td className="w-1/4 border border-black p-1 border-r">
                                <p className="text-[10px]">Delivery Note</p>
                                <p className="font-bold">-</p>
                            </td>
                            <td className="w-1/4 border border-black p-1 border-r-0">
                                <p className="text-[10px]">Mode/Terms of Payment</p>
                                <p className="font-bold">-</p>
                            </td>
                        </tr>

                        {/* Row 4: Buyer (Atlas) */}
                        <tr className="align-top">
                            <td className="w-1/2 border border-black p-1 px-2 border-r-2" rowSpan={3}>
                                <p className="text-[10px] underline mb-1">Buyer (Bill To)</p>
                                <p className="font-bold text-[13px]">{atlasDetails.name}</p>
                                <p>{atlasDetails.address}</p>
                                <p>State Name: {atlasDetails.stateName}, Code: {atlasDetails.stateCode}</p>
                                <p>GSTIN/UIN: {atlasDetails.gstin}</p>
                                <p>Contact: {atlasDetails.phone}</p>
                                <p>E-Mail: {atlasDetails.email}</p>
                            </td>
                            <td className="w-1/4 border border-black p-1 border-r">
                                <p className="text-[10px]">Dispatch Doc No.</p>
                                <p className="font-bold">-</p>
                            </td>
                            <td className="w-1/4 border border-black p-1 border-r-0">
                                <p className="text-[10px]">Delivery Note Date</p>
                                <p className="font-bold">-</p>
                            </td>
                        </tr>

                        <tr className="align-top">
                            <td className="w-1/4 border border-black p-1 border-r">
                                <p className="text-[10px]">Dispatched through</p>
                                <p className="font-bold">Road Transport</p>
                            </td>
                            <td className="w-1/4 border border-black p-1 border-r-0">
                                <p className="text-[10px]">Destination</p>
                                <p className="font-bold">Khamgaon</p>
                            </td>
                        </tr>

                        <tr className="align-top">
                            <td colSpan={2} className="w-1/2 border border-black p-1 border-r-0">
                                <p className="text-[10px]">Terms of Delivery</p>
                                <p className="font-bold">-</p>
                            </td>
                        </tr>

                        {/* Main Items Table Header */}
                        <tr className="bg-gray-50 align-top">
                            <td colSpan={3} className="p-0 border-0">
                                <table className="w-full border-collapse h-[350px]">
                                    <thead>
                                        <tr className="text-center font-bold">
                                            <td className="border border-black border-l-0 p-1 w-10">Sl<br />No.</td>
                                            <td className="border border-black p-1 w-64 text-left px-2">Description of Goods</td>
                                            <td className="border border-black p-1 w-20">HSN/SAC</td>
                                            <td className="border border-black p-1 w-24">Quantity</td>
                                            <td className="border border-black p-1 w-20">Rate (₹)</td>
                                            <td className="border border-black p-1 w-12">per</td>
                                            <td className="border border-black border-r-0 p-1 w-32">Amount</td>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {/* Item Row 1 */}
                                        <tr className="align-top h-[180px]">
                                            <td className="border-r border-black p-1 px-2">1</td>
                                            <td className="border-r border-black p-1 text-left font-bold px-2">
                                                {order.project.commodity ? order.project.commodity.name : order.project.name}
                                            </td>
                                            <td className="border-r border-black p-1 px-2 font-bold">123456</td>
                                            <td className="border-r border-black p-1 font-bold text-right px-2">{quantity > 0 ? quantity : '-'}</td>
                                            <td className="border-r border-black p-1 font-bold text-right px-2">{quantity > 0 ? impliedRate.toFixed(2) : '-'}</td>
                                            <td className="border-r border-black p-1 font-bold text-center">
                                                {quantity > 0 ? (quantityUnit === 'MT' ? 'KG' : quantityUnit) : '-'}
                                            </td>
                                            <td className="border-r-0 border-black p-1 font-bold text-right px-2">{formattedTaxable}</td>
                                        </tr>

                                        {/* Subtotal Row */}
                                        <tr className="align-bottom">
                                            <td className="border-r border-black border-t p-1"></td>
                                            <td className="border-r border-black border-t p-1 text-right font-bold px-2">Taxable Value</td>
                                            <td className="border-r border-black border-t p-1"></td>
                                            <td className="border-r border-black border-t p-1 text-right font-bold px-2">{quantity > 0 ? `${quantity} ${quantityUnit}` : ''}</td>
                                            <td className="border-r border-black border-t p-1"></td>
                                            <td className="border-r border-black border-t p-1"></td>
                                            <td className="border-r-0 border-black border-t p-1 text-right font-bold px-2">{formattedTaxable}</td>
                                        </tr>

                                        {/* CGST Row */}
                                        <tr className="align-bottom">
                                            <td colSpan={6} className="border-r border-black p-1 text-right font-bold px-4">CGST 2.5%</td>
                                            <td className="border-r-0 border-black p-1 text-right font-bold px-2">{cgst}</td>
                                        </tr>

                                        {/* SGST Row */}
                                        <tr className="align-bottom">
                                            <td colSpan={6} className="border-r border-black p-1 text-right font-bold px-4">SGST 2.5%</td>
                                            <td className="border-r-0 border-black p-1 text-right font-bold px-2">{sgst}</td>
                                        </tr>

                                        {/* Final Total */}
                                        <tr className="align-bottom border-t-2 border-black border-b-2">
                                            <td colSpan={6} className="border-r border-black p-1 text-right font-bold px-4">Total</td>
                                            <td className="border-r-0 border-black p-1 text-right font-bold px-2">₹ {formattedFinalTotal}</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </td>
                        </tr>

                        {/* Amount in words and Amount Chargeable */}
                        <tr>
                            <td colSpan={3} className="border border-black border-b-2 p-1 px-2 border-r-0 border-l-0 border-t-2 flex justify-between">
                                <div>
                                    <p className="text-[10px]">Amount Chargeable (in words)</p>
                                    <p className="font-bold underline tracking-wide">
                                        INR {numberToWords(finalTotalAmount)} Only
                                    </p>
                                </div>
                                <div className="text-right italic">
                                    E. & O.E
                                </div>
                            </td>
                        </tr>

                        {/* Bottom Signature Section */}
                        <tr className="h-28 align-top">
                            <td className="w-1/2 border border-black p-1 px-2 border-l-0 border-b-0" rowSpan={1}>
                                <p className="text-[10px] underline mb-1">Company's VAT / TIN Details</p>
                                <p className="text-[10px] mt-2 underline mb-1">Declaration</p>
                                <p className="text-[10px]">We declare that this invoice shows the actual price of the goods described and that all particulars are true and correct.</p>
                            </td>
                            <td className="w-1/2 border border-black p-1 px-2 text-right relative border-r-0 border-b-0" colSpan={2}>
                                <p className="font-bold text-[12px] mt-1">For {vendor.name}</p>
                                <div className="absolute bottom-2 right-2 flex flex-col items-end">
                                    <p className="text-[11px] mb-8 font-serif italic text-gray-500">Signatory Component</p>
                                    <p className="font-semibold underline">Authorised Signatory</p>
                                </div>
                            </td>
                        </tr>
                    </tbody>
                </table>

                <p className="text-center text-[9px] mt-2 text-gray-600">This is a Computer Generated Document</p>
            </div>
        </div>
    );
}
