import { useState, useEffect } from "react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Check, X, MoreHorizontal } from "lucide-react";
import { updateSubmissionStatus } from "@/app/actions/sample";
import { createSalesOrder } from "@/app/actions/order";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { Calendar, FlaskConical } from "lucide-react";
import { Button } from "@/components/ui/button";

interface KanbanCardProps {
    opportunity: any;
    onClick?: () => void;
    onAttachSample?: () => void;
}

export function KanbanCard({ opportunity, onClick, onAttachSample }: KanbanCardProps) {
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
                    <CardTitle className="text-sm font-medium leading-none">
                        {opportunity.productName}
                    </CardTitle>
                    <div className="text-xs text-muted-foreground pt-1 truncate">
                        {opportunity.company.name}
                    </div>
                </CardHeader>
                <CardContent className="p-3 pt-2">
                    <div className="flex justify-between items-end">
                        <div className="text-sm font-bold text-green-600">
                            {opportunity.targetPrice ? `₹${opportunity.targetPrice}` : '-'}
                        </div>
                        {opportunity.deadline && (
                            <div className="flex items-center text-[10px] text-muted-foreground">
                                <Calendar className="mr-1 h-3 w-3" />
                                {format(new Date(opportunity.deadline), "MMM d")}
                            </div>
                        )}
                    </div>

                    {/* Linked Samples Indicator */}
                    {optimisticSubmissions && optimisticSubmissions.length > 0 && (
                        <div className="mt-2 pt-2 border-t flex flex-wrap gap-1">
                            {optimisticSubmissions.map((sub: any) => {
                                let badgeColor = "bg-blue-50 text-blue-700 border-blue-100";
                                if (sub.status === "CLIENT_APPROVED") badgeColor = "bg-green-50 text-green-700 border-green-100";
                                if (sub.status === "CLIENT_REJECTED") badgeColor = "bg-red-50 text-red-700 border-red-100";

                                return (
                                    <DropdownMenu key={sub.id}>
                                        <DropdownMenuTrigger asChild>
                                            <Badge
                                                variant="secondary"
                                                className={cn(
                                                    "text-[10px] px-2 py-1 h-auto font-normal border cursor-pointer hover:opacity-80 transition-all flex items-center justify-between gap-2 w-full max-w-[200px]",
                                                    badgeColor
                                                )}
                                                onClick={(e) => e.stopPropagation()} // Prevent card click
                                            >
                                                <div className="flex items-center truncate">
                                                    <FlaskConical className="h-3 w-3 mr-1.5 flex-shrink-0" />
                                                    <span className="truncate">{sub.sample?.vendor?.name}</span>
                                                </div>

                                                {/* Status Indicator / Action Trigger */}
                                                <div className="flex items-center flex-shrink-0">
                                                    {sub.status === "CLIENT_APPROVED" && <Check className="h-3 w-3" />}
                                                    {sub.status === "CLIENT_REJECTED" && <X className="h-3 w-3" />}
                                                    {!["CLIENT_APPROVED", "CLIENT_REJECTED"].includes(sub.status) && (
                                                        <Button
                                                            size="sm"
                                                            className="h-5 text-[10px] px-2 py-0 font-medium bg-indigo-600 hover:bg-indigo-700 text-white border-0 shadow-sm"
                                                        >
                                                            Review
                                                        </Button>
                                                    )}
                                                </div>
                                            </Badge>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="start" className="w-32">
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
                                    <DropdownMenuItem
                                        onClick={(e) => {
                                            e.preventDefault();
                                            handleCreateOrder();
                                        }}
                                        disabled={creatingOrder || opportunity.status !== "CLOSED_WON"}
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
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
