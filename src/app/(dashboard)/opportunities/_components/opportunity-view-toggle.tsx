"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { KanbanSquare, List } from "lucide-react";

export function OpportunityViewToggle() {
    const searchParams = useSearchParams();
    const pathname = usePathname();
    const { replace } = useRouter();

    const view = searchParams.get('view') || 'board';

    const handleViewChange = (value: string) => {
        if (!value) return; // Prevent unselecting
        const params = new URLSearchParams(searchParams);
        params.set('view', value);
        replace(`${pathname}?${params.toString()}`);
    };

    return (
        <ToggleGroup type="single" value={view} onValueChange={handleViewChange} className="border rounded-md p-1">
            <ToggleGroupItem value="list" size="sm" aria-label="List View">
                <List className="h-4 w-4" />
            </ToggleGroupItem>
            <ToggleGroupItem value="board" size="sm" aria-label="Board View">
                <KanbanSquare className="h-4 w-4" />
            </ToggleGroupItem>
        </ToggleGroup>
    );
}
