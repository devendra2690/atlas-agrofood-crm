import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDistanceToNow } from "date-fns";

interface RecentActivityProps {
    activities: {
        id: string;
        user: { name: string | null; image: string | null } | null;
        action: string;
        target: string;
        timestamp: Date;
        details: string;
    }[];
}

export function RecentActivity({ activities }: RecentActivityProps) {
    return (
        <Card className="col-span-1">
            <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>
                    Latest actions in the workspace.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-8">
                    {activities.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-4">No recent activity.</p>
                    ) : (
                        activities.map((activity) => (
                            <div key={activity.id} className="flex items-center">
                                <Avatar className="h-9 w-9">
                                    <AvatarImage src={activity.user?.image || undefined} alt="Avatar" />
                                    <AvatarFallback>{activity.user?.name?.slice(0, 2).toUpperCase() || "??"}</AvatarFallback>
                                </Avatar>
                                <div className="ml-4 space-y-1">
                                    <p className="text-sm font-medium leading-none">
                                        {activity.user?.name} <span className="text-muted-foreground font-normal">{activity.action}</span>
                                    </p>
                                    <p className="text-sm text-muted-foreground">
                                        {activity.target}
                                        {activity.details && <span className="block text-xs mt-1 text-slate-400 italic">"{activity.details.slice(0, 50)}{activity.details.length > 50 ? '...' : ''}"</span>}
                                    </p>
                                </div>
                                <div className="ml-auto font-medium text-xs text-muted-foreground">
                                    {formatDistanceToNow(activity.timestamp, { addSuffix: true })}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
