"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";

export function NoteFilters() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const pathname = usePathname();

    const status = searchParams.get("status") || "all";
    const priority = searchParams.get("priority") || "all";
    const search = searchParams.get("search") || "";

    const updateFilter = (key: string, value: string) => {
        const params = new URLSearchParams(searchParams);
        if (value && value !== "all") {
            params.set(key, value);
        } else {
            params.delete(key);
        }
        params.set("page", "1");
        router.push(`${pathname}?${params.toString()}`);
    };

    const handleSearch = (term: string) => {
        const params = new URLSearchParams(searchParams);
        if (term) {
            params.set("search", term);
        } else {
            params.delete("search");
        }
        params.set("page", "1");
        router.push(`${pathname}?${params.toString()}`);
    };

    const resetFilters = () => {
        router.push(pathname);
    };

    return (
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between py-4">
            <div className="flex flex-1 flex-wrap gap-2">
                <div className="relative w-full max-w-xs">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search notes..."
                        className="pl-8"
                        defaultValue={search}
                        onChange={(e) => {
                            const value = e.target.value;
                            const timeoutId = setTimeout(() => handleSearch(value), 500);
                            return () => clearTimeout(timeoutId);
                        }}
                    />
                </div>
                <Select value={status} onValueChange={(v) => updateFilter("status", v)}>
                    <SelectTrigger className="w-[140px]">
                        <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="PENDING">Pending</SelectItem>
                        <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                        <SelectItem value="COMPLETED">Completed</SelectItem>
                    </SelectContent>
                </Select>
                <Select value={priority} onValueChange={(v) => updateFilter("priority", v)}>
                    <SelectTrigger className="w-[140px]">
                        <SelectValue placeholder="Priority" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Priority</SelectItem>
                        <SelectItem value="HIGH">High</SelectItem>
                        <SelectItem value="MEDIUM">Medium</SelectItem>
                        <SelectItem value="LOW">Low</SelectItem>
                    </SelectContent>
                </Select>

                {(status !== "all" || priority !== "all" || search) && (
                    <Button variant="ghost" onClick={resetFilters}>
                        Reset
                    </Button>
                )}
            </div>
        </div>
    );
}
