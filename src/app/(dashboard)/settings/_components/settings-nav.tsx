"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { LucideIcon, Package, MapPin, Shield, User } from "lucide-react";

interface SettingsNavProps {
    items: {
        name: string;
        href: string;
        icon: LucideIcon;
    }[];
}

export function SettingsNav({ role }: { role?: string }) {
    const pathname = usePathname();

    const items = [
        { name: "Profile", href: "/settings/profile", icon: User },
        { name: "Commodities", href: "/settings/commodities", icon: Package },
        { name: "Locations", href: "/settings/locations", icon: MapPin },
    ];

    if (role === 'ADMIN') {
        items.push({ name: "Team Management", href: "/settings/team", icon: Shield });
    }

    return (
        <nav className="flex space-x-2 lg:flex-col lg:space-x-0 lg:space-y-1">
            {items.map((item) => (
                <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                        "flex items-center rounded-md px-3 py-2 text-sm font-medium hover:bg-slate-100",
                        pathname.startsWith(item.href)
                            ? "bg-slate-100 text-primary"
                            : "text-muted-foreground"
                    )}
                >
                    <item.icon className="mr-2 h-4 w-4" />
                    {item.name}
                </Link>
            ))}
        </nav>
    );
}
