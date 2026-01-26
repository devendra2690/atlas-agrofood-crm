"use client";

import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Search } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useDebouncedCallback } from "use-debounce";
import { Commodity } from "@prisma/client";

interface ProcurementFiltersProps {
    commodities: Commodity[];
}

export function ProcurementFilters({ commodities }: ProcurementFiltersProps) {
    const searchParams = useSearchParams();
    const pathname = usePathname();
    const { replace } = useRouter();

    const handleSearch = useDebouncedCallback((term: string) => {
        const params = new URLSearchParams(searchParams);
        if (term) {
            params.set("query", term);
        } else {
            params.delete("query");
        }
        params.set("page", "1"); // Reset to page 1 on search
        replace(`${pathname}?${params.toString()}`);
    }, 300);

    const handleStatusChange = (value: string) => {
        const params = new URLSearchParams(searchParams);
        if (value && value !== "all") {
            params.set("status", value);
        } else {
            params.delete("status");
        }
        params.set("page", "1");
        replace(`${pathname}?${params.toString()}`);
    };

    const handleCommodityChange = (value: string) => {
        const params = new URLSearchParams(searchParams);
        if (value && value !== "all") {
            params.set("commodityId", value);
        } else {
            params.delete("commodityId");
        }
        params.set("page", "1");
        replace(`${pathname}?${params.toString()}`);
    };

    return (
        <div className="flex flex-col sm:flex-row gap-4 items-center mb-6">
            <div className="relative flex-1 w-full sm:max-w-sm">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                    type="search"
                    placeholder="Search Projects..."
                    className="pl-8"
                    defaultValue={searchParams.get("query")?.toString()}
                    onChange={(e) => handleSearch(e.target.value)}
                />
            </div>

            <Select
                value={searchParams.get("status") || "all"}
                onValueChange={handleStatusChange}
            >
                <SelectTrigger className="w-full sm:w-[180px]">
                    <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="SOURCING">Sourcing</SelectItem>
                    <SelectItem value="COMPLETED">Completed</SelectItem>
                </SelectContent>
            </Select>

            <Select
                value={searchParams.get("commodityId") || "all"}
                onValueChange={handleCommodityChange}
            >
                <SelectTrigger className="w-full sm:w-[180px]">
                    <SelectValue placeholder="Commodity" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">All Commodities</SelectItem>
                    {commodities.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                            {c.name}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
    );
}
