import { auth } from "@/auth";
import { getTeamMembers, createInvitation } from "@/app/actions/invitation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { InviteUserDialog } from "./_components/invite-user-dialog";
import { DeleteUserButton } from "./_components/delete-user-button";
import { redirect } from "next/navigation";

export default async function TeamSettingsPage() {
    const session = await auth();
    // @ts-ignore
    if (session?.user?.role !== 'ADMIN') {
        redirect("/");
    }

    const users = await getTeamMembers();

    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            <div className="flex items-center justify-between space-y-2">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Team Management</h2>
                    <p className="text-muted-foreground">Manage your team members and access levels.</p>
                </div>
                <InviteUserDialog />
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Active Users</CardTitle>
                    <CardDescription>
                        Total members: {users.length}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>User</TableHead>
                                    <TableHead>Email</TableHead>
                                    <TableHead>Role</TableHead>
                                    <TableHead>Joined</TableHead>
                                    <TableHead className="text-right">Status</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {users.map((user) => (
                                    <TableRow key={user.id}>
                                        <TableCell className="flex items-center gap-3">
                                            <Avatar className="h-9 w-9">
                                                <AvatarImage src={user.image || undefined} alt={user.name || ""} />
                                                <AvatarFallback>{user.name?.slice(0, 2).toUpperCase()}</AvatarFallback>
                                            </Avatar>
                                            <div className="font-medium">{user.name}</div>
                                        </TableCell>
                                        <TableCell>{user.email}</TableCell>
                                        <TableCell>
                                            <Badge variant="outline">{user.role}</Badge>
                                        </TableCell>
                                        <TableCell>{format(new Date(user.createdAt), "MMM d, yyyy")}</TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">
                                                    Active
                                                </Badge>
                                                <DeleteUserButton
                                                    userId={user.id}
                                                    userName={user.name || "User"}
                                                    // @ts-ignore
                                                    currentUserEmail={session?.user?.email || ""}
                                                    targetUserEmail={user.email}
                                                />
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
