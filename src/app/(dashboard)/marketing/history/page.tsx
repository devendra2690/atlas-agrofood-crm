import { getEmailLogs } from "@/app/actions/logs";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { LogViewer } from "./_components/log-viewer";

export default async function HistoryPage() {
    const { data: logs } = await getEmailLogs();

    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            <div className="flex items-center space-x-4 mb-6">
                <Link href="/marketing">
                    <Button variant="outline" size="icon">
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                </Link>
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Campaign History</h2>
                    <p className="text-muted-foreground">Log of recently sent emails.</p>
                </div>
            </div>

            <div className="border rounded-md">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Time</TableHead>
                            <TableHead>Recipient</TableHead>
                            <TableHead>Subject</TableHead>
                            <TableHead>Provider</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Action</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {!logs || logs.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center h-24 text-muted-foreground">
                                    No logs found.
                                </TableCell>
                            </TableRow>
                        ) : (
                            logs.map((log) => (
                                <TableRow key={log.id}>
                                    <TableCell className="whitespace-nowrap">
                                        {format(new Date(log.sentAt), "MMM d, yyyy HH:mm")}
                                    </TableCell>
                                    <TableCell>{log.recipientEmail}</TableCell>
                                    <TableCell>{log.subject}</TableCell>
                                    <TableCell>
                                        <Badge variant={log.provider === 'SES' ? 'default' : 'secondary'}>
                                            {log.provider}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50">
                                            Sent
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <LogViewer subject={log.subject} body={log.body} />
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
