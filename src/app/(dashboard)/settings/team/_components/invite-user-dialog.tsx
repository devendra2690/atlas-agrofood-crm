"use client";

import { useState } from "react";
import { createInvitation } from "@/app/actions/invitation";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Copy, Plus, Check } from "lucide-react";

export function InviteUserDialog() {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [email, setEmail] = useState("");
    const [role, setRole] = useState("SALES");
    const [inviteLink, setInviteLink] = useState("");
    const [copied, setCopied] = useState(false);

    const handleInvite = async () => {
        if (!email) {
            toast.error("Please enter an email");
            return;
        }

        setLoading(true);
        try {
            // @ts-ignore
            const result = await createInvitation(email, role);
            if (result.success) {
                toast.success("Invitation created!");
                // Construct full URL (assuming client side execution preserves Origin)
                const origin = window.location.origin;
                setInviteLink(`${origin}${result.path}`);
            } else {
                toast.error(result.error || "Failed to create invitation");
            }
        } catch (error) {
            toast.error("An error occurred");
        } finally {
            setLoading(false);
        }
    };

    const copyToClipboard = () => {
        navigator.clipboard.writeText(inviteLink);
        setCopied(true);
        toast.success("Copied to clipboard!");
        setTimeout(() => setCopied(false), 2000);
    };

    const closeAndReset = () => {
        setOpen(false);
        setInviteLink("");
        setEmail("");
        setRole("SALES");
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button>
                    <Plus className="mr-2 h-4 w-4" /> Invite Member
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Invite Team Member</DialogTitle>
                    <DialogDescription>
                        Generate a secure invitation link for a new user.
                    </DialogDescription>
                </DialogHeader>

                {!inviteLink ? (
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                placeholder="colleague@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="role">Role</Label>
                            <Select value={role} onValueChange={setRole}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select role" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="SALES">Sales</SelectItem>
                                    <SelectItem value="PROCUREMENT">Procurement</SelectItem>
                                    <SelectItem value="FINANCE">Finance</SelectItem>
                                    <SelectItem value="ADMIN">Admin</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                ) : (
                    <div className="grid gap-4 py-4">
                        <div className="p-4 bg-muted rounded-md text-sm break-all font-mono border">
                            {inviteLink}
                        </div>
                        <Button variant="secondary" onClick={copyToClipboard} className="w-full">
                            {copied ? <Check className="mr-2 h-4 w-4" /> : <Copy className="mr-2 h-4 w-4" />}
                            {copied ? "Copied" : "Copy Link"}
                        </Button>
                    </div>
                )}

                <DialogFooter>
                    {!inviteLink ? (
                        <Button onClick={handleInvite} disabled={loading}>
                            {loading ? "Generating..." : "Generate Link"}
                        </Button>
                    ) : (
                        <Button onClick={closeAndReset}>Done</Button>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
