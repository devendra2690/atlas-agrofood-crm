"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useDebouncedCallback } from "use-debounce";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SearchInputProps {
    placeholder?: string;
    className?: string;
}

export function SearchInput({ placeholder, className }: SearchInputProps) {
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
        params.set("page", "1"); // Reset pagination

        replace(`${pathname}?${params.toString()}`);
    }, 300);

    return (
        <div className={`flex w-full items-center space-x-2 ${className}`}>
            <Input
                placeholder={placeholder || "Search..."}
                className="h-9"
                defaultValue={searchParams.get("query")?.toString()}
                onChange={(e) => handleSearch(e.target.value)}
            />
            <Button size="icon" variant="ghost" className="pointer-events-none">
                <Search className="h-4 w-4" />
            </Button>
        </div>
    );
}
