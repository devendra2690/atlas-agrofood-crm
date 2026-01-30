"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { updateProfile } from "@/app/actions/settings";
import { useState } from "react";

import { Separator } from "@/components/ui/separator";
import { changePassword } from "@/app/actions/settings";
import { Eye, EyeOff } from "lucide-react";

export function ProfileForm({ user }: { user: { name: string | null; email: string | null; role: string } }) {
    const [name, setName] = useState(user.name || "");
    const [isPending, startTransition] = useTransition();

    // Password state
    const [oldPassword, setOldPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [isPasswordPending, startPasswordTransition] = useTransition();

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

    const handlePasswordSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (newPassword !== confirmPassword) {
            toast.error("New passwords do not match");
            return;
        }
        if (newPassword.length < 6) {
            toast.error("Password must be at least 6 characters");
            return;
        }

        startPasswordTransition(async () => {
            const result = await changePassword({ oldPassword, newPassword });
            if (result.success) {
                toast.success("Password updated successfully");
                setOldPassword("");
                setNewPassword("");
                setConfirmPassword("");
            } else {
                toast.error(result.error || "Failed to update password");
            }
        });
    };

    return (
        <div className="space-y-8 max-w-lg">
            <form onSubmit={handleSubmit} className="space-y-6">
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

            <Separator />

            <div className="space-y-4">
                <div>
                    <h3 className="text-lg font-medium">Change Password</h3>
                    <p className="text-sm text-muted-foreground">
                        Ensure your account is using a long, random password to stay secure.
                    </p>
                </div>

                <form onSubmit={handlePasswordSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="old-password">Current Password</Label>
                        <div className="relative">
                            <Input
                                id="old-password"
                                type={showPassword ? "text" : "password"}
                                value={oldPassword}
                                onChange={(e) => setOldPassword(e.target.value)}
                                required
                            />
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                                onClick={() => setShowPassword(!showPassword)}
                            >
                                {showPassword ? (
                                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                                ) : (
                                    <Eye className="h-4 w-4 text-muted-foreground" />
                                )}
                            </Button>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="new-password">New Password</Label>
                            <Input
                                id="new-password"
                                type="password"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                required
                                minLength={6}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="confirm-password">Confirm Password</Label>
                            <Input
                                id="confirm-password"
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required
                                minLength={6}
                            />
                        </div>
                    </div>

                    <Button type="submit" disabled={isPasswordPending}>
                        {isPasswordPending ? "Updating Password..." : "Change Password"}
                    </Button>
                </form>
            </div>
        </div>
    );
}
