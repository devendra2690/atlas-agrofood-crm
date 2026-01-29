"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { CommoditySearch } from "./commodity-search";

export function SalesView() {
    return (
        <div className="grid gap-6">
            <Card className="min-h-[400px] border-2 border-dashed">
                <CardHeader className="text-center pb-2">
                    <CardTitle className="text-2xl">Find What You Need</CardTitle>
                    <CardDescription>
                        Search for any commodity or variety. If we don't have it, we'll source it.
                    </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col items-center pt-8">
                    <div className="w-full max-w-2xl">
                        <CommoditySearch />
                    </div>
                </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Watchlist Placeholder */}
                <Card>
                    <CardHeader>
                        <CardTitle>My Sourcing Requests</CardTitle>
                        <CardDescription>Items you requested that are being sourced.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="text-sm text-muted-foreground py-8 text-center">
                            No active requests.
                        </div>
                    </CardContent>
                </Card>

                {/* Recently Viewed or Suggestions (Placeholder) */}
                <Card>
                    <CardHeader>
                        <CardTitle>Market Insights</CardTitle>
                        <CardDescription>Trending varieties this season.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="text-sm text-muted-foreground py-8 text-center">
                            Coming soon.
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
