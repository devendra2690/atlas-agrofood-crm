import { auth } from "@/auth";
import { Separator } from "@/components/ui/separator";
import { ProfileForm } from "@/components/forms/profile-form";

export default async function SettingsProfilePage() {
    const session = await auth();
    const user = session?.user;

    if (!user) {
        return <div>Unauthorized</div>;
    }

    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-lg font-medium">Profile</h3>
                <p className="text-sm text-muted-foreground">
                    Manage your public profile settings.
                </p>
            </div>
            <Separator />
            <ProfileForm user={{
                name: user.name,
                email: user.email,
                role: user.role
            }} />
        </div>
    );
}
