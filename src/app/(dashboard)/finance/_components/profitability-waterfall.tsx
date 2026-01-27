"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Cell, ReferenceLine } from "recharts";

interface WaterfallChartProps {
    data: { name: string; value: number; fill: string }[];
}

export function ProfitabilityWaterfall({ data }: WaterfallChartProps) {
    // Process data for waterfall effect if needed, but simple bar works for "Bridge" concept if negative values are allowed
    // Actually standard Recharts bar handles negative values downwards. 
    // To make it look like a true waterfall (floating steps) requires complex data prep (stacking).
    // For simplicity, we will show them as side-by-side components of the equation: 
    // Revenue (Positive), COGS (Negative), Expenses (Negative), Net (Positive/Negative Result).

    return (
        <Card className="col-span-4">
            <CardHeader>
                <CardTitle>Profitability Bridge</CardTitle>
                <CardDescription>Breakdown of Revenue to Net Profit</CardDescription>
            </CardHeader>
            <CardContent className="pl-2">
                <div className="h-[350px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={data}>
                            <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                            <YAxis
                                stroke="#888888"
                                fontSize={12}
                                tickLine={false}
                                axisLine={false}
                                tickFormatter={(value) => `₹${Math.abs(value).toLocaleString()}`}
                            />
                            <Tooltip
                                cursor={{ fill: 'transparent' }}
                                formatter={(value: any) => [`₹${Number(value).toLocaleString()}`, "Amount"]}
                            />
                            <ReferenceLine y={0} stroke="#000" />
                            <Bar dataKey="value" radius={[4, 4, 4, 4]}>
                                {data.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.fill} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    );
}
