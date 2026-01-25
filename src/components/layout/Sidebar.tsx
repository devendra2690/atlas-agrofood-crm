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
    LogOut
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { logout } from "@/app/actions/auth-actions";

const sidebarItems = [
    {
        title: "Overview",
        items: [
            { name: "Dashboard", href: "/", icon: LayoutDashboard },
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
            { name: "Samples", href: "/samples", icon: FlaskConical },
            { name: "Purchase Orders", href: "/purchase-orders", icon: FileText },
            { name: "Logistics", href: "/logistics", icon: Truck },
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
];

interface SidebarProps {
    user?: {
        name?: string | null;
        email?: string | null;
        image?: string | null;
        role?: string;
    };
}

export function Sidebar({ user }: SidebarProps) {
    const pathname = usePathname();

    return (
        <div className="flex bg-slate-900 text-white w-64 flex-col h-screen fixed left-0 top-0 border-r border-slate-800">
            <div className="p-6 border-b border-slate-800">
                <h1 className="text-2xl font-bold tracking-tight text-white/90">
                    Atlas<span className="text-blue-500">CRM</span>
                </h1>
            </div>

            <div className="flex-1 overflow-y-auto py-4">
                {sidebarItems.map((group, i) => (
                    <div key={i} className="mb-6 px-4">
                        <h3 className="mb-2 px-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
                            {group.title}
                        </h3>
                        <div className="space-y-1">
                            {group.items.map((item) => (
                                <SidebarItem key={item.href} item={item} pathname={pathname} />
                            ))}
                        </div>
                    </div>
                ))}


            </div>

            {/* User Profile & Logout - MOVED TO HEADER */}

        </div>
    );
}

function SidebarItem({ item, pathname }: { item: any, pathname: string }) {
    const isActive = item.href === "/"
        ? pathname === "/"
        : pathname.startsWith(item.href);

    return (
        <Link
            href={item.href}
            className={cn(
                "flex items-center rounded-md px-2 py-2 text-sm font-medium transition-colors hover:bg-slate-800 hover:text-white",
                isActive ? "bg-blue-600 text-white hover:bg-blue-700" : "text-slate-300"
            )}
        >
            <item.icon className="mr-2 h-4 w-4" />
            {item.name}
        </Link>
    );
}
