"use client";

import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

export function BillFilters() {
    const searchParams = useSearchParams();
    const pathname = usePathname();
    const { replace } = useRouter();

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

    return (
        <div className="flex flex-col sm:flex-row gap-4 items-center mb-6">
            <div className="w-full sm:w-[200px]">
                <Select
                    value={searchParams.get("status") || "all"}
                    onValueChange={handleStatusChange}
                >
                    <SelectTrigger>
                        <SelectValue placeholder="Filter by Status" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Statuses</SelectItem>
                        <SelectItem value="DRAFT">Draft</SelectItem>
                        <SelectItem value="APPROVED">Approved</SelectItem>
                        <SelectItem value="PAID">Paid</SelectItem>
                    </SelectContent>
                </Select>
            </div>
        </div>
    );
}
