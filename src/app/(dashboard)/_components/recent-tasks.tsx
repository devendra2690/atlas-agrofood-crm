import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface RecentTasksProps {
    tasks: {
        id: string;
        content: string;
        dueDate: Date | null;
        priority: string;
    }[];
}

export function RecentTasks({ tasks }: RecentTasksProps) {
    return (
        <Card className="col-span-1">
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle>My Tasks</CardTitle>
                    <CardDescription>Pending to-dos.</CardDescription>
                </div>
                <Button variant="ghost" size="sm" asChild>
                    <Link href="/notes">View All</Link>
                </Button>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {tasks.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-4">No pending tasks.</p>
                    ) : (
                        tasks.map((task) => (
                            <div key={task.id} className="flex items-start justify-between border-b pb-4 last:border-0 last:pb-0">
                                <div className="space-y-1">
                                    <p className="text-sm font-medium leading-none flex items-center gap-2">
                                        {task.content}
                                    </p>
                                    <div className="flex items-center gap-2 mt-2">
                                        <Badge variant="outline" className="text-[10px] h-5">
                                            {task.priority}
                                        </Badge>
                                        {task.dueDate && (
                                            <span className="text-xs text-muted-foreground">
                                                Due {new Date(task.dueDate).toLocaleDateString()}
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <Link href={`/notes?highlight=${task.id}`} className="text-muted-foreground hover:text-primary">
                                    <CheckCircle2 className="h-4 w-4" />
                                </Link>
                            </div>
                        ))
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
