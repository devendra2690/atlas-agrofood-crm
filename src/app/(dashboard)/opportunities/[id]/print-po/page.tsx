import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { format } from "date-fns";
import { atlasLogoBase64 } from "@/lib/logo-base64";
import { PrintButton } from "@/components/ui/print-button";

export default async function PrintOpportunityPOPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;

    const opportunity = await prisma.salesOpportunity.findUnique({
        where: { id },
        include: {
            company: true,
            items: true,
        }
    });

    if (!opportunity) {
        notFound();
    }

    let taxableAmount = 0;
    opportunity.items.forEach(item => {
        const qtyMT = item.quantity ? Number(item.quantity) : 0;
        const price = item.targetPrice ? Number(item.targetPrice) : 0;

        let amount = 0;
        if (item.priceType === 'TOTAL_AMOUNT') {
            amount = price;
        } else if (item.priceType === 'PER_KG') {
            amount = (qtyMT * 1000) * price;
        } else {
            amount = qtyMT * price;
        }
        taxableAmount += amount;
    });

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

    const amountInWords = `INR ${numberToWords(Math.round(finalTotalAmount))} Only`;

    return (
        <div className="p-4 max-w-[210mm] mx-auto bg-white min-h-[297mm] text-black print:p-8 font-sans text-[11px] leading-snug relative">
            <PrintButton />
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden z-0 opacity-10">
                <img src={atlasLogoBase64} alt="Watermark Logo" className="w-[400px] h-auto object-contain grayscale" />
            </div>

            <div className="relative z-10">
                <h1 className="text-center font-bold text-lg underline mb-2 tracking-wide">PROFORMA INVOICE</h1>
                <table className="w-full border-collapse border border-black mb-0">
                    <tbody>
                        <tr className="align-top">
                            <td className="border-r border-black w-1/2 p-2">
                                <p className="font-bold text-[12px] uppercase">Atlas AgroFood</p>
                                <p className="whitespace-pre-line">{`SN-115, Plot : 56, Gajanan Colony, Khamgaon,\nDistrict Buldhana, Maharashtra 444303`}</p>
                                <p className="mt-1"><span className="font-semibold">GSTIN/UIN:</span> 27ABECA8433F1ZP</p>
                                <p><span className="font-semibold">State Name:</span> Maharashtra, <span className="font-semibold">Code:</span> 27</p>
                                <p><span className="font-semibold">Contact:</span> +91 70583 89496</p>
                                <p><span className="font-semibold">Email:</span> contact@atlasagrofood.com</p>
                            </td>
                            <td className="p-0 w-1/2 align-top">
                                <table className="w-full h-full border-collapse">
                                    <tbody>
                                        <tr>
                                            <td className="border-b border-black p-2 h-[45px] border-r">
                                                <span className="font-semibold block">Invoice No.</span>
                                                <span className="font-bold">PI-OPP-{opportunity.id.substring(0, 8).toUpperCase()}</span>
                                            </td>
                                            <td className="border-b border-black p-2">
                                                <span className="font-semibold block">Dated</span>
                                                <span className="font-bold">{format(new Date(), 'dd-MMM-yyyy')}</span>
                                            </td>
                                        </tr>
                                        <tr>
                                            <td className="p-2 h-[45px] border-r border-black">
                                                <span className="font-semibold block">Destination</span>
                                                <span>As per terms</span>
                                            </td>
                                            <td className="p-2">
                                                <span className="font-semibold block">Terms of Payment</span>
                                                <span>Advance</span>
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </td>
                        </tr>
                        <tr>
                            <td className="border-t border-r border-black p-2 align-top h-[100px]">
                                <p className="font-semibold text-[10px]">Buyer (Bill to)</p>
                                <p className="font-bold uppercase text-[12px]">{opportunity.company.name}</p>
                                {opportunity.company.address && <p className="text-[11px] whitespace-pre-line leading-tight mt-1">{opportunity.company.address}</p>}
                                {opportunity.company.gstNumber && <p className="mt-1 text-[11px]"><span className="font-semibold">GSTIN/UIN:</span> {opportunity.company.gstNumber}</p>}
                            </td>
                            <td className="border-t border-black p-2 align-top">
                                <p className="font-semibold text-[10px]">Consignee (Ship to)</p>
                                <p className="font-bold uppercase text-[12px]">{opportunity.company.name}</p>
                                {opportunity.company.address && <p className="text-[11px] whitespace-pre-line leading-tight mt-1">{opportunity.company.address}</p>}
                                {opportunity.company.gstNumber && <p className="mt-1 text-[11px]"><span className="font-semibold">GSTIN/UIN:</span> {opportunity.company.gstNumber}</p>}
                            </td>
                        </tr>
                    </tbody>
                </table>

                <table className="w-full border-collapse border border-black border-t-0">
                    <thead>
                        <tr className="text-center font-bold">
                            <td className="border-r border-black border-b p-1 w-10">Sl No.</td>
                            <td className="border-r border-black border-b p-1 w-64 text-left px-2">Description of Goods</td>
                            <td className="border-r border-black border-b p-1 w-20">HSN/SAC</td>
                            <td className="border-r border-black border-b p-1 w-24">Quantity</td>
                            <td className="border-r border-black border-b p-1 w-20">Rate</td>
                            <td className="border-r border-black border-b p-1 w-12">per</td>
                            <td className="border-r border-black border-b p-1 w-24">Amount</td>
                        </tr>
                    </thead>
                    <tbody>
                        {opportunity.items.map((item, index) => {
                            const qtyMT = item.quantity ? Number(item.quantity) : 0;
                            const price = item.targetPrice ? Number(item.targetPrice) : 0;

                            let amount = 0;
                            let displayQty = qtyMT;
                            let unitStr = "MT";

                            if (item.priceType === 'TOTAL_AMOUNT') {
                                amount = price;
                                unitStr = "-";
                                displayQty = 0;
                            } else if (item.priceType === 'PER_KG') {
                                displayQty = qtyMT * 1000;
                                amount = displayQty * price;
                                unitStr = "KG";
                            } else {
                                displayQty = qtyMT;
                                amount = displayQty * price;
                                unitStr = "MT";
                            }

                            return (
                                <tr key={item.id} className="align-top h-[180px]">
                                    <td className="border-r border-black p-1 px-2">{index + 1}</td>
                                    <td className="border-r border-black p-1 text-left font-bold px-2">
                                        {item.productName || "Product Item"}
                                    </td>
                                    <td className="border-r border-black p-1 px-2 font-bold">123456</td>
                                    <td className="border-r border-black p-1 font-bold text-right px-2">
                                        {item.priceType === 'TOTAL_AMOUNT' ? '-' : displayQty}
                                    </td>
                                    <td className="border-r border-black p-1 font-bold text-right px-2">
                                        {item.priceType === 'TOTAL_AMOUNT' ? '-' : price.toFixed(2)}
                                    </td>
                                    <td className="border-r border-black p-1 font-bold text-center">
                                        {unitStr}
                                    </td>
                                    <td className="border-r-0 border-black p-1 font-bold text-right px-2 whitespace-nowrap">
                                        ₹ {amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </td>
                                </tr>
                            );
                        })}

                        <tr className="border-t border-black font-bold align-bottom">
                            <td colSpan={6} className="border-r border-black border-t p-1 text-right px-4">Taxable Value</td>
                            <td className="border-r-0 border-black border-t p-1 text-right px-2 whitespace-nowrap">₹ {formattedTaxable}</td>
                        </tr>

                        <tr className="border-t border-black font-bold text-[10px]">
                            <td colSpan={6} className="border-r border-black p-1 text-right px-4">CGST 2.5%</td>
                            <td className="border-r-0 border-black p-1 text-right px-2 whitespace-nowrap">₹ {cgst}</td>
                        </tr>
                        <tr className="border-t border-black font-bold text-[10px]">
                            <td colSpan={6} className="border-r border-black p-1 text-right px-4">SGST 2.5%</td>
                            <td className="border-r-0 border-black p-1 text-right px-2 whitespace-nowrap">₹ {sgst}</td>
                        </tr>

                        <tr className="border-t-2 border-black border-b-2 font-bold text-[12px]">
                            <td colSpan={6} className="border-r border-black p-2 text-right px-4">Total</td>
                            <td className="border-r-0 border-black p-2 text-right px-2 whitespace-nowrap">₹ {formattedFinalTotal}</td>
                        </tr>
                        <tr className="border-b-2 border-black font-semibold text-[11px] bg-slate-50 italic">
                            <td colSpan={7} className="p-2 text-left px-4">Amount Chargeable (in words): {amountInWords}</td>
                        </tr>
                    </tbody>
                </table>
                <table className="w-full border-collapse border border-black border-t-0">
                    <tbody>
                        <tr className="align-top">
                            <td className="w-[60%] p-2">
                                <p className="font-bold tracking-tight">Final Amount: ₹ {formattedFinalTotal}</p>
                                <p className="font-semibold italic text-[10px] mt-1">{amountInWords}</p>
                                <div className="mt-8 text-[10px]">
                                    <p className="font-bold underline">Declaration</p>
                                    <p>We declare that this invoice shows the actual price of the goods described and that all particulars are true and correct.</p>
                                </div>
                            </td>
                            <td className="border-l border-black p-2 text-right align-bottom h-28">
                                <p className="font-bold mb-12">for Atlas AgroFood</p>
                                <p className="font-semibold">Authorised Signatory</p>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    );
}
