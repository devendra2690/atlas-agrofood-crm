"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { getUsers } from "@/app/actions/user";

export function ActivityFilters() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const pathname = usePathname();

    const entityType = searchParams.get("entityType") || "all";
    const userId = searchParams.get("userId") || "all";
    const query = searchParams.get("query") || "";

    const [users, setUsers] = useState<{ id: string; name: string | null }[]>([]);

    useEffect(() => {
        async function loadUsers() {
            const res = await getUsers();
            if (res.success && res.data) {
                setUsers(res.data);
            }
        }
        loadUsers();
    }, []);

    const updateFilter = (key: string, value: string) => {
        const params = new URLSearchParams(searchParams);
        if (value && value !== "all") {
            params.set(key, value);
        } else {
            params.delete(key);
        }
        params.set("page", "1"); // Reset page on filter change
        router.push(`${pathname}?${params.toString()}`);
    };

    const handleSearch = (term: string) => {
        const params = new URLSearchParams(searchParams);
        if (term) {
            params.set("query", term);
        } else {
            params.delete("query");
        }
        params.set("page", "1");
        router.push(`${pathname}?${params.toString()}`);
    };

    const resetFilters = () => {
        router.push(pathname);
    };

    return (
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-1 items-center gap-2 flex-wrap">
                <div className="relative w-full max-w-xs">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search entities or details..."
                        className="pl-8"
                        defaultValue={query}
                        onChange={(e) => {
                            const value = e.target.value;
                            const timeoutId = setTimeout(() => handleSearch(value), 500);
                            return () => clearTimeout(timeoutId);
                        }}
                    />
                </div>
                <Select
                    value={entityType}
                    onValueChange={(value) => updateFilter("entityType", value)}
                >
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Entity Type" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Entities</SelectItem>
                        <SelectItem value="SalesOrder">Sales Order</SelectItem>
                        <SelectItem value="PurchaseOrder">Purchase Order</SelectItem>
                        <SelectItem value="Invoice">Invoice</SelectItem>
                        <SelectItem value="Bill">Bill</SelectItem>
                        <SelectItem value="Shipment">Shipment</SelectItem>
                        <SelectItem value="ProcurementProject">Project</SelectItem>
                        <SelectItem value="SalesOpportunity">Opportunity</SelectItem>
                        <SelectItem value="Company">Company</SelectItem>
                        <SelectItem value="User">User</SelectItem>
                    </SelectContent>
                </Select>

                <Select
                    value={userId}
                    onValueChange={(value) => updateFilter("userId", value)}
                >
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Filter by User" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Users</SelectItem>
                        {users.map((user) => (
                            <SelectItem key={user.id} value={user.id}>
                                {user.name || "Unknown User"}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                {(entityType !== "all" || userId !== "all" || query) && (
                    <Button variant="ghost" onClick={resetFilters} className="px-2 lg:px-3">
                        Reset
                    </Button>
                )}
            </div>
        </div>
    );
}
