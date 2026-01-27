import { NotificationsDropdown } from "@/components/layout/notifications-dropdown";
import { getDeadlineAlerts } from "@/app/actions/notifications";
import { Sidebar, MobileSidebar } from "@/components/layout/Sidebar";
import { UserNav } from "@/components/layout/user-nav";
import { auth } from "@/auth";
import { SearchCommand } from "@/components/layout/search-command";

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const session = await auth();
    const user = session?.user;

    // Fetch notifications
    const { data: alerts } = await getDeadlineAlerts();

    return (
        <div className="flex min-h-screen bg-slate-50">
            <Sidebar user={user} />
            <div className="flex-1 flex flex-col min-w-0">
                <header className="h-16 border-b bg-white px-6 flex items-center gap-4 sticky top-0 z-10">
                    <MobileSidebar user={user} />
                    <div className="flex-1">
                        <h2 className="text-lg font-semibold text-slate-800">Workspace</h2>
                    </div>
                    <div className="flex items-center gap-4">
                        <SearchCommand />
                        <NotificationsDropdown alerts={alerts || []} />
                        <UserNav user={user || undefined} />
                    </div>
                </header>
                <main className="flex-1 p-6 overflow-auto">
                    {children}
                </main>
            </div>
        </div>
    );
}
