"use client";

import { useState, useTransition } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, MapPin, Truck, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { searchCommodities } from "@/app/actions/matrix";
import { SourcingRequestDialog } from "./sourcing-request-dialog";
import { useDebouncedCallback } from "use-debounce";
import { cn } from "@/lib/utils";

type SearchResult = {
    id: string;
    name: string;
    varieties: {
        id: string;
        name: string;
        _count: { vendorMappings: number };
    }[];
};

export function CommoditySearch() {
    const [query, setQuery] = useState("");
    const [results, setResults] = useState<SearchResult[]>([]);
    const [isPending, startTransition] = useTransition();
    const [hasSearched, setHasSearched] = useState(false);

    const handleSearch = useDebouncedCallback((term: string) => {
        if (!term) {
            setResults([]);
            setHasSearched(false);
            return;
        }

        startTransition(async () => {
            const res = await searchCommodities(term);
            if (res.success && res.data) {
                setResults(res.data);
            }
            setHasSearched(true);
        });
    }, 300);

    return (
        <div className="space-y-6 w-full relative">
            <div className="relative">
                <Search className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                <Input
                    placeholder="Search for a commodity (e.g. Onion) or a variety (e.g. Nashik Red)"
                    className="pl-10 h-12 text-lg shadow-sm"
                    onChange={(e) => {
                        setQuery(e.target.value);
                        handleSearch(e.target.value);
                    }}
                />
            </div>

            <div className="space-y-4">
                {isPending && (
                    <div className="text-center text-muted-foreground py-4">Searching...</div>
                )}

                {!isPending && hasSearched && results.length === 0 && (
                    <div className="text-center py-6 border rounded-lg bg-slate-50">
                        <AlertCircle className="h-8 w-8 text-amber-500 mx-auto mb-2" />
                        <h3 className="text-lg font-medium text-slate-900">No results found for "{query}"</h3>
                        <p className="text-muted-foreground mb-4">
                            We don't have this in our database yet.
                        </p>
                        <SourcingRequestDialog initialItem={query} />
                    </div>
                )}

                {!isPending && results.map((commodity) => (
                    <div key={commodity.id} className="border rounded-lg p-4 bg-white shadow-sm">
                        <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                            {commodity.name}
                            <Badge variant="outline" className="font-normal text-xs">Commodity</Badge>
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {commodity.varieties.map((variety) => {
                                const inNetwork = variety._count.vendorMappings > 0;
                                return (
                                    <div
                                        key={variety.id}
                                        className={cn(
                                            "flex items-center justify-between p-3 rounded border",
                                            inNetwork ? "bg-green-50/50 border-green-100" : "bg-slate-50 border-slate-100"
                                        )}
                                    >
                                        <div className="flex flex-col">
                                            <span className="font-medium text-slate-800">{variety.name}</span>
                                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                                                {inNetwork ? (
                                                    <>
                                                        <Truck className="h-3 w-3" /> In Network
                                                    </>
                                                ) : (
                                                    "Out of Network"
                                                )}
                                            </span>
                                        </div>
                                        <div>
                                            {inNetwork ? (
                                                <Badge className="bg-green-600 hover:bg-green-700">Available</Badge>
                                            ) : (
                                                <SourcingRequestDialog
                                                    initialItem={`${commodity.name} - ${variety.name}`}
                                                    trigger={
                                                        <Button size="sm" variant="outline" className="h-7 text-xs border-amber-200 bg-amber-50 text-amber-900 hover:bg-amber-100">
                                                            Request
                                                        </Button>
                                                    }
                                                />
                                            )}
                                        </div>
                                    </div>
                                );
                            })}

                            {commodity.varieties.length === 0 && (
                                <div className="col-span-2 text-sm text-muted-foreground italic p-2">
                                    No specific varieties listed for this commodity.
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
