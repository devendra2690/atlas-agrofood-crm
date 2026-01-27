"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowDown, ArrowUp, Minus } from "lucide-react";

interface MarginTableProps {
    byCustomer: any[];
    byProduct: any[];
}

export function MarginTable({ byCustomer, byProduct }: MarginTableProps) {
    return (
        <Card className="col-span-3">
            <CardHeader>
                <CardTitle>Margin Analysis</CardTitle>
            </CardHeader>
            <CardContent>
                <Tabs defaultValue="customer" className="space-y-4">
                    <TabsList>
                        <TabsTrigger value="customer">By Customer</TabsTrigger>
                        <TabsTrigger value="product">By Product</TabsTrigger>
                    </TabsList>

                    <TabsContent value="customer" className="space-y-4">
                        <AnalysisTable data={byCustomer} type="Customer" />
                    </TabsContent>

                    <TabsContent value="product" className="space-y-4">
                        <AnalysisTable data={byProduct} type="Product" />
                    </TabsContent>
                </Tabs>
            </CardContent>
        </Card>
    );
}

function AnalysisTable({ data, type }: { data: any[], type: string }) {
    if (data.length === 0) {
        return <div className="text-center py-6 text-muted-foreground">No data available</div>;
    }

    return (
        <div className="rounded-md border">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>{type}</TableHead>
                        <TableHead className="text-right">Revenue</TableHead>
                        <TableHead className="text-right">Margin</TableHead>
                        <TableHead className="text-right">%</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {data.slice(0, 5).map((item, i) => {
                        const marginPercent = item.revenue > 0 ? (item.margin / item.revenue) * 100 : 0;
                        return (
                            <TableRow key={i}>
                                <TableCell className="font-medium">{item.name}</TableCell>
                                <TableCell className="text-right">₹{item.revenue.toLocaleString()}</TableCell>
                                <TableCell className={`text-right ${item.margin >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                    ₹{item.margin.toLocaleString()}
                                </TableCell>
                                <TableCell className="text-right">
                                    <div className="flex items-center justify-end gap-1">
                                        <span className={marginPercent >= 20 ? "text-emerald-600 font-bold" : marginPercent > 0 ? "text-emerald-500" : "text-rose-500"}>
                                            {marginPercent.toFixed(1)}%
                                        </span>
                                    </div>
                                </TableCell>
                            </TableRow>
                        );
                    })}
                </TableBody>
            </Table>
        </div>
    );
}
