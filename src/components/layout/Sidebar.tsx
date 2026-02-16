"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
    LayoutDashboard,
    Users,
    Phone,
    TrendingUp,
    PackageSearch,
    Factory,
    FlaskConical,
    ShoppingCart,
    FileText,
    CreditCard,
    DollarSign,
    Settings,
    Truck,
    LogOut,
    Activity,
    ClipboardList,
    Menu,
    Database,
    MessageSquare,
    Megaphone,
    LineChart,
    Calculator
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { logout } from "@/app/actions/auth-actions";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { useState } from "react";

const sidebarItems = [
    {
        title: "Overview",
        items: [
            { name: "Dashboard", href: "/", icon: LayoutDashboard },
            { name: "Activity", href: "/activity", icon: Activity },
        ]
    },
    {
        title: "Sales",
        items: [
            { name: "Companies", href: "/companies", icon: Users },
            { name: "Interactions", href: "/interactions", icon: Phone },
            { name: "Opportunities", href: "/opportunities", icon: TrendingUp },
            { name: "Orders", href: "/sales-orders", icon: ShoppingCart },
        ]
    },
    {
        title: "Procurement",
        items: [
            { name: "Projects", href: "/procurement", icon: PackageSearch },
            { name: "Vendors", href: "/vendors", icon: Factory },
            { name: "Partners", href: "/partners", icon: Users }, // Added Partners
            { name: "Samples", href: "/samples", icon: FlaskConical },
            { name: "Purchase Orders", href: "/purchase-orders", icon: FileText },
            { name: "Logistics", href: "/logistics", icon: Truck },
            { name: "Vendor Matrix", href: "/matrix", icon: Database },
            { name: "Mandi Prices", href: "https://devendra2690.github.io/mandi-price-tracker/", icon: LineChart },
        ]
    },
    {
        title: "Finance",
        items: [
            { name: "Invoices (AR)", href: "/invoices", icon: FileText },
            { name: "Bills (AP)", href: "/bills", icon: CreditCard },
            { name: "Profitability", href: "/finance", icon: DollarSign },
        ]
    },
    {
        title: "Collaboration",
        items: [
            { name: "Tasks", href: "/tasks", icon: ClipboardList },
            { name: "Discussions", href: "/notes", icon: MessageSquare },
            { name: "Marketing", href: "/marketing", icon: Megaphone },
        ]
    },
    {
        title: "Tools",
        items: [
            { name: "Quote Calculator", href: "/tools/quote-calculator", icon: Calculator },
        ]
    },
];

interface SidebarProps {
    user?: {
        name?: string | null;
        email?: string | null;
        image?: string | null;
        role?: string;
    };
    className?: string; // Add className prop
}

function SidebarContent({ user, pathname, onNavigate }: { user?: any, pathname: string, onNavigate?: () => void }) {
    const filteredItems = sidebarItems.map(group => {
        // 1. Filter items within the group
        const items = group.items.filter(item => {
            if (item.name === "Activity" && user?.role !== "ADMIN") return false;
            return true;
        });

        // 2. Filter entire group (e.g. Finance)
        // if (group.title === "Finance" && user?.role !== "ADMIN") return null;

        if (items.length === 0) return null;

        return { ...group, items };
    }).filter(Boolean) as typeof sidebarItems;

    return (
        <div className="flex flex-col h-[100dvh] w-full bg-slate-900 text-white overflow-hidden">
            <div className="p-6 border-b border-slate-800 shrink-0">
                <Link href="/" className="flex items-center gap-2">
                    <h1 className="text-2xl font-bold tracking-tight text-white/90">
                        Atlas<span className="text-blue-500">CRM</span>
                    </h1>
                </Link>
            </div>

            <div className="flex-1 overflow-y-auto min-h-0 pt-4 pb-24 overscroll-contain">
                {filteredItems.map((group, i) => (
                    <div key={i} className="mb-6 px-4">
                        <h3 className="mb-2 px-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
                            {group.title}
                        </h3>
                        <div className="space-y-1">
                            {group.items.map((item) => (
                                <SidebarItem key={item.href} item={item} pathname={pathname} onNavigate={onNavigate} />
                            ))}
                        </div>
                    </div>
                ))}
            </div>
            {/* User info can be added here if needed */}
        </div>
    );
}

export function Sidebar({ user, className }: SidebarProps) {
    const pathname = usePathname();

    return (
        <div className={cn("hidden md:flex w-64 flex-col h-screen sticky top-0 border-r border-slate-800 shrink-0", className)}>
            <SidebarContent user={user} pathname={pathname} />
        </div>
    );
}

export function MobileSidebar({ user }: SidebarProps) {
    const pathname = usePathname();
    const [open, setOpen] = useState(false);

    return (
        <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden -ml-2">
                    <Menu className="h-6 w-6" />
                </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-72 bg-slate-900 border-r-slate-800 text-white">
                <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
                <SidebarContent user={user} pathname={pathname} onNavigate={() => setOpen(false)} />
            </SheetContent>
        </Sheet>
    );
}

function SidebarItem({ item, pathname, onNavigate }: { item: any, pathname: string, onNavigate?: () => void }) {
    const isActive = item.href === "/"
        ? pathname === "/"
        : pathname.startsWith(item.href);

    const isExternal = item.href.startsWith("http");

    return (
        <Link
            href={item.href}
            className={cn(
                "flex items-center rounded-md px-2 py-2 text-sm font-medium transition-colors hover:bg-slate-800 hover:text-white",
                isActive ? "bg-blue-600 text-white hover:bg-blue-700" : "text-slate-300"
            )}
            onClick={onNavigate}
            target={isExternal ? "_blank" : undefined}
            rel={isExternal ? "noopener noreferrer" : undefined}
        >
            <item.icon className="mr-2 h-4 w-4" />
            {item.name}
        </Link>
    );
}
