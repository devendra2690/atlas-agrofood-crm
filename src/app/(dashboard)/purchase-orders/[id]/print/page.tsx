import { notFound } from "next/navigation";
import { format } from "date-fns";
import { getPurchaseOrder } from "@/app/actions/procurement";
import { atlasLogoBase64 } from "@/lib/logo-base64";
import { PrintButton } from "@/components/ui/print-button";

export default async function PurchaseOrderPrintPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const result = await getPurchaseOrder(id);

    if (!result.success || !result.data) {
        notFound();
    }

    const order = result.data;
    const buyerDetails = {
        name: "Atlas AgroFood",
        address: "SN-115, Plot : 56, Gajanan Colony, Khamgaon, District Buldhana, Maharashtra 444303",
        stateName: "Maharashtra",
        stateCode: "27",
        gstin: "27ABECA8433F1ZP",
        phone: "+91 70583 89496",
        email: "sales@atlasagrofood.co.in"
    };

    const taxableAmount = Number(order.totalAmount);

    const formattedTaxable = taxableAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    const cgstValue = taxableAmount * 0.025;
    const sgstValue = taxableAmount * 0.025;
    const finalTotalAmount = taxableAmount + cgstValue + sgstValue;

    const cgst = cgstValue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const sgst = sgstValue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const formattedFinalTotal = finalTotalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    // Simple integer-to-words for Indian numbering system
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

    return (
        <div className="p-4 max-w-[210mm] mx-auto bg-white min-h-[297mm] text-black print:p-8 font-sans text-[11px] leading-snug relative">
            <title>PO-{order.id.substring(0, 8).toUpperCase()} - {order.vendor.name}</title>
            <PrintButton />

            {/* Background Watermark */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden z-0 opacity-10">
                <img src={atlasLogoBase64} alt="Watermark Logo" className="w-[400px] h-auto object-contain grayscale" />
            </div>

            <div className="relative z-10">
                <h1 className="text-center font-bold text-lg underline mb-2 tracking-wide">PURCHASE ORDER</h1>

                <table className="w-full border-collapse border-2 border-black">
                    <tbody>
                        {/* Row 1: Split Left (Buyer) / Right (Invoice Info grid) */}
                        <tr className="align-top">
                            {/* LEFT COLUMN: Buyer Details. rowSpan=2 to match right side splits */}
                            <td className="w-1/2 border border-black p-1 px-2 border-r-2" rowSpan={3}>
                                <p className="font-bold text-[13px]">{buyerDetails.name}</p>
                                <p>{buyerDetails.address}</p>
                                <p>State Name: {buyerDetails.stateName}, Code: {buyerDetails.stateCode}</p>
                                <p>GSTIN/UIN: {buyerDetails.gstin}</p>
                                <p>Contact: {buyerDetails.phone}</p>
                                <p>E-Mail: {buyerDetails.email}</p>
                            </td>

                            {/* RIGHT GRID TOP: Invoice No & Date */}
                            <td className="w-1/4 border border-black p-1 border-r">
                                <p className="text-[10px]">PO No.</p>
                                <p className="font-bold">{order.id.split('-')[0].toUpperCase()}</p>
                            </td>
                            <td className="w-1/4 border border-black p-1 border-r-0">
                                <p className="text-[10px]">Date</p>
                                <p className="font-bold">{format(new Date(order.createdAt), "dd-MMM-yyyy")}</p>
                            </td>
                        </tr>

                        {/* Row 2: Delivery & Terms */}
                        <tr className="align-top">
                            <td className="w-1/4 border border-black p-1 border-r">
                                <p className="text-[10px]">Delivery Note</p>
                                <p className="font-bold">-</p>
                            </td>
                            <td className="w-1/4 border border-black p-1 border-r-0">
                                <p className="text-[10px]">Mode/Terms of Payment</p>
                                <p className="font-bold">100% advance</p>
                            </td>
                        </tr>

                        {/* Row 3: Reference & Order No */}
                        <tr className="align-top">
                            <td className="w-1/4 border border-black p-1 border-r">
                                <p className="text-[10px]">Supplier's Ref.</p>
                                <p className="font-bold">-</p>
                            </td>
                            <td className="w-1/4 border border-black p-1 border-r-0">
                                <p className="text-[10px]">Other Reference(s)</p>
                                <p className="font-bold">-</p>
                            </td>
                        </tr>

                        {/* Row 4: Consignee (Ship To) / Dispatch details */}
                        <tr className="align-top">
                            <td className="w-1/2 border border-black p-1 px-2 border-r-2" rowSpan={3}>
                                <p className="text-[10px] underline mb-1">Consignee (Ship To)</p>
                                <p className="font-bold text-[13px]">{buyerDetails.name}</p>
                                <p>Warehouse No. 4</p>
                                <p>{buyerDetails.address}</p>
                                <p>State Name: {buyerDetails.stateName}, Code: {buyerDetails.stateCode}</p>
                                <p>GSTIN/UIN: {buyerDetails.gstin}</p>
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

                        {/* Row 6: Supplier (Bill From) & Terms of Delivery */}
                        <tr className="align-top">
                            <td className="w-1/4 border border-black p-1 border-r-0" colSpan={2} rowSpan={2}>
                                <p className="text-[10px]">Terms of Delivery</p>
                                <p className="font-bold mt-1">Delivery Charges at Actual.</p>
                            </td>
                        </tr>

                        {/* Row 7: Supplier Box overlaps left side */}
                        <tr className="align-top">
                            <td className="border border-black p-2 align-top h-[120px]">
                                <p className="font-bold text-sm mb-1">Supplier (Vendor)</p>
                                <p className="font-bold uppercase">{order.vendor.name}</p>
                                {order.vendor.address && <p className="whitespace-pre-line leading-tight text-[11px] mt-1">{order.vendor.address}</p>}
                                <p className="text-[11px] mt-1">{[order.vendor.city?.name, order.vendor.state?.name, order.vendor.country?.name].filter(Boolean).join(", ")}</p>
                                {order.vendor.gstNumber && <p className="mt-1 text-[11px]"><span className="font-semibold">GSTIN/UIN:</span> {order.vendor.gstNumber}</p>}
                                {order.vendor.phone && <p className="text-[11px]">Contact: {order.vendor.phone}</p>}
                                {order.vendor.email && <p className="text-[11px]">Email: {order.vendor.email}</p>}
                            </td>
                        </tr>
                    </tbody>
                </table>

                {/* Items Table - Strict Column Grid */}
                <table className="w-full border-collapse border border-black border-t-0 text-center">
                    <thead>
                        <tr className="border-b-2 border-black">
                            <th className="border border-black p-1 w-[4%]" rowSpan={2}>Sl<br />No.</th>
                            <th className="border border-black p-1 text-left px-2 w-[34%]" rowSpan={2}>Description of Goods</th>
                            <th className="border border-black p-1 w-[10%]" rowSpan={2}>HSN/SAC</th>
                            <th className="border border-black p-1 w-[6%]" rowSpan={2}>Qty</th>
                            <th className="border border-black p-1 w-[8%]" rowSpan={2}>Rate (₹)</th>
                            <th className="border border-black p-1 w-[6%]" rowSpan={2}>Unit</th>
                            <th className="border border-black p-1 w-[18%]" colSpan={3}>GST</th>
                            <th className="border border-black p-1 w-[14%]" rowSpan={2}>Amount<br /><span className="text-[9px] font-normal">(Excl. of GST)</span></th>
                        </tr>
                        <tr className="border-b-2 border-black">
                            <th className="border border-black p-1 w-[6%] text-[10px]">CGST</th>
                            <th className="border border-black p-1 w-[6%] text-[10px]">SGST</th>
                            <th className="border border-black p-1 w-[6%] text-[10px] bg-slate-100">IGST</th>
                        </tr>
                    </thead>
                    <tbody>
                        {/* Map over items */}
                        {((order as any).items || []).map((item: any, index: number) => {
                            const commodityName = item.commodity?.name || order.project?.commodity?.name || order.project.name;
                            const itemQty = Number(item.quantity) || 0;
                            const itemRate = Number(item.rate) || 0;
                            const itemAmount = Number(item.amount) || 0;

                            return (
                                <tr key={item.id || index} className="align-top border-b border-black/10">
                                    <td className="border-r border-black p-1 px-2">{index + 1}</td>
                                    <td className="border-r border-black p-1 text-left px-2">
                                        <span className="font-bold text-[13px]">{commodityName}</span>
                                    </td>
                                    <td className="border-r border-black p-1 px-2 font-bold">-</td>
                                    <td className="border-r border-black p-1 font-bold">{itemQty > 0 ? itemQty : '-'}</td>
                                    <td className="border-r border-black p-1 font-bold">{itemQty > 0 ? itemRate.toFixed(2) : '-'}</td>
                                    <td className="border-r border-black p-1">{itemQty > 0 ? (item.quantityUnit || 'MT') : '-'}</td>
                                    <td className="border-r border-black p-1">0%</td>
                                    <td className="border-r border-black p-1">0%</td>
                                    <td className="border-r border-black p-1 bg-slate-100"></td>
                                    <td className="border-r-0 border-black p-1 font-bold text-right px-2">{itemAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                </tr>
                            );
                        })}

                        {/* Filler row to push footer down if items list is small */}
                        <tr className="align-top h-[150px]">
                            <td className="border-r border-black p-1 px-2"></td>
                            <td className="border-r border-black p-1 text-left px-2"></td>
                            <td className="border-r border-black p-1 px-2 font-bold"></td>
                            <td className="border-r border-black p-1 font-bold"></td>
                            <td className="border-r border-black p-1 font-bold"></td>
                            <td className="border-r border-black p-1"></td>
                            <td className="border-r border-black p-1"></td>
                            <td className="border-r border-black p-1"></td>
                            <td className="border-r border-black p-1 bg-slate-100"></td>
                            <td className="border-r-0 border-black p-1 font-bold text-right px-2"></td>
                        </tr>

                        {/* Subtotal Row */}
                        <tr className="border-t border-black font-bold align-bottom">
                            <td className="border-r border-black border-t p-1"></td>
                            <td className="border-r border-black border-t p-1 text-right px-2">Taxable Value</td>
                            <td className="border-r border-black border-t p-1"></td>
                            <td className="border-r border-black border-t p-1 text-right px-2">{parseFloat((((order as any).items || []).reduce((sum: number, it: any) => sum + Number(it.quantity), 0) as number).toFixed(3)).toString()} MT</td>
                            <td className="border-r border-black border-t p-1"></td>
                            <td className="border-r border-black border-t p-1"></td>
                            <td colSpan={3} className="border-r border-black border-t p-1 text-right px-4"></td>
                            <td className="border-r-0 border-black border-t p-1 text-right px-2 whitespace-nowrap">₹ {formattedTaxable}</td>
                        </tr>

                        {/* SGST / CGST Rows (blank for now, matching tally lines) */}
                        <tr className="border-t border-black font-bold text-[10px]">
                            <td colSpan={9} className="border-r border-black p-1 text-right px-4">CGST 2.5%</td>
                            <td className="border-r-0 border-black p-1 text-right px-2 whitespace-nowrap">₹ {cgst}</td>
                        </tr>
                        <tr className="border-t border-black font-bold text-[10px]">
                            <td colSpan={9} className="border-r border-black p-1 text-right px-4">SGST 2.5%</td>
                            <td className="border-r-0 border-black p-1 text-right px-2 whitespace-nowrap">₹ {sgst}</td>
                        </tr>

                        {/* Final Totals */}
                        <tr className="border-t-2 border-black border-b-2 font-bold text-[12px]">
                            <td colSpan={9} className="border-r border-black p-2 text-right px-4">Total</td>
                            <td className="border-r-0 border-black p-2 text-right px-2 whitespace-nowrap">₹ {formattedFinalTotal}</td>
                        </tr>
                    </tbody>
                </table>

                {/* Amount In Words Footer */}
                <table className="w-full border-collapse border border-black border-t-0">
                    <tbody>
                        <tr className="align-top">
                            <td className="border-r-2 border-black w-[60%] p-2">
                                <p className="text-[10px]">Amount Chargeable (in words)</p>
                                <p className="font-bold tracking-tight">INR {numberToWords(finalTotalAmount)} Only</p>

                                <div className="mt-8 text-[10px]">
                                    <p className="font-bold underline">Declaration</p>
                                    <p>We declare that this invoice shows the actual price of the goods described and that all particulars are true and correct.</p>
                                </div>
                            </td>
                            <td className="w-[40%] text-right p-2 flex flex-col justify-between items-end h-[100px]">
                                <p className="font-bold text-[10px]">for Atlas AgroFood</p>
                                <p className="font-bold mt-auto pt-16">Authorised Signatory</p>
                            </td>
                        </tr>
                    </tbody>
                </table>

                <p className="text-center text-[9px] mt-2 text-gray-600">This is a Computer Generated Document</p>
            </div>
        </div>
    );
}
