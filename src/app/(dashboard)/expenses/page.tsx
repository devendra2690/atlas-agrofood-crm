import { auth } from "@/auth";
import { getBalances, getExpensesFeed, getGlobalBalances } from "@/app/actions/expense";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatCurrency } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { AddExpenseDialog } from "./_components/add-expense-dialog";
import { SettleUpDialog } from "./_components/settle-up-dialog";
import { Receipt, HandCoins, ArrowRightLeft, Database } from "lucide-react";
import { SearchInput } from "@/components/search-input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select";
import { PaginationControls } from "@/components/ui/pagination-controls";
import { FilterControls } from "./_components/filter-controls";

export default async function ExpensesPage({
    searchParams,
}: {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
    const session = await auth();
    if (!session?.user?.id) return null;
    const myUserId = session.user.id;
    const params = await searchParams;
    const page = typeof params.page === 'string' ? parseInt(params.page) : 1;
    const search = typeof params.search === 'string' ? params.search : undefined;
    const filterUser = typeof params.filterUser === 'string' ? params.filterUser : undefined;

    // Build the data dependencies
    const balances = await getBalances();
    const feedRes = await getExpensesFeed({ page, limit: 10, search, userId: filterUser });
    const feed = feedRes.data || [];
    const pagination = feedRes.pagination;

    const globalBalancesRes = session.user.role === 'ADMIN' ? await getGlobalBalances() : { data: null };
    const globalDebts = globalBalancesRes.data || [];
    const users = await prisma.user.findMany({ select: { id: true, name: true, image: true, email: true } });

    const netBalance = balances.data?.netBalance || 0;
    const totalIOwe = balances.data?.totalIOwe || 0;
    const totalOwedToMe = balances.data?.totalOwedToMe || 0;
    const pairwise = balances.data?.pairwiseBalances || [];

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">SplitWise</h2>
                    <p className="text-muted-foreground">
                        Shared expenses and settlements for the team.
                    </p>
                </div>
                <div className="flex gap-2">
                    <SettleUpDialog users={users} currentUserId={myUserId} />
                    <AddExpenseDialog users={users} currentUserId={myUserId} />
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Net Balance</CardTitle>
                        <ArrowRightLeft className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className={`text-2xl font-bold ${netBalance > 0 ? "text-green-600" : netBalance < 0 ? "text-red-600" : ""}`}>
                            {netBalance > 0 ? "+" : ""}{formatCurrency(netBalance)}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            {netBalance > 0 ? "Overall, you are owed money." : netBalance < 0 ? "Overall, you owe money." : "You are perfectly settled up!"}
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">You Owe</CardTitle>
                        <HandCoins className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-red-600">
                            {formatCurrency(totalIOwe)}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Total amount you owe to others.
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">You are Owed</CardTitle>
                        <Receipt className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600">
                            {formatCurrency(totalOwedToMe)}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Total amount others owe you.
                        </p>
                    </CardContent>
                </Card>
            </div>

            {session.user.role === 'ADMIN' && (
                <div className="mb-6">
                    <Card className="border-blue-200 shadow-sm">
                        <CardHeader className="bg-blue-50/50 border-b pb-4">
                            <CardTitle className="flex items-center gap-2">
                                <Database className="h-5 w-5 text-blue-500" />
                                Company-Wide Balances (Admin View)
                            </CardTitle>
                            <CardDescription>Global overview of who owes who across all users.</CardDescription>
                        </CardHeader>
                        <CardContent className="pt-6">
                            {globalDebts.length === 0 ? (
                                <div className="text-center py-6 text-muted-foreground">
                                    No outstanding debts company-wide! 🎉
                                </div>
                            ) : (
                                <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                                    {globalDebts.map((debt: any, idx: number) => (
                                        <div key={idx} className="flex items-center justify-between p-3 border rounded-lg bg-slate-50/50">
                                            <div className="flex flex-col gap-1">
                                                <div className="flex items-center gap-2">
                                                    <Avatar className="h-5 w-5">
                                                        <AvatarImage src={debt.borrower?.image || ""} />
                                                        <AvatarFallback className="text-[10px]">{debt.borrower?.name?.charAt(0) || "?"}</AvatarFallback>
                                                    </Avatar>
                                                    <span className="text-sm font-medium">{debt.borrower?.name}</span>
                                                </div>
                                                <div className="text-[10px] text-muted-foreground flex items-center gap-1 pl-1">
                                                    <span className="text-red-500 font-semibold">owes</span>
                                                    <ArrowRightLeft className="h-3 w-3" />
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Avatar className="h-5 w-5">
                                                        <AvatarImage src={debt.lender?.image || ""} />
                                                        <AvatarFallback className="text-[10px]">{debt.lender?.name?.charAt(0) || "?"}</AvatarFallback>
                                                    </Avatar>
                                                    <span className="text-sm font-medium">{debt.lender?.name}</span>
                                                </div>
                                            </div>
                                            <div className="text-lg font-bold text-slate-700">
                                                {formatCurrency(debt.amount)}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            )}

            <div className="grid gap-6 md:grid-cols-2">
                {/* Pairwise Balances List */}
                <Card>
                    <CardHeader>
                        <CardTitle>Who Owes Who</CardTitle>
                        <CardDescription>Your running balances with specific colleagues.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {pairwise.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground">
                                You are settled up with everyone! 🎉
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {pairwise.map((p) => (
                                    <div key={p.userId} className="flex items-center justify-between p-3 border rounded-lg">
                                        <div className="flex items-center gap-3">
                                            <Avatar>
                                                <AvatarImage src={p.user?.image || ""} />
                                                <AvatarFallback>{p.user?.name?.charAt(0) || "?"}</AvatarFallback>
                                            </Avatar>
                                            <div>
                                                <p className="font-medium">{p.user?.name || p.user?.email}</p>
                                                <p className="text-xs text-muted-foreground">
                                                    {p.netBalance > 0 ? "owes you" : "you owe"}
                                                </p>
                                            </div>
                                        </div>
                                        <div className={`text-lg font-bold ${p.netBalance > 0 ? "text-green-600" : "text-red-600"}`}>
                                            {formatCurrency(Math.abs(p.netBalance))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Feed */}
                <Card>
                    <CardHeader className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between pb-2">
                        <div>
                            <CardTitle>Recent Activity</CardTitle>
                            <CardDescription>Timeline of expenses and settlements.</CardDescription>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <FilterControls users={users} filterUser={filterUser} />

                        {feed.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground border rounded-lg bg-slate-50 border-dashed">
                                No activity found matching these filters.
                            </div>
                        ) : (
                            <div className="space-y-6">
                                {feed.map((item: any) => {
                                    if (item.type === 'EXPENSE') {
                                        const exp = item.data;
                                        return (
                                            <div key={`exp-${exp.id}`} className="flex gap-4">
                                                <div className="mt-1 bg-blue-100 p-2 rounded-full h-8 w-8 flex items-center justify-center text-blue-600 shrink-0">
                                                    <Receipt size={16} />
                                                </div>
                                                <div className="flex-1">
                                                    <div className="flex justify-between">
                                                        <p className="font-semibold">{exp.description}</p>
                                                        <p className="font-bold">{formatCurrency(Number(exp.totalAmount))}</p>
                                                    </div>
                                                    <p className="text-sm flex gap-1 items-center">
                                                        <span className="font-medium">{exp.paidBy?.name}</span> paid
                                                        <span className="text-muted-foreground text-xs ml-2">
                                                            {formatDistanceToNow(new Date(exp.date), { addSuffix: true })}
                                                        </span>
                                                    </p>
                                                    {exp.splits.length > 0 && (
                                                        <div className="mt-2 text-xs text-muted-foreground">
                                                            Splitting with: {exp.splits.filter((s: any) => s.userId !== exp.paidById).map((s: any) => s.user?.name).join(", ")}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    } else {
                                        const set = item.data;
                                        return (
                                            <div key={`set-${set.id}`} className="flex gap-4">
                                                <div className="mt-1 bg-green-100 p-2 rounded-full h-8 w-8 flex items-center justify-center text-green-600 shrink-0">
                                                    <HandCoins size={16} />
                                                </div>
                                                <div className="flex-1">
                                                    <div className="flex justify-between">
                                                        <p className="font-semibold">Settlement ({set.method})</p>
                                                        <p className="font-bold text-green-600">{formatCurrency(Number(set.amount))}</p>
                                                    </div>
                                                    <p className="text-sm">
                                                        <span className="font-medium">{set.payer?.name}</span> paid <span className="font-medium">{set.payee?.name}</span>
                                                    </p>
                                                    <p className="text-xs text-muted-foreground">
                                                        {formatDistanceToNow(new Date(set.date), { addSuffix: true })}
                                                    </p>
                                                </div>
                                            </div>
                                        );
                                    }
                                })}
                            </div>
                        )}

                        {pagination && (
                            <div className="mt-4">
                                <PaginationControls
                                    hasNextPage={pagination.page < pagination.totalPages}
                                    hasPrevPage={pagination.page > 1}
                                    totalPages={pagination.totalPages}
                                    currentPage={pagination.page}
                                />
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
