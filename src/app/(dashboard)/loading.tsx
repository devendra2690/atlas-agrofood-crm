import { Loader2 } from "lucide-react";

export default function DashboardLoading() {
    return (
        <div className="flex h-full w-full items-center justify-center min-h-[50vh]">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
    );
}
