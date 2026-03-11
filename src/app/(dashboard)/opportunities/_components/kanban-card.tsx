import { useState, useEffect } from "react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Check, X, MoreHorizontal, PlusCircle, FileText } from "lucide-react";
import { updateSubmissionStatus } from "@/app/actions/sample";
import { createSalesOrder } from "@/app/actions/order";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { Calendar, FlaskConical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CollectSampleDialog } from "./collect-sample-dialog";

interface KanbanCardProps {
    opportunity: any;
    companies: any[];
    partners: any[];
    onClick?: () => void;
    onAttachSample?: () => void;
}

export function KanbanCard({ opportunity, companies, partners, onClick, onAttachSample }: KanbanCardProps) {
    const router = useRouter();
    const [optimisticSubmissions, setOptimisticSubmissions] = useState(opportunity.sampleSubmissions || []);

    // Sync with props when they change
    useEffect(() => {
        setOptimisticSubmissions(opportunity.sampleSubmissions || []);
    }, [opportunity.sampleSubmissions]);

    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: opportunity.id, data: { status: opportunity.status } });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    const handleStatusUpdate = async (submissionId: string, status: "CLIENT_APPROVED" | "CLIENT_REJECTED") => {
        // Optimistic update
        setOptimisticSubmissions((prev: any[]) => prev.map((sub: any) =>
            sub.id === submissionId ? { ...sub, status } : sub
        ));

        const toastId = toast.loading("Updating status...");
        try {
            const result = await updateSubmissionStatus(submissionId, status);
            if (result.success) {
                toast.success("Status updated", { id: toastId });
                router.refresh();
            } else {
                // Revert on failure
                setOptimisticSubmissions(opportunity.sampleSubmissions || []);
                toast.error("Failed to update status", { id: toastId });
            }
        } catch (error) {
            // Revert on error
            setOptimisticSubmissions(opportunity.sampleSubmissions || []);
            toast.error("An error occurred", { id: toastId });
        }
    };

    const [creatingOrder, setCreatingOrder] = useState(false);

    const calculateTotalValue = (items: any[]) => {
        if (!items || items.length === 0) return null;
        let total = 0;
        for (const item of items) {
            if (!item.targetPrice || !item.quantity) return null;
            const price = Number(item.targetPrice);
            const qty = Number(item.quantity);
            const qtyUnit = item.quantityUnit || 'MT';
            if (item.priceType === 'TOTAL_AMOUNT') {
                total += price;
            } else if (item.priceType === 'PER_KG') {
                const qtyInKG = qtyUnit === 'MT' ? (qty * 1000) : qty;
                total += price * qtyInKG;
            } else if (item.priceType === 'PER_MT') {
                const qtyInMT = qtyUnit === 'KG' ? (qty / 1000) : qty;
                total += price * qtyInMT;
            } else {
                return null;
            }
        }
        return total;
    };

    // Group submissions by product name
    const groupedSubmissions = optimisticSubmissions?.length > 0 ? optimisticSubmissions.reduce((acc: any, sub: any) => {
        const productName = sub.opportunityItem?.productName ||
            sub.sample?.project?.commodity?.name ||
            (opportunity.items?.length > 1 ? "Generic Sample (All Items)" : (opportunity.items?.[0]?.productName || sub.sample?.project?.name || "Sample"));
        if (!acc[productName]) {
            acc[productName] = [];
        }
        acc[productName].push(sub);
        return acc;
    }, {} as Record<string, any[]>) : null;

    const handleCreateOrder = async () => {
        setCreatingOrder(true);
        const toastId = toast.loading("Creating Sales Order...");
        try {
            const result = await createSalesOrder(opportunity.id);
            if (result.success) {
                toast.success("Sales Order Created!", { id: toastId });
                router.refresh();
            } else {
                toast.error(result.error || "Failed to create order", { id: toastId });
            }
        } catch (e) {
            toast.error("Failed to create order", { id: toastId });
        } finally {
            setCreatingOrder(false);
        }
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...attributes}
            {...listeners}
            className="touch-none"
            onClick={onClick}
            suppressHydrationWarning
        >
            <Card className="cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow group relative">
                <CardHeader className="p-3 pb-0 space-y-0">
                    <CardTitle
                        className="text-sm font-medium leading-none truncate"
                        title={opportunity.items?.map((i: any) => i.productName).join(', ')}
                    >
                        {opportunity.items && opportunity.items.length > 0
                            ? opportunity.items.map((i: any) => i.productName).join(', ')
                            : "No Product"}
                    </CardTitle>
                    <div className="text-xs text-muted-foreground pt-1 truncate">
                        {opportunity.company.name}
                    </div>
                </CardHeader>
                <CardContent className="p-3 pt-2">
                    <div className="flex justify-between items-end">
                        <div className="text-sm font-bold text-green-600">
                            {(() => {
                                if (!opportunity.items || opportunity.items.length === 0) return '-';
                                const total = calculateTotalValue(opportunity.items);
                                if (!total) {
                                    return opportunity.items.length === 1 && opportunity.items[0].targetPrice
                                        ? `₹${opportunity.items[0].targetPrice.toLocaleString()}`
                                        : "Multiple Items";
                                }
                                return `₹${total.toLocaleString()}`;
                            })()}
                        </div>
                        {opportunity.deadline && (
                            <div className="flex items-center text-[10px] text-muted-foreground">
                                <Calendar className="mr-1 h-3 w-3" />
                                {format(new Date(opportunity.deadline), "MMM d")}
                            </div>
                        )}
                    </div>

                    {/* Linked Samples Indicator */}
                    {groupedSubmissions && Object.keys(groupedSubmissions).length > 0 && (
                        <div className="mt-2 pt-2 border-t" onClick={(e) => e.stopPropagation()}>
                            <Accordion type="single" collapsible className="w-full space-y-1">
                                {Object.entries(groupedSubmissions).map(([productName, subs]: [string, any], index) => {
                                    const approvedCount = subs.filter((s: any) => s.status === 'CLIENT_APPROVED').length;
                                    return (
                                        <AccordionItem value={`item-${index}`} key={productName} className="border-0 bg-slate-50/70 border border-slate-100 rounded-lg overflow-hidden shrink-0">
                                            <AccordionTrigger
                                                className="py-1.5 px-2 hover:no-underline hover:bg-slate-100 text-xs font-semibold data-[state=open]:bg-slate-100 transition-all group shrink-0"
                                            >
                                                <div className="flex items-center gap-2 flex-1 text-left pr-2">
                                                    <FlaskConical className="h-3.5 w-3.5 text-indigo-600 group-hover:text-indigo-700 shrink-0" />
                                                    <span className="truncate text-slate-800 leading-tight">{productName}</span>
                                                    <div className="ml-auto flex items-center gap-1 shrink-0">
                                                        {approvedCount > 0 && (
                                                            <Badge variant="secondary" className="text-[10px] h-[18px] px-1 min-w-[1.25rem] flex items-center justify-center rounded-full bg-green-100 text-green-700 border border-green-200 leading-none" title="Approved Samples">
                                                                <Check className="h-2.5 w-2.5 mr-0.5" />
                                                                {approvedCount}
                                                            </Badge>
                                                        )}
                                                        <Badge variant="secondary" className="text-[10px] h-[18px] px-1.5 min-w-[1.25rem] flex items-center justify-center rounded-full bg-slate-200 text-slate-700 border-0 leading-none" title="Total Samples">
                                                            {subs.length}
                                                        </Badge>
                                                    </div>
                                                </div>
                                            </AccordionTrigger>
                                            <AccordionContent className="pt-1 pb-1.5 px-1.5 bg-slate-50/50">
                                                <div className="flex flex-col gap-1">
                                                    {subs.map((sub: any) => {
                                                        let badgeColor = "bg-white text-blue-700 border-blue-200";
                                                        if (sub.status === "CLIENT_APPROVED") badgeColor = "bg-green-50 text-green-700 border-green-200";
                                                        if (sub.status === "CLIENT_REJECTED") badgeColor = "bg-red-50 text-red-700 border-red-200";

                                                        return (
                                                            <DropdownMenu key={sub.id}>
                                                                <DropdownMenuTrigger asChild>
                                                                    <Badge
                                                                        variant="secondary"
                                                                        className={cn(
                                                                            "text-[10px] px-2 py-1.5 h-auto font-normal border cursor-pointer hover:shadow-sm transition-all flex items-center justify-between gap-2 w-full",
                                                                            badgeColor
                                                                        )}
                                                                        onClick={(e) => e.stopPropagation()} // Prevent accordion/card click
                                                                    >
                                                                        <div className="flex items-center flex-1 pr-2 min-w-0">
                                                                            <span className="truncate font-medium">{sub.sample?.vendor?.name || "Unknown Provider"}</span>
                                                                            {sub.sample?.priceQuoted && (
                                                                                <span className="ml-1.5 text-[10px] text-muted-foreground shrink-0 border-l pl-1.5">₹{Number(sub.sample.priceQuoted)}</span>
                                                                            )}
                                                                        </div>

                                                                        <div className="flex items-center flex-shrink-0">
                                                                            {sub.status === "CLIENT_APPROVED" && <Check className="h-3.5 w-3.5 text-green-600" />}
                                                                            {sub.status === "CLIENT_REJECTED" && <X className="h-3.5 w-3.5 text-red-600" />}
                                                                            {!["CLIENT_APPROVED", "CLIENT_REJECTED"].includes(sub.status) && (
                                                                                <Button
                                                                                    size="sm"
                                                                                    className="h-[22px] text-[10px] px-2.5 py-0 font-medium bg-indigo-600 hover:bg-indigo-700 text-white border-0 shadow-sm rounded-md"
                                                                                >
                                                                                    Review
                                                                                </Button>
                                                                            )}
                                                                        </div>
                                                                    </Badge>
                                                                </DropdownMenuTrigger>
                                                                <DropdownMenuContent align="end" className="w-32">
                                                                    <DropdownMenuItem onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        handleStatusUpdate(sub.id, "CLIENT_APPROVED");
                                                                    }}>
                                                                        <Check className="mr-2 h-4 w-4 text-green-600" />
                                                                        Approve
                                                                    </DropdownMenuItem>
                                                                    <DropdownMenuItem onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        handleStatusUpdate(sub.id, "CLIENT_REJECTED");
                                                                    }}>
                                                                        <X className="mr-2 h-4 w-4 text-red-600" />
                                                                        Reject
                                                                    </DropdownMenuItem>
                                                                </DropdownMenuContent>
                                                            </DropdownMenu>
                                                        );
                                                    })}
                                                </div>
                                            </AccordionContent>
                                        </AccordionItem>
                                    );
                                })}
                            </Accordion>
                        </div>
                    )}

                    {/* Card Actions Dropdown */}
                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                        <div onClick={(e) => e.stopPropagation()}>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-6 w-6">
                                        <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={(e) => {
                                        e.stopPropagation();
                                        window.open(`/opportunities/${opportunity.id}/print-po`, '_blank');
                                    }}>
                                        <FileText className="mr-2 h-4 w-4" />
                                        Print Proforma (PI)
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                        onClick={(e) => {
                                            e.preventDefault();
                                            handleCreateOrder();
                                        }}
                                        disabled={creatingOrder || opportunity.status !== "CLOSED_WON" || (opportunity.salesOrders && opportunity.salesOrders.length > 0)}
                                        className="text-green-700 focus:text-green-800 data-[disabled]:text-muted-foreground"
                                    >
                                        <Check className="mr-2 h-4 w-4" />
                                        Create Sales Order
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            title="Attach Sample"
                            onClick={(e) => {
                                e.stopPropagation();
                                onAttachSample?.();
                            }}
                        >
                            <FlaskConical className="h-3 w-3" />
                        </Button>
                        {/* Collect Sample Action */}
                        {["OPEN", "QUALIFICATION", "PROPOSAL", "NEGOTIATION"].includes(opportunity.status) && (
                            <div onClick={(e) => e.stopPropagation()}>
                                <CollectSampleDialog
                                    opportunity={opportunity}
                                    companies={partners || []}
                                    trigger={
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-6 w-6 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                            title="Collect Partner Sample"
                                        >
                                            <PlusCircle className="h-3 w-3" />
                                        </Button>
                                    }
                                />
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
