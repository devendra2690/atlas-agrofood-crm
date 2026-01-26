"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from "date-fns";
import { ArrowUpRight, TrendingUp, IndianRupee, Wallet } from "lucide-react";
import { AddTransactionDialog } from "../../../finance/_components/add-transaction-dialog";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { createTransaction } from "@/app/actions/finance";
import { toast } from "sonner";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

interface SalesOrderFinancialsProps {
    salesOrderId: string;
    financials: {
        revenue: number;
        cogs: number;
        otherExpenses: number;
        netProfit: number;
    };
    transactions: any[];
}

export function SalesOrderFinancials({ salesOrderId, financials, transactions }: SalesOrderFinancialsProps) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        amount: "",
        category: "",
        description: "",
        date: new Date().toISOString().split('T')[0]
    });

    const categories = ["Logistics", "Commission", "Customs", "Packaging", "Other Expense"];

    const handleAddExpense = async () => {
        if (!formData.amount || !formData.category || !formData.description) {
            toast.error("Please fill in all fields");
            return;
        }

        setLoading(true);
        try {
            const result = await createTransaction({
                type: 'DEBIT',
                amount: parseFloat(formData.amount),
                date: new Date(formData.date),
                category: formData.category,
                description: formData.description,
                salesOrderId: salesOrderId
            });

            if (result.success) {
                toast.success("Expense added successfully");
                setOpen(false);
                setFormData({
                    amount: "",
                    category: "",
                    description: "",
                    date: new Date().toISOString().split('T')[0]
                });
            } else {
                toast.error(result.error || "Failed to add expense");
            }
        } catch (error) {
            toast.error("An error occurred");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Revenue</CardTitle>
                        <IndianRupee className="h-4 w-4 text-emerald-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">₹{financials.revenue.toLocaleString()}</div>
                        <p className="text-xs text-muted-foreground">Invoiced Amount</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">COGS</CardTitle>
                        <Wallet className="h-4 w-4 text-rose-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">₹{financials.cogs.toLocaleString()}</div>
                        <p className="text-xs text-muted-foreground">Material Cost</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Other Expenses</CardTitle>
                        <ArrowUpRight className="h-4 w-4 text-rose-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">₹{financials.otherExpenses.toLocaleString()}</div>
                        <p className="text-xs text-muted-foreground">Logistics, etc.</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Net Profit</CardTitle>
                        <TrendingUp className={`h-4 w-4 ${financials.netProfit >= 0 ? 'text-emerald-600' : 'text-rose-600'}`} />
                    </CardHeader>
                    <CardContent>
                        <div className={`text-2xl font-bold ${financials.netProfit >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                            ₹{financials.netProfit.toLocaleString()}
                        </div>
                        <p className="text-xs text-muted-foreground">Realized Profit</p>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Other Expenses</CardTitle>
                    <Dialog open={open} onOpenChange={setOpen}>
                        <DialogTrigger asChild>
                            <Button variant="outline" size="sm">Add Expense</Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Add Expense to Order</DialogTitle>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                                <div className="grid gap-2">
                                    <Label>Amount</Label>
                                    <Input
                                        type="number"
                                        placeholder="0.00"
                                        value={formData.amount}
                                        onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label>Category</Label>
                                    <Select
                                        value={formData.category}
                                        onValueChange={(value) => setFormData({ ...formData, category: value })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select category" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {categories.map((cat) => (
                                                <SelectItem key={cat} value={cat}>
                                                    {cat}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="grid gap-2">
                                    <Label>Description</Label>
                                    <Input
                                        placeholder="Description"
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label>Date</Label>
                                    <Input
                                        type="date"
                                        value={formData.date}
                                        onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                    />
                                </div>
                            </div>
                            <Button onClick={handleAddExpense} disabled={loading} className="bg-destructive hover:bg-destructive/90">
                                {loading ? "Adding..." : "Add Expense"}
                            </Button>
                        </DialogContent>
                    </Dialog>
                </CardHeader>
                <CardContent>
                    {transactions.length === 0 ? (
                        <p className="text-center text-muted-foreground py-4">No other expenses recorded.</p>
                    ) : (
                        <div className="space-y-4">
                            {transactions.map((tx) => (
                                <div key={tx.id} className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0">
                                    <div className="space-y-1">
                                        <p className="text-sm font-medium">{tx.description}</p>
                                        <p className="text-xs text-muted-foreground">{tx.category} • {format(new Date(tx.date), "MMM d, yyyy")}</p>
                                    </div>
                                    <div className={`font-medium ${tx.type === 'CREDIT' ? 'text-emerald-600' : 'text-rose-600'}`}>
                                        {tx.type === 'CREDIT' ? '+' : '-'}₹{tx.amount.toLocaleString()}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
