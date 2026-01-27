"use client";

import { Button } from "@/components/ui/button";
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
import { Combobox } from "@/components/ui/combobox";
import { useState } from "react";
import { toast } from "sonner";
import { createTransaction } from "@/app/actions/finance";
import { Plus, Minus } from "lucide-react";

interface AddTransactionDialogProps {
    type: 'CREDIT' | 'DEBIT';
    salesOrders?: { id: string; client: { name: string }; opportunity: { productName: string } }[];
}

export function AddTransactionDialog({ type, salesOrders = [] }: AddTransactionDialogProps) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        amount: "",
        category: "",
        description: "",
        salesOrderId: "none",
        date: new Date().toISOString().split('T')[0]
    });

    const categories = type === 'CREDIT'
        ? ["Scrap Sale", "Refund", "Other Income"]
        : ["Salary", "Rent", "Utilities", "Maintenance", "Insurance", "Logistics", "Commission", "Customs", "Other Expense"];

    const handleSubmit = async () => {
        if (!formData.amount || !formData.category || !formData.description) {
            toast.error("Please fill in all fields");
            return;
        }

        setLoading(true);
        try {
            const result = await createTransaction({
                type,
                amount: parseFloat(formData.amount),
                date: new Date(formData.date),
                category: formData.category,
                description: formData.description,
                salesOrderId: formData.salesOrderId === "none" ? undefined : formData.salesOrderId
            });

            if (result.success) {
                toast.success(`${type === 'CREDIT' ? 'Income' : 'Expense'} registered successfully`);
                setOpen(false);
                setFormData({
                    amount: "",
                    category: "",
                    description: "",
                    salesOrderId: "none",
                    date: new Date().toISOString().split('T')[0]
                });
            } else {
                toast.error(result.error || "Failed to register transaction");
            }
        } catch (error) {
            toast.error("An error occurred");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant={type === 'CREDIT' ? "default" : "destructive"} className="gap-2">
                    {type === 'CREDIT' ? <Plus className="h-4 w-4" /> : <Minus className="h-4 w-4" />}
                    Register {type === 'CREDIT' ? 'Income' : 'Expense'}
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Register {type === 'CREDIT' ? 'Income' : 'Expense'}</DialogTitle>
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
                    {salesOrders && salesOrders.length > 0 && (
                        <div className="grid gap-2">
                            <Label>Link to Sales Order (Optional)</Label>
                            <Combobox
                                options={[
                                    { label: `None (General ${type === 'CREDIT' ? 'Income' : 'Expense'})`, value: "none" },
                                    ...salesOrders.map(order => ({
                                        label: `${order.client.name} - ${order.opportunity.productName} (${order.id.slice(0, 8)})`,
                                        value: order.id
                                    }))
                                ]}
                                value={formData.salesOrderId}
                                onChange={(value) => setFormData({ ...formData, salesOrderId: value })}
                                placeholder="Select Order"
                                searchPlaceholder="Search order..."
                                emptyMessage="No orders found."
                            />
                        </div>
                    )}
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
                            placeholder="e.g. Office Rent for Jan"
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
                <Button onClick={handleSubmit} disabled={loading} className={type === 'DEBIT' ? "bg-destructive hover:bg-destructive/90" : ""}>
                    {loading ? "Registering..." : "Register"}
                </Button>
            </DialogContent>
        </Dialog>
    );
}
