"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { DollarSign, Users, Briefcase, ShoppingCart, Truck, Package, CreditCard, FileText } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface DashboardStats {
    sales: {
        totalRevenue: number;
        activeLeads: number;
        wonDealsCount: number;
        openDealsCount: number;
    };
    procurement: {
        activeProjects: number;
        pendingPOs: number;
        committedSpend: number;
    };
    logistics: {
        activeShipments: number;
        recentlyDelivered: number;
    };
    finance: {
        totalReceivables: number;
        totalPayables: number;
    };
}

export function SalesSummaryCard({ stats }: { stats: DashboardStats['sales'] }) {
    return (
        <Card className="h-full border-l-4 border-l-blue-500 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                    <div>
                        <CardTitle className="text-xl text-blue-700">Sales</CardTitle>
                        <CardDescription>Revenue & Pipeline</CardDescription>
                    </div>
                    <Briefcase className="h-5 w-5 text-blue-500" />
                </div>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    <div>
                        <p className="text-sm font-medium text-muted-foreground">Total Revenue</p>
                        <p className="text-2xl font-bold">₹{stats.totalRevenue.toLocaleString()}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-4 pt-2">
                        <div>
                            <p className="text-xs font-medium text-muted-foreground">Active Leads</p>
                            <div className="flex items-center gap-1">
                                <Users className="h-3 w-3 text-slate-500" />
                                <span className="font-semibold">{stats.activeLeads}</span>
                            </div>
                        </div>
                        <div>
                            <p className="text-xs font-medium text-muted-foreground">Open Deals</p>
                            <div className="flex items-center gap-1">
                                <FileText className="h-3 w-3 text-slate-500" />
                                <span className="font-semibold">{stats.openDealsCount}</span>
                            </div>
                        </div>
                    </div>
                    <Link href="/companies" className="block pt-2">
                        <Button variant="outline" size="sm" className="w-full text-xs">View CRM</Button>
                    </Link>
                </div>
            </CardContent>
        </Card>
    );
}

export function ProcurementSummaryCard({ stats }: { stats: DashboardStats['procurement'] }) {
    return (
        <Card className="h-full border-l-4 border-l-amber-500 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                    <div>
                        <CardTitle className="text-xl text-amber-700">Procurement</CardTitle>
                        <CardDescription>Sourcing & Orders</CardDescription>
                    </div>
                    <ShoppingCart className="h-5 w-5 text-amber-500" />
                </div>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    <div>
                        <p className="text-sm font-medium text-muted-foreground">Committed Spend</p>
                        <p className="text-2xl font-bold">₹{stats.committedSpend.toLocaleString()}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-4 pt-2">
                        <div>
                            <p className="text-xs font-medium text-muted-foreground">Active Projects</p>
                            <div className="flex items-center gap-1">
                                <Briefcase className="h-3 w-3 text-slate-500" />
                                <span className="font-semibold">{stats.activeProjects}</span>
                            </div>
                        </div>
                        <div>
                            <p className="text-xs font-medium text-muted-foreground">Pending POs</p>
                            <div className="flex items-center gap-1">
                                <FileText className="h-3 w-3 text-slate-500" />
                                <span className="font-semibold">{stats.pendingPOs}</span>
                            </div>
                        </div>
                    </div>
                    <Link href="/procurement" className="block pt-2">
                        <Button variant="outline" size="sm" className="w-full text-xs">Manage Procurement</Button>
                    </Link>
                </div>
            </CardContent>
        </Card>
    );
}

export function LogisticsSummaryCard({ stats }: { stats: DashboardStats['logistics'] }) {
    return (
        <Card className="h-full border-l-4 border-l-indigo-500 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                    <div>
                        <CardTitle className="text-xl text-indigo-700">Logistics</CardTitle>
                        <CardDescription>Shipments & Delivery</CardDescription>
                    </div>
                    <Truck className="h-5 w-5 text-indigo-500" />
                </div>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">In Transit</p>
                            <p className="text-2xl font-bold flex items-center gap-2">
                                {stats.activeShipments}
                                <Package className="h-4 w-4 text-indigo-500 animate-pulse" />
                            </p>
                        </div>
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">Delivered (30d)</p>
                            <p className="text-2xl font-bold">{stats.recentlyDelivered}</p>
                        </div>
                    </div>
                    <div className="pt-2">
                        <Link href="/logistics" className="block pt-4">
                            <Button variant="outline" size="sm" className="w-full text-xs">Track Shipments</Button>
                        </Link>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

export function FinanceSummaryCard({ stats }: { stats: DashboardStats['finance'] }) {
    return (
        <Card className="h-full border-l-4 border-l-emerald-500 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                    <div>
                        <CardTitle className="text-xl text-emerald-700">Finance</CardTitle>
                        <CardDescription>Cash Flow</CardDescription>
                    </div>
                    <DollarSign className="h-5 w-5 text-emerald-500" />
                </div>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <p className="text-xs font-medium text-muted-foreground">Receivables</p>
                            <p className="text-lg font-bold text-emerald-600">₹{stats.totalReceivables.toLocaleString()}</p>
                        </div>
                        <div>
                            <p className="text-xs font-medium text-muted-foreground">Payables</p>
                            <p className="text-lg font-bold text-red-600">₹{stats.totalPayables.toLocaleString()}</p>
                        </div>
                    </div>
                    <div className="pt-2">
                        <Link href="/finance" className="block pt-2">
                            <Button variant="outline" size="sm" className="w-full text-xs">Financial Overview</Button>
                        </Link>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
