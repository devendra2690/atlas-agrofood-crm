import { getInteractions } from "@/app/actions/interaction";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { InteractionRow } from "./_components/interaction-row";
import { InteractionFilters } from "./_components/interaction-filters";
import { PaginationControls } from "@/components/ui/pagination-controls";

export default async function InteractionsPage({
    searchParams,
}: {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
    const params = await searchParams;
    const page = typeof params.page === 'string' ? parseInt(params.page) : 1;
    const limit = 10;
    const query = typeof params.query === 'string' ? params.query : undefined;
    const status = typeof params.status === 'string' ? params.status : undefined;
    const date = typeof params.date === 'string' ? params.date : undefined;

    const { data: interactions, pagination } = await getInteractions({
        page,
        limit,
        query,
        status,
        date
    });

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Interactions</h2>
                    <p className="text-muted-foreground">
                        Track communication history across all companies.
                    </p>
                </div>
            </div>

            <InteractionFilters />

            <Card>
                <CardHeader>
                    <CardTitle>All Interactions</CardTitle>
                    <CardDescription>
                        A global view of calls, meetings, and emails.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Date</TableHead>
                                <TableHead>Company</TableHead>
                                <TableHead>User</TableHead>
                                <TableHead>Description</TableHead>
                                <TableHead>Status</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {interactions?.map((interaction) => (
                                <InteractionRow key={interaction.id} interaction={interaction} />
                            ))}
                            {(!interactions || interactions.length === 0) && (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center h-24 text-muted-foreground">
                                        No interactions found.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                    {pagination && (
                        <PaginationControls
                            hasNextPage={pagination.page < pagination.totalPages}
                            hasPrevPage={pagination.page > 1}
                            totalPages={pagination.totalPages}
                            currentPage={pagination.page}
                        />
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
