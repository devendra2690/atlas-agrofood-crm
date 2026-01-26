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
import { InteractionFilters } from "./_components/interaction-filters";
import { PaginationControls } from "@/components/ui/pagination-controls";
import { format } from "date-fns";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

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
                                <TableHead>Description</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Logged By</TableHead>
                                <TableHead>Created By</TableHead>
                                <TableHead>Updated By</TableHead>
                                <TableHead>Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {interactions?.map((interaction) => (
                                <TableRow key={interaction.id}>
                                    <TableCell>{format(new Date(interaction.date), "MMM d, yyyy")}</TableCell>
                                    <TableCell>
                                        <Link href={`/companies/${interaction.company.id}`} className="font-medium hover:underline text-blue-600">
                                            {interaction.company.name}
                                        </Link>
                                    </TableCell>
                                    <TableCell>{interaction.description}</TableCell>
                                    <TableCell>
                                        <Badge variant={interaction.status === 'CLOSED' ? "secondary" : "default"}>
                                            {interaction.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        {interaction.user?.name || "Unknown"}
                                    </TableCell>
                                    <TableCell className="text-xs text-muted-foreground">
                                        {interaction.createdBy?.name || "-"}
                                        <br />
                                        {format(new Date(interaction.createdAt || new Date()), "MMM d, HH:mm")}
                                    </TableCell>
                                    <TableCell className="text-xs text-muted-foreground">
                                        {interaction.updatedBy?.name || "-"}
                                        <br />
                                        {format(new Date(interaction.updatedAt || new Date()), "MMM d, HH:mm")}
                                    </TableCell>
                                    <TableCell>
                                        <Button variant="ghost" size="sm">Edit</Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {(!interactions || interactions.length === 0) && (
                                <TableRow>
                                    <TableCell colSpan={8} className="text-center h-24 text-muted-foreground">
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
