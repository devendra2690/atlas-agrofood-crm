import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { format } from "date-fns";
import { atlasLogoBase64 } from "@/lib/logo-base64";
import { PrintButton } from "@/components/ui/print-button";

export default async function PrintInvoicePage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;

    const invoice = await prisma.invoice.findUnique({
        where: { id },
        include: {
            items: {
                include: {
                    opportunityItem: {
                        include: {
                            commodity: true,
                            varietyForm: true
                        }
                    }
                }
            },
            salesOrder: {
                include: {
                    client: true,
                    opportunity: {
                        include: {
                            items: {
                                include: {
                                    commodity: true,
                                    varietyForm: true
                                }
                            }
                        }
                    }
                }
            }
        }
    });

    if (!invoice) {
        notFound();
    }

    const { salesOrder } = invoice;
    const { opportunity, client } = salesOrder;

    let itemsToRender = invoice.items || [];

    // Fallback for legacy invoices generated before InvoiceItem schema existed
    if (itemsToRender.length === 0 && opportunity?.items) {
        itemsToRender = opportunity.items.map((optItem: any) => {
            const qty = optItem.quantity ? Number(optItem.quantity) : 0;
            const price = optItem.targetPrice ? Number(optItem.targetPrice) : 0;
            let amount = 0;
            if (optItem.priceType === 'PER_KG') {
                amount = price * qty * 1000;
            } else if (optItem.priceType === 'TOTAL_AMOUNT') {
                amount = price;
            } else {
                amount = price * qty;
            }
            return {
                id: `legacy-${optItem.id}`,
                invoiceId: invoice.id,
                opportunityItemId: optItem.id,
                quantity: qty,
                rate: price,
                amount: amount,
                opportunityItem: optItem
            } as any;
        });
    }

    let taxableAmount = 0;
    itemsToRender.forEach((invItem: any) => {
        taxableAmount += invItem.amount ? Number(invItem.amount) : 0;
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
                <h1 className="text-center font-bold text-lg underline mb-2 tracking-wide">TAX INVOICE</h1>
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
                                                <span className="font-bold">INV-{invoice.id.substring(0, 8).toUpperCase()}</span>
                                            </td>
                                            <td className="border-b border-black p-2">
                                                <span className="font-semibold block">Dated</span>
                                                <span className="font-bold">{format(invoice.createdAt, 'dd-MMM-yyyy')}</span>
                                            </td>
                                        </tr>
                                        <tr>
                                            <td className="p-2 h-[45px] border-r border-black">
                                                <span className="font-semibold block">Delivery Note</span>
                                                <span className="font-bold"></span>
                                            </td>
                                            <td className="p-2">
                                                <span className="font-semibold block">Mode/Terms of Payment</span>
                                                <span className="font-bold"></span>
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </td>
                        </tr>
                        <tr>
                            <td className="border-t border-r border-black p-2 align-top h-[100px]">
                                <p className="font-semibold text-[10px]">Buyer (Bill to)</p>
                                <p className="font-bold uppercase text-[12px]">{client.name}</p>
                                {client.address && <p className="text-[11px] whitespace-pre-line leading-tight mt-1">{client.address}</p>}
                                {client.gstNumber && <p className="mt-1 text-[11px]"><span className="font-semibold">GSTIN/UIN:</span> {client.gstNumber}</p>}
                            </td>
                            <td className="border-t border-black p-2 align-top">
                                <p className="font-semibold text-[10px]">Consignee (Ship to)</p>
                                <p className="font-bold uppercase text-[12px]">{client.name}</p>
                                {client.address && <p className="text-[11px] whitespace-pre-line leading-tight mt-1">{client.address}</p>}
                                {client.gstNumber && <p className="mt-1 text-[11px]"><span className="font-semibold">GSTIN/UIN:</span> {client.gstNumber}</p>}
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
                        {itemsToRender.map((invItem: any, index: number) => {
                            const item = invItem.opportunityItem;
                            const qtyMT = invItem.quantity ? Number(invItem.quantity) : 0;
                            const price = invItem.rate ? Number(invItem.rate) : 0;
                            const amount = invItem.amount ? Number(invItem.amount) : 0;

                            let displayQty = qtyMT;
                            let unitStr = "MT";

                            if (item.priceType === 'TOTAL_AMOUNT') {
                                unitStr = "-";
                                displayQty = 0;
                            } else if (item.priceType === 'PER_KG') {
                                displayQty = qtyMT * 1000;
                                unitStr = "KG";
                            }

                            return (
                                <tr key={invItem.id} className="align-top h-8">
                                    <td className="border-r border-black p-1 text-center">{index + 1}</td>
                                    <td className="border-r border-black p-1 px-2 font-bold">
                                        {item.commodity?.name || "Item"}
                                        {item.varietyForm?.formName && <span className="font-normal text-xs ml-1">({item.varietyForm.formName})</span>}
                                    </td>
                                    <td className="border-r border-black p-1 text-center">{/* HSN */}</td>
                                    <td className="border-r border-black p-1 text-right font-bold">
                                        {displayQty > 0 ? displayQty.toLocaleString('en-IN', { maximumFractionDigits: 3 }) : ""} {displayQty > 0 ? unitStr : ""}
                                    </td>
                                    <td className="border-r border-black p-1 text-right">{price.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                                    <td className="border-r border-black p-1 text-center">{unitStr}</td>
                                    <td className="border-r border-black p-1 text-right font-bold">{amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                                </tr>
                            );
                        })}

                        {/* Filler row to stretch the table height */}
                        <tr className="align-top h-auto border-black">
                            <td className="border-r border-black p-1 text-center border-t-transparent pt-4 min-h-[100px]"></td>
                            <td className="border-r border-black p-1 px-2 border-t-transparent text-[9px] italic pt-4"></td>
                            <td className="border-r border-black p-1 text-center border-t-transparent pt-4"></td>
                            <td className="border-r border-black p-1 text-right border-t-transparent pt-4"></td>
                            <td className="border-r border-black p-1 text-right border-t-transparent pt-4"></td>
                            <td className="border-r border-black p-1 text-center border-t-transparent pt-4"></td>
                            <td className="border-r border-black p-1 text-right border-t-transparent pt-4"></td>
                        </tr>

                        <tr className="border-t border-black font-semibold">
                            <td className="border-r border-black border-t-transparent p-1"></td>
                            <td className="border-r border-black border-t-transparent p-1 text-right px-4"></td>
                            <td className="border-r border-black border-t-transparent p-1"></td>
                            <td className="border-r border-black border-t-transparent p-1"></td>
                            <td className="border-r border-black border-t-transparent p-1 text-center italic"></td>
                            <td className="border-r border-black border-t-transparent p-1"></td>
                            <td className="border-r border-black border-t-transparent p-1 text-right">{formattedTaxable}</td>
                        </tr>

                        <tr className="border-t border-black font-semibold">
                            <td className="border-r border-black border-t-transparent p-1"></td>
                            <td className="border-r border-black border-t-transparent p-1 text-right px-4">CGST</td>
                            <td className="border-r border-black border-t-transparent p-1"></td>
                            <td className="border-r border-black border-t-transparent p-1"></td>
                            <td className="border-r border-black border-t-transparent p-1 text-center italic">2.5%</td>
                            <td className="border-r border-black border-t-transparent p-1"></td>
                            <td className="border-r border-black border-t-transparent p-1 text-right">{cgst}</td>
                        </tr>

                        <tr className="border-t border-black font-semibold">
                            <td className="border-r border-black border-t-transparent p-1"></td>
                            <td className="border-r border-black border-t-transparent p-1 text-right px-4">SGST</td>
                            <td className="border-r border-black border-t-transparent p-1"></td>
                            <td className="border-r border-black border-t-transparent p-1"></td>
                            <td className="border-r border-black border-t-transparent p-1 text-center italic">2.5%</td>
                            <td className="border-r border-black border-t-transparent p-1"></td>
                            <td className="border-r border-black border-t-transparent p-1 text-right">{sgst}</td>
                        </tr>

                        <tr className="border-t border-black font-bold">
                            <td className="border-r border-black p-1 border-t-transparent"></td>
                            <td className="border-r border-black p-1 text-right px-4 align-middle">Total</td>
                            <td className="border-r border-black p-1 border-t-transparent"></td>
                            <td className="border-r border-black p-1 border-t-transparent"></td>
                            <td className="border-r border-black p-1 border-t-transparent"></td>
                            <td className="border-r border-black p-1 border-t-transparent"></td>
                            <td className="border-r border-black p-1 text-right align-middle text[12px]">{formattedFinalTotal}</td>
                        </tr>
                    </tbody>
                </table>

                <div className="border border-black border-t-0 p-2 text-[10px]">
                    <span className="font-semibold block">Amount Chargeable (in words)</span>
                    <span className="font-bold">{amountInWords}</span>
                </div>

                <div className="flex border-x border-b border-black">
                    <div className="w-1/2 p-2 border-r border-black text-[10px]">
                        <p className="font-semibold underline">Declaration</p>
                        <p>We declare that this invoice shows the actual price of the goods described and that all particulars are true and correct.</p>
                    </div>
                    <div className="w-1/2 flex flex-col items-end justify-between p-2">
                        <div className="font-bold text-[11px]">for Atlas AgroFood</div>
                        <div className="font-semibold text-[10px] mt-12 pr-4">Authorised Signatory</div>
                    </div>
                </div>

            </div>
        </div>
    );
}
