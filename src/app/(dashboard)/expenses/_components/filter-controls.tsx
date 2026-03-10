"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { SearchInput } from "@/components/search-input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select";
import { useTransition } from "react";
import { Loader2 } from "lucide-react";

interface FilterControlsProps {
    users: { id: string; name: string | null; email: string }[];
    filterUser?: string;
}

export function FilterControls({ users, filterUser }: FilterControlsProps) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [isPending, startTransition] = useTransition();

    const handleUserFilter = (value: string) => {
        const params = new URLSearchParams(searchParams);
        if (value && value !== "all") {
            params.set("filterUser", value);
        } else {
            params.delete("filterUser");
        }
        params.set("page", "1"); // Reset pagination

        startTransition(() => {
            router.push(`/expenses?${params.toString()}`);
        });
    };

    return (
        <div className="flex flex-col sm:flex-row gap-4 w-full justify-end items-center mb-6">
            <div className="w-full sm:w-[300px]">
                <SearchInput paramName="search" placeholder="Search Activity or Notes..." />
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
                <Select value={filterUser || "all"} onValueChange={handleUserFilter}>
                    <SelectTrigger className="w-full sm:w-[200px]">
                        <SelectValue placeholder="Filter by User" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Users</SelectItem>
                        {users.map((u) => (
                            <SelectItem key={u.id} value={u.id}>
                                {u.name || u.email}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                {isPending && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
            </div>
        </div>
    );
}
