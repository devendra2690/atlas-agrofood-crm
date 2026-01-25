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
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { format } from "date-fns";
import { Calendar, User, MessageSquare } from "lucide-react";
import { InteractionRow } from "./_components/interaction-row";

export default async function InteractionsPage() {
    const { data: interactions } = await getInteractions();

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
                </CardContent>
            </Card>
        </div>
    );
}
