"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { updateProfile } from "@/app/actions/settings";
import { useState } from "react";

export function ProfileForm({ user }: { user: { name: string | null; email: string | null; role: string } }) {
    const [name, setName] = useState(user.name || "");
    const [isPending, startTransition] = useTransition();

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        startTransition(async () => {
            const result = await updateProfile({ name });
            if (result.success) {
                toast.success("Profile updated successfully");
            } else {
                toast.error(result.error || "Failed to update profile");
            }
        });
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6 max-w-lg">
            <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" value={user.email || ""} disabled className="bg-slate-100" />
                <p className="text-[0.8rem] text-muted-foreground">
                    Email address cannot be changed.
                </p>
            </div>

            <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <Input id="role" value={user.role} disabled className="bg-slate-100" />
            </div>

            <div className="space-y-2">
                <Label htmlFor="name">Display Name</Label>
                <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your name"
                />
                <p className="text-[0.8rem] text-muted-foreground">
                    This is your public display name.
                </p>
            </div>

            <Button type="submit" disabled={isPending}>
                {isPending ? "Saving..." : "Update Profile"}
            </Button>
        </form>
    );
}
