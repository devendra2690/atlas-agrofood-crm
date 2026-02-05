import { CampaignForm } from "./_components/campaign-form";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { getCommodities } from "@/app/actions/commodity";
import { getCountries } from "@/app/actions/location";

import { getRecipients } from "@/app/actions/campaigns";

export default async function MarketingPage() {
    const [commoditiesRes, countriesRes, recipientsRes] = await Promise.all([
        getCommodities(),
        getCountries(),
        getRecipients({ type: "ALL" })
    ]);

    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            <div className="flex items-center justify-between space-y-2">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Marketing Campaigns</h2>
                    <p className="text-muted-foreground">Send bulk emails to your network based on commodities.</p>
                </div>
                <div className="flex items-center space-x-2">
                    <Link href="/marketing/history">
                        <Button variant="outline">View History</Button>
                    </Link>
                </div>
            </div>

            <div className="max-w-3xl mx-auto mt-6">
                <CampaignForm
                    initialCommodities={commoditiesRes.data || []}
                    initialCountries={countriesRes.data || []}
                    initialRecipients={recipientsRes.data || []}
                />
            </div>
        </div>
    );
}
