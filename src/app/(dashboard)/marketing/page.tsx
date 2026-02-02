
import { CampaignForm } from "./_components/campaign-form";

export default function MarketingPage() {
    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            <div className="flex items-center justify-between space-y-2">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Marketing Campaigns</h2>
                    <p className="text-muted-foreground">Send bulk emails to your network based on commodities.</p>
                </div>
            </div>

            <div className="max-w-3xl mx-auto mt-6">
                <CampaignForm />
            </div>
        </div>
    );
}
