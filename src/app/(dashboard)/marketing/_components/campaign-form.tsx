
"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Loader2, Send, Users } from "lucide-react";
import { getRecipients, sendCampaign } from "@/app/actions/campaigns";
import { getCommodities } from "@/app/actions/commodity";
import { getCountries, getStates } from "@/app/actions/location";

export function CampaignForm() {
    const [loading, setLoading] = useState(false);
    const [calculating, setCalculating] = useState(false);
    const [audienceType, setAudienceType] = useState<"ALL" | "COMMODITY" | "LOCATION">("ALL");
    const [selectedCommodity, setSelectedCommodity] = useState<string>("");
    const [selectedCountry, setSelectedCountry] = useState<string>("");
    const [selectedState, setSelectedState] = useState<string>("");
    const [subject, setSubject] = useState("");
    const [content, setContent] = useState("");
    const [sender, setSender] = useState<"DEFAULT" | "ME">("DEFAULT");
    const [service, setService] = useState<"RESEND" | "SES" | "AUTO">("AUTO");

    // Data state
    const [commodities, setCommodities] = useState<{ id: string; name: string }[]>([]);
    const [countries, setCountries] = useState<{ id: string; name: string }[]>([]);
    const [states, setStates] = useState<{ id: string; name: string }[]>([]);
    const [recipients, setRecipients] = useState<{ id: string; name: string; email: string | null }[]>([]);

    useEffect(() => {
        // Load Commodities and Countries on mount
        getCommodities().then(res => {
            if (res.success && res.data) setCommodities(res.data);
        });
        getCountries().then(res => {
            if (res.success && res.data) setCountries(res.data);
        });
    }, []);

    // Load states when country changes
    useEffect(() => {
        if (selectedCountry) {
            getStates(selectedCountry).then(res => {
                if (res.success && res.data) setStates(res.data);
                else setStates([]);
            });
        } else {
            setStates([]);
        }
        setSelectedState(""); // Reset state when country changes
    }, [selectedCountry]);

    // Calculate recipients when filters change
    useEffect(() => {
        const fetchRecipients = async () => {
            setCalculating(true);
            try {
                if (audienceType === 'COMMODITY' && !selectedCommodity) {
                    setRecipients([]);
                    return;
                }
                if (audienceType === 'LOCATION' && !selectedCountry && !selectedState) {
                    // Allow empty state (just country), but if neither, empty
                    if (!selectedCountry) {
                        setRecipients([]);
                        return;
                    }
                }

                const res = await getRecipients({
                    type: audienceType,
                    commodityId: selectedCommodity || undefined,
                    countryId: selectedCountry || undefined,
                    stateId: selectedState || undefined
                });

                if (res.success && res.data) {
                    setRecipients(res.data);
                } else {
                    setRecipients([]);
                }
            } catch (error) {
                console.error(error);
            } finally {
                setCalculating(false);
            }
        };

        const debounce = setTimeout(fetchRecipients, 300);
        return () => clearTimeout(debounce);
    }, [audienceType, selectedCommodity, selectedCountry, selectedState]);

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (recipients.length === 0) {
            toast.error("No valid recipients selected");
            return;
        }

        setLoading(true);
        try {
            const res = await sendCampaign({
                recipientIds: recipients.map(r => r.id),
                subject,
                content,
                senderType: sender,
                service
            });

            if (res.success) {
                toast.success(`Email sent to ${res.sent} recipients successfully`);
                // Reset form
                setSubject("");
                setContent("");
                setAudienceType("ALL");
                setSelectedCommodity("");
                setSelectedCountry("");
                setSelectedState("");
            } else {
                toast.error(res.error || "Failed to send campaign");
            }
        } catch (error) {
            toast.error("Unexpected error occurred");
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSend}>
            <Card>
                <CardHeader>
                    <CardTitle>New Campaign</CardTitle>
                    <CardDescription>
                        Compose and send email updates to your vendors and clients.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* Audience Section */}
                    <div className="space-y-4">
                        <Label>Audience</Label>
                        <RadioGroup
                            defaultValue="ALL"
                            className="flex flex-col space-y-2"
                            value={audienceType}
                            onValueChange={(val: "ALL" | "COMMODITY" | "LOCATION") => setAudienceType(val)}
                        >
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="ALL" id="all" />
                                <Label htmlFor="all">All Contacts (Vendors & Clients)</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="COMMODITY" id="commodity" />
                                <Label htmlFor="commodity">Filter by Commodity</Label>
                            </div>
                            {/* Location Filter Option */}
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="LOCATION" id="location" />
                                <Label htmlFor="location">Filter by Location</Label>
                            </div>
                        </RadioGroup>

                        {audienceType === 'COMMODITY' && (
                            <div className="pl-6 pt-2 w-full md:w-1/2">
                                <Select value={selectedCommodity} onValueChange={setSelectedCommodity}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select commodity..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {commodities.map(c => (
                                            <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        )}

                        {audienceType === 'LOCATION' && (
                            <div className="pl-6 pt-2 w-full md:w-1/2 space-y-3">
                                <Select value={selectedCountry} onValueChange={setSelectedCountry}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select Country..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {countries.map(c => (
                                            <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>

                                <Select value={selectedState} onValueChange={setSelectedState} disabled={!selectedCountry || states.length === 0}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select State (Optional)..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {states.map(s => (
                                            <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        )}
                    </div>

                    {/* Sender Selection */}
                    <div className="space-y-4">
                        <Label>Send From</Label>
                        <RadioGroup
                            defaultValue="DEFAULT"
                            className="flex flex-col space-y-2"
                            onValueChange={(val: "DEFAULT" | "ME") => setSender(val)}
                        >
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="DEFAULT" id="sender-default" />
                                <Label htmlFor="sender-default">Sales Team (sales@atlasagrofood.co.in)</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="ME" id="sender-me" />
                                <Label htmlFor="sender-me">Myself (as {process.env.NEXT_PUBLIC_APP_URL ? "Use Reply-To" : "Sender"})</Label>
                            </div>
                        </RadioGroup>
                    </div>

                    {/* Service Selection (Resend vs SES) */}
                    <div className="space-y-4">
                        <Label>Email Service</Label>
                        <RadioGroup
                            defaultValue="AUTO"
                            className="flex flex-col space-y-2"
                            onValueChange={(val: "RESEND" | "SES" | "AUTO") => setService(val)}
                        >
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="AUTO" id="service-auto" />
                                <Label htmlFor="service-auto" className="font-semibold text-green-700">Auto (Smart Cost Optimization)</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="RESEND" id="service-resend" />
                                <Label htmlFor="service-resend">Resend Only</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="SES" id="service-ses" />
                                <Label htmlFor="service-ses">AWS SES Only</Label>
                            </div>
                        </RadioGroup>
                    </div>

                    {/* Recipient Count Indicator */}
                    <div className="flex items-center gap-2 p-3 bg-slate-50 border rounded-md text-sm text-slate-600">
                        {calculating ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <Users className="h-4 w-4" />
                        )}
                        <span>
                            {calculating
                                ? "Calculating recipients..."
                                : `Targeting ${recipients.length} recipients`}
                        </span>
                    </div>

                    {/* Email Content */}
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="subject">Subject</Label>
                            <Input
                                id="subject"
                                placeholder="E.g. Monthly Update or Banana Procurement Request"
                                value={subject}
                                onChange={(e) => setSubject(e.target.value)}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="message">Message</Label>
                            <Textarea
                                id="message"
                                placeholder="Write your message here..."
                                className="min-h-[200px]"
                                value={content}
                                onChange={(e) => setContent(e.target.value)}
                                required
                            />
                            <p className="text-xs text-muted-foreground">
                                This email will be sent individually to each recipient using the standard template.
                            </p>
                        </div>
                    </div>
                </CardContent>
                <CardFooter className="flex justify-between border-t pt-6">
                    <Button variant="ghost" type="button" onClick={() => {
                        setSubject("");
                        setContent("");
                    }}>
                        Clear
                    </Button>
                    <Button type="submit" disabled={loading || recipients.length === 0 || calculating}>
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {!loading && <Send className="mr-2 h-4 w-4" />}
                        Send Campaign
                    </Button>
                </CardFooter>
            </Card>
        </form>
    );
}
