"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { OpportunityDialog } from "../../opportunities/_components/opportunity-dialog";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

interface CompanyOpportunitiesProps {
    opportunities: any[]; // Using any to match the inferred Prisma types
    company: {
        id: string;
        name: string;
    };
    commodities: any[];
}

export function CompanyOpportunities({ opportunities, company, commodities }: CompanyOpportunitiesProps) {
    const [selectedOpportunity, setSelectedOpportunity] = useState<any | null>(null);
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    const handleRowClick = (opportunity: any) => {
        setSelectedOpportunity(opportunity);
        setIsDialogOpen(true);
    };

    return (
        <>
            <Card>
                <CardHeader>
                    <CardTitle>Sales Opportunities</CardTitle>
                    <CardDescription>Active deals and prospects.</CardDescription>
                </CardHeader>
                <CardContent>
                    {opportunities.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                            No active opportunities.
                        </div>
                    ) : (
                        <ul className="space-y-4">
                            {opportunities.map(opp => (
                                <li
                                    key={opp.id}
                                    className="border p-4 rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
                                    onClick={() => handleRowClick(opp)}
                                >
                                    <div className="flex justify-between">
                                        <span className="font-medium">{opp.productName}</span>
                                        <Badge variant={
                                            opp.status === 'CLOSED_WON' ? 'default' :
                                                opp.status === 'CLOSED_LOST' ? 'destructive' : 'secondary'
                                        }>{opp.status.replace('_', ' ')}</Badge>
                                    </div>
                                    <div className="text-sm text-muted-foreground mt-1">
                                        Target: {opp.targetPrice ? `₹${opp.targetPrice}` : 'N/A'}
                                        • Qty: {opp.quantity?.toString() || 'N/A'} MT
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </CardContent>
            </Card>

            <OpportunityDialog
                open={isDialogOpen}
                onOpenChange={setIsDialogOpen}
                initialData={selectedOpportunity}
                companies={[{ ...company, commodities: [] }]} // Pass the current company with empty commodities to satisfy type
                commodities={commodities || []}
                trigger={null}
            />
        </>
    );
}
