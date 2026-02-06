import { format } from "date-fns";
import { InteractionLog, User } from "@prisma/client";
import { LogInteractionDialog } from "./log-interaction-dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageSquare, Calendar, User as UserIcon } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

type InteractionWithUser = InteractionLog & {
    user: {
        name: string | null;
        image?: string | null; // Optional if we add avatar later
    };
};

interface InteractionTimelineProps {
    companyId: string;
    interactions: InteractionWithUser[];
}

export function InteractionTimeline({ companyId, interactions }: InteractionTimelineProps) {
    return (
        <Card className="h-full">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-lg font-medium">Interaction Timeline</CardTitle>
                <LogInteractionDialog companyId={companyId} />
            </CardHeader>
            <CardContent className="pt-4">
                <div className="relative space-y-6 pl-2 before:absolute before:inset-0 before:ml-5 before:h-full before:w-0.5 before:-translate-x-px before:bg-slate-200 bf-bg-slate-200">
                    {interactions.length === 0 ? (
                        <div className="text-center text-muted-foreground py-8">
                            No interactions recorded yet.
                        </div>
                    ) : (
                        interactions.map((interaction) => (
                            <div key={interaction.id} className="relative flex gap-4">
                                <div className="absolute left-0 mt-0.5 flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 ring-4 ring-white">
                                    <MessageSquare className="h-5 w-5 text-slate-500" />
                                </div>
                                <div className="ml-12 flex-1 space-y-2">
                                    <div className="rounded-lg border bg-card p-4 text-card-foreground shadow-sm">
                                        <div className="flex items-center justify-between space-x-2 text-sm">
                                            <div className="flex items-center gap-2 font-medium">
                                                <Avatar className="h-6 w-6">
                                                    <AvatarFallback className="text-xs">
                                                        {(interaction.user.name || "User").substring(0, 2).toUpperCase()}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <span>{interaction.user.name}</span>
                                            </div>
                                            <span className="text-muted-foreground">
                                                {format(new Date(interaction.date), "MMM d, yyyy h:mm a")}
                                            </span>
                                        </div>
                                        <div className="mt-2 text-sm text-slate-700 leading-relaxed">
                                            {interaction.description}
                                        </div>
                                        {(interaction.nextFollowUp || interaction.status) && (
                                            <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground border-t pt-2">
                                                {interaction.nextFollowUp && (
                                                    <div className="flex items-center gap-1">
                                                        <Calendar className="h-3 w-3" />
                                                        Follow up: {format(new Date(interaction.nextFollowUp), "MMM d, yyyy")}
                                                    </div>
                                                )}
                                                <div className="flex items-center gap-1">
                                                    <span className={`px-2 py-0.5 rounded-full ${interaction.status === 'CLOSED'
                                                        ? 'bg-green-100 text-green-700'
                                                        : 'bg-blue-100 text-blue-700'
                                                        }`}>
                                                        {interaction.status === 'CLOSED' ? 'Closed' : 'Follow-up Scheduled'}
                                                    </span>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
