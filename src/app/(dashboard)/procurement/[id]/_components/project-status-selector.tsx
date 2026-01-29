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

    // Custom trigger to look like a badge but clickable
    return (
        <Select onValueChange={handleStatusChange} value={currentStatus} disabled={isPending}>
            <SelectTrigger className="w-fit h-auto p-0 border-none bg-transparent focus:ring-0">
                <Badge
                    variant={currentStatus === 'SOURCING' ? 'default' : 'secondary'}
                    className={`mt-1 hover:opacity-80 cursor-pointer flex gap-1 items-center pr-2 ${currentStatus === 'COMPLETED' ? 'bg-green-600 hover:bg-green-700' : ''}`}
                >
                    {currentStatus}
                </Badge>
            </SelectTrigger>
            <SelectContent>
                <SelectItem value="SOURCING">SOURCING</SelectItem>
                <SelectItem value="COMPLETED">COMPLETED</SelectItem>
                <SelectItem value="CANCELLED">CANCELLED</SelectItem>
            </SelectContent>
        </Select>
    );
}
