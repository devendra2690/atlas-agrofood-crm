"use client";

import { useTransition } from "react";
import { Badge } from "@/components/ui/badge";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { updateProcurementProject } from "@/app/actions/procurement";
import { toast } from "sonner";
import { ProjectStatus } from "@prisma/client";

interface ProjectStatusSelectorProps {
    projectId: string;
    currentStatus: ProjectStatus;
    projectName: string;
}

export function ProjectStatusSelector({ projectId, currentStatus, projectName }: ProjectStatusSelectorProps) {
    const [isPending, startTransition] = useTransition();

    const handleStatusChange = (value: string) => {
        const newStatus = value as ProjectStatus;
        if (newStatus === currentStatus) return;

        startTransition(async () => {
            const result = await updateProcurementProject(projectId, {
                status: newStatus,
                name: projectName // Name required by type but we keep it same
            });

            if (result.success) {
                toast.success(`Project marked as ${newStatus}`);
            } else {
                toast.error(`Failed: ${result.error}`);
            }
        });
    };

    // Determine badge color based on status for the trigger
    const getBadgeVariant = (status: string) => {
        switch (status) {
            case 'SOURCING': return 'default';
            case 'COMPLETED': return 'success'; // Assuming we have success variant or use custom class
            case 'CANCELLED': return 'destructive';
            default: return 'secondary';
        }
    };

    // Custom trigger to look like a badge
    return (
        <Select onValueChange={handleStatusChange} value={currentStatus} disabled={isPending}>
            <SelectTrigger
                className={`w-fit h-auto px-2.5 py-0.5 mt-1 border-transparent rounded-full text-xs font-semibold focus:ring-0 cursor-pointer ${currentStatus === 'SOURCING'
                        ? 'bg-primary text-primary-foreground hover:bg-primary/80'
                        : currentStatus === 'COMPLETED'
                            ? 'bg-green-600 text-white hover:bg-green-700'
                            : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                    }`}
            >
                <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
                <SelectItem value="SOURCING">SOURCING</SelectItem>
                <SelectItem value="COMPLETED">COMPLETED</SelectItem>
                <SelectItem value="CANCELLED">CANCELLED</SelectItem>
            </SelectContent>
        </Select>
    );
}
