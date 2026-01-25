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

interface SampleFiltersProps {
    commodities: { id: string; name: string }[];
}

export function SampleFilters({ commodities }: SampleFiltersProps) {
    const searchParams = useSearchParams();
    const pathname = usePathname();
    const { replace } = useRouter();

    const handleSearch = useDebouncedCallback((term: string) => {
        const params = new URLSearchParams(searchParams);
        if (term) {
            params.set("location", term);
        } else {
            params.delete("location");
        }
        replace(`${pathname}?${params.toString()}`);
    }, 300);

    const handleCommodityChange = (value: string) => {
        const params = new URLSearchParams(searchParams);
        if (value && value !== "all") {
            params.set("commodityId", value);
        } else {
            params.delete("commodityId");
        }
        replace(`${pathname}?${params.toString()}`);
    };

    const handleTrustChange = (value: string) => {
        const params = new URLSearchParams(searchParams);
        if (value && value !== "all") {
            params.set("trustLevel", value);
        } else {
            params.delete("trustLevel");
        }
        replace(`${pathname}?${params.toString()}`);
    };

    return (
        <div className="flex gap-4 items-center">
            <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                    type="search"
                    placeholder="Filter by Location (City, State, Country)..."
                    className="pl-8"
                    defaultValue={searchParams.get("location")?.toString()}
                    onChange={(e) => handleSearch(e.target.value)}
                />
            </div>
            <Select
                value={searchParams.get("commodityId") || "all"}
                onValueChange={handleCommodityChange}
            >
                <SelectTrigger className="w-[180px]">
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
            <Select
                value={searchParams.get("trustLevel") || "all"}
                onValueChange={handleTrustChange}
            >
                <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Trust Level" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">Any Trust Level</SelectItem>
                    <SelectItem value="UNRATED">Unrated</SelectItem>
                    <SelectItem value="LOW">Low</SelectItem>
                    <SelectItem value="MEDIUM">Medium</SelectItem>
                    <SelectItem value="HIGH">High</SelectItem>
                    <SelectItem value="VERIFIED">Verified</SelectItem>
                </SelectContent>
            </Select>
        </div>
    );
}
