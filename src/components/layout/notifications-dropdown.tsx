"use client";

import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { NotificationItem } from "@/app/actions/notifications";

interface NotificationsDropdownProps {
    alerts: NotificationItem[];
}

export function NotificationsDropdown({ alerts }: NotificationsDropdownProps) {
    const overdueCount = alerts.filter(a => a.type === "OVERDUE").length;
    const hasAlerts = alerts.length > 0;

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                    <Bell className="h-5 w-5" />
                    {hasAlerts && (
                        <span className={cn(
                            "absolute top-2 right-2 h-2 w-2 rounded-full",
                            overdueCount > 0 ? "bg-red-500" : "bg-amber-500"
                        )} />
                    )}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-80" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">Notifications</p>
                        <p className="text-xs leading-none text-muted-foreground">
                            {hasAlerts
                                ? `You have ${alerts.length} upcoming deadlines`
                                : "No new notifications"}
                        </p>
                    </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <ScrollArea className="h-[300px]">
                    {hasAlerts ? (
                        alerts.map((alert) => (
                            <DropdownMenuItem key={alert.id} asChild className="p-0 mb-1 cursor-pointer">
                                <Link href={alert.link} className="flex flex-col items-start px-4 py-3 hover:bg-slate-50">
                                    <div className="flex w-full items-start justify-between">
                                        <span className={cn(
                                            "text-xs font-semibold px-1.5 py-0.5 rounded",
                                            alert.type === "OVERDUE"
                                                ? "bg-red-100 text-red-700"
                                                : "bg-amber-100 text-amber-700"
                                        )}>
                                            {alert.type === "OVERDUE" ? "Overdue" : "Due Soon"}
                                        </span>
                                        <span className="text-xs text-muted-foreground font-mono">{alert.time}</span>
                                    </div>
                                    <p className="text-sm font-medium mt-1">{alert.title}</p>
                                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                                        {alert.message}
                                    </p>
                                </Link>
                            </DropdownMenuItem>
                        ))
                    ) : (
                        <div className="p-4 text-center text-sm text-muted-foreground">
                            All caught up! 🎉
                        </div>
                    )}
                </ScrollArea>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
