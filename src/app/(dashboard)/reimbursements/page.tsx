import { auth } from "@/auth";
import { getReimbursements } from "@/app/actions/reimbursement";
import { ReimbursementList } from "./_components/reimbursement-list";
import { SubmitReimbursementDialog } from "./_components/submit-reimbursement-dialog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Receipt } from "lucide-react";

export default async function ReimbursementsPage({
    searchParams,
}: {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
    const session = await auth();
    if (!session?.user?.id) return null;

    const isAdmin = session.user.role === 'ADMIN';
    const params = await searchParams;
    const statusFilter = typeof params.status === 'string' ? params.status : undefined;

    const reimbursements = await getReimbursements({ status: statusFilter });

    const pendingCount = reimbursements.filter((r: any) => r.status === 'PENDING').length;
    const approvedCount = reimbursements.filter((r: any) => r.status === 'APPROVED').length;

    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            <div className="flex items-center justify-between space-y-2">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Reimbursements</h2>
                    <p className="text-muted-foreground">
                        {isAdmin ? "Manage and pay employee expense claims." : "Submit and track your out-of-pocket expenses."}
                    </p>
                </div>
                <div className="flex gap-2">
                    <SubmitReimbursementDialog />
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3 mb-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Pending Approvals</CardTitle>
                        <Receipt className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{pendingCount}</div>
                        <p className="text-xs text-muted-foreground">Claims waiting for review</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Approved (Unpaid)</CardTitle>
                        <Receipt className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-blue-600">{approvedCount}</div>
                        <p className="text-xs text-muted-foreground">Ready to be paid out</p>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>{isAdmin ? 'All Claims' : 'My Claims'}</CardTitle>
                    <CardDescription>
                        {isAdmin ? 'Overview of all employee reimbursement requests.' : 'History of your submitted expenses.'}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <ReimbursementList reimbursements={reimbursements} isAdmin={isAdmin} />
                </CardContent>
            </Card>
        </div>
    );
}
