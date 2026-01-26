"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from "date-fns";
import { ArrowDownLeft, ArrowUpRight, TrendingUp, IndianRupee, Wallet } from "lucide-react";
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend } from "recharts";
import { Separator } from "@/components/ui/separator";

interface FinanceDashboardProps {
    stats: {
        revenue: number;
        expenses: number;
        profit: number;
    };
    transactions: any[];
}

export function FinanceDashboard({ stats, transactions }: FinanceDashboardProps) {
    const chartData = [
        {
            name: "Financial Overview",
            Revenue: stats.revenue,
            Expenses: stats.expenses,
            Profit: stats.profit,
        },
    ];

    return (
        <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                        <IndianRupee className="h-4 w-4 text-emerald-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">₹{stats.revenue.toLocaleString()}</div>
                        <p className="text-xs text-muted-foreground">
                            Total collected from Invoices
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
                        <Wallet className="h-4 w-4 text-rose-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">₹{stats.expenses.toLocaleString()}</div>
                        <p className="text-xs text-muted-foreground">
                            Total paid for Bills
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Net Profit</CardTitle>
                        <TrendingUp className={`h-4 w-4 ${stats.profit >= 0 ? 'text-emerald-600' : 'text-rose-600'}`} />
                    </CardHeader>
                    <CardContent>
                        <div className={`text-2xl font-bold ${stats.profit >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                            ₹{stats.profit.toLocaleString()}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Revenue - Expenses
                        </p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                <Card className="col-span-4">
                    <CardHeader>
                        <CardTitle>Overview</CardTitle>
                    </CardHeader>
                    <CardContent className="pl-2">
                        <div className="h-[300px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={chartData}>
                                    <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                                    <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `₹${value}`} />
                                    <Tooltip
                                        formatter={(value: any) => [`₹${Number(value).toLocaleString()}`, ""]}
                                        cursor={{ fill: 'transparent' }}
                                    />
                                    <Legend />
                                    <Bar dataKey="Revenue" fill="#10b981" radius={[4, 4, 0, 0]} />
                                    <Bar dataKey="Expenses" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                                    <Bar dataKey="Profit" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>
                <Card className="col-span-3">
                    <CardHeader>
                        <CardTitle>Recent Transactions</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-8">
                            {transactions.length === 0 ? (
                                <p className="text-center text-muted-foreground py-8">No transactions found.</p>
                            ) : (
                                transactions.map((tx) => (
                                    <div key={tx.id} className="flex items-center">
                                        <div className={`flex h-9 w-9 items-center justify-center rounded-full border ${tx.type === 'CREDIT' ? 'border-emerald-200 bg-emerald-50' : 'border-rose-200 bg-rose-50'
                                            }`}>
                                            {tx.type === 'CREDIT' ? (
                                                <ArrowDownLeft className="h-5 w-5 text-emerald-600" />
                                            ) : (
                                                <ArrowUpRight className="h-5 w-5 text-rose-600" />
                                            )}
                                        </div>
                                        <div className="ml-4 space-y-1">
                                            <p className="text-sm font-medium leading-none">{tx.description}</p>
                                            <p className="text-xs text-muted-foreground">{tx.reference} • {format(new Date(tx.date), "MMM d")}</p>
                                        </div>
                                        <div className={`ml-auto font-medium ${tx.type === 'CREDIT' ? 'text-emerald-600' : 'text-rose-600'
                                            }`}>
                                            {tx.type === 'CREDIT' ? '+' : '-'}₹{tx.amount.toLocaleString()}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
