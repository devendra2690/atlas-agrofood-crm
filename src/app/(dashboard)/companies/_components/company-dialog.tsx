"use client";

import { useState, useEffect } from "react";

import { Plus, Loader2, Pencil } from "lucide-react";
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
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { createCompany, updateCompany } from "@/app/actions/company";
import { getCommodities } from "@/app/actions/commodity";
import { getCountries, getStates, getCities } from "@/app/actions/location";
import { CompanyType } from "@prisma/client";

interface CompanyDialogProps {
    company?: any; // Using any for now to avoid deep type import issues, ideally should be a partial Company type with commodities
    trigger?: React.ReactNode;
    defaultType?: CompanyType;
    initialCommodities: { id: string; name: string }[];
    initialCountries: { id: string; name: string }[];
    buttonLabel?: string;
}

export function CompanyDialog({ company, trigger, defaultType = "PROSPECT", initialCommodities, initialCountries, buttonLabel }: CompanyDialogProps) {
    const [open, setOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const isEditMode = !!company;

    // Form State
    const [formData, setFormData] = useState<{
        name: string;
        type: CompanyType;
        phone: string;
        email: string;
        website: string;
        contactName: string;
    }>({
        name: "",
        type: defaultType,
        phone: "",
        email: "",
        website: "",
        contactName: "",
    });

    // Location State
    const [countryId, setCountryId] = useState<string>("");
    const [stateId, setStateId] = useState<string>("");
    const [cityId, setCityId] = useState<string>("");

    // Data State
    const [countries, setCountries] = useState<{ id: string, name: string }[]>(initialCountries);
    const [states, setStates] = useState<{ id: string, name: string }[]>([]);
    const [cities, setCities] = useState<{ id: string, name: string }[]>([]);

    // Commodity State
    const [availableCommodities, setAvailableCommodities] = useState<{ id: string, name: string }[]>(initialCommodities);
    const [selectedCommodities, setSelectedCommodities] = useState<string[]>([]);

    // Init Edit Data
    useEffect(() => {
        if (company) {
            setFormData({
                name: company.name,
                type: company.type,
                phone: company.phone || "",
                email: company.email || "",
                website: company.website || "",
                contactName: company.contactName || "",
            });
            // Pre-select commodities
            if (company.commodities) {
                setSelectedCommodities(company.commodities.map((c: any) => c.id));
            }

            // Handle Location Pre-filling
            if (company.countryId) {
                setCountryId(company.countryId);
                // Load states for this country
                getStates(company.countryId).then(res => {
                    if (res.success && res.data) {
                        setStates(res.data);
                        if (company.stateId) {
                            setStateId(company.stateId);
                            // Load cities for this state
                            getCities(company.stateId).then(cRes => {
                                if (cRes.success && cRes.data) {
                                    setCities(cRes.data);
                                    if (company.cityId) setCityId(company.cityId);
                                }
                            });
                        }
                    }
                });
            }
        }
    }, [company, open]);

    // Handle Country Change
    const handleCountryChange = async (val: string) => {
        setCountryId(val);
        setStateId("");
        setCityId("");
        setStates([]);
        setCities([]);

        const res = await getStates(val);
        if (res.success && res.data) setStates(res.data);
    };

    // Handle State Change
    const handleStateChange = async (val: string) => {
        setStateId(val);
        setCityId("");
        setCities([]);

        const res = await getCities(val);
        if (res.success && res.data) setCities(res.data);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        const errors: string[] = [];
        if (!formData.name) errors.push("Name is required");
        if (!formData.phone) errors.push("Phone is required");
        if (errors.length > 0) {
            setError(errors.join("\n"));
            setIsLoading(false);
            return;
        }

        try {
            const data = {
                name: formData.name,
                type: formData.type as CompanyType,
                phone: formData.phone || undefined,
                email: formData.email || undefined,
                website: formData.website || undefined,
                contactName: formData.contactName || undefined,
                countryId: countryId || undefined,
                stateId: stateId || undefined,
                cityId: cityId || undefined,
                commodityIds: selectedCommodities
            };

            let result;
            if (isEditMode) {
                result = await updateCompany(company.id, data);
            } else {
                result = await createCompany(data);
            }

            if (result.success) {
                setOpen(false);
                if (!isEditMode) {
                    setFormData({ name: "", type: defaultType, phone: "", email: "", website: "", contactName: "" });
                    setCountryId("");
                    setStateId("");
                    setCityId("");
                    setSelectedCommodities([]);
                }
            } else {
                setError(result.error || "Failed to save company");
            }
        } catch (error) {
            console.error(error);
            setError("An unexpected error occurred");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
            {/* ... AlertDialog ... */}
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogTrigger asChild>
                    {trigger ? trigger : (
                        <Button>
                            <Plus className="mr-2 h-4 w-4" /> {buttonLabel || "Add Company"}
                        </Button>
                    )}
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px] overflow-y-auto max-h-[90vh]">
                    <form onSubmit={handleSubmit}>
                        <DialogHeader>
                            <DialogTitle>{isEditMode ? "Edit Company" : (buttonLabel || "Add New Company")}</DialogTitle>
                            <DialogDescription>
                                {isEditMode ? "Update company details." : "Create a new profile."}
                            </DialogDescription>
                            {error && (
                                <div className="bg-destructive/15 text-destructive text-sm p-3 rounded-md mt-2">
                                    {error}
                                </div>
                            )}
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid grid-cols-[120px_1fr] items-center gap-4">
                                <Label htmlFor="name" className="text-right">
                                    Name <span className="text-red-500">*</span>
                                </Label>
                                <Input
                                    id="name"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="grid grid-cols-[120px_1fr] items-center gap-4">
                                <Label htmlFor="type" className="text-right">
                                    Type <span className="text-red-500">*</span>
                                </Label>
                                <Select
                                    value={formData.type}
                                    onValueChange={(val) => setFormData({ ...formData, type: val as CompanyType })}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {(defaultType as string === "VENDOR" || (isEditMode && company.type as string === "VENDOR")) ? (
                                            <SelectItem value="VENDOR">Vendor</SelectItem>
                                        ) : (defaultType as string === "PARTNER" || (isEditMode && company.type as string === "PARTNER")) ? (
                                            <SelectItem value="PARTNER">Partner</SelectItem>
                                        ) : (
                                            <>
                                                <SelectItem value="PROSPECT">Prospect</SelectItem>
                                                <SelectItem value="CLIENT">Client</SelectItem>
                                            </>
                                        )}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid grid-cols-[120px_1fr] items-center gap-4">
                                <Label htmlFor="phone" className="text-right">
                                    Phone <span className="text-red-500">*</span>
                                </Label>
                                <Input
                                    id="phone"
                                    value={formData.phone}
                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                />
                            </div>
                            <div className="grid grid-cols-[120px_1fr] items-center gap-4">
                                <Label htmlFor="email" className="text-right">
                                    Email
                                </Label>
                                <Input
                                    id="email"
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                />
                            </div>
                            <div className="grid grid-cols-[120px_1fr] items-center gap-4">
                                <Label htmlFor="website" className="text-right">
                                    Website
                                </Label>
                                <Input
                                    id="website"
                                    value={formData.website}
                                    onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                                    placeholder="https://example.com"
                                />
                            </div>
                            <div className="grid grid-cols-[120px_1fr] items-center gap-4">
                                <Label htmlFor="contactName" className="text-right whitespace-nowrap">
                                    Contact Person
                                </Label>
                                <Input
                                    id="contactName"
                                    value={formData.contactName}
                                    onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
                                />
                            </div>

                            {/* Location Fields */}
                            <div className="grid grid-cols-[120px_1fr] items-center gap-4">
                                <Label className="text-right">Country</Label>
                                <Select value={countryId} onValueChange={handleCountryChange}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select Country" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {countries.map(c => (
                                            <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="grid grid-cols-[120px_1fr] items-center gap-4">
                                <Label className="text-right">State</Label>
                                <Select value={stateId} onValueChange={handleStateChange} disabled={!countryId}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select State" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {states.map(s => (
                                            <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="grid grid-cols-[120px_1fr] items-center gap-4">
                                <Label className="text-right">City</Label>
                                <Select value={cityId} onValueChange={(val) => setCityId(val)} disabled={!stateId}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select City" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {cities.map(c => (
                                            <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="grid grid-cols-[120px_1fr] items-start gap-4">
                                <Label className="text-right pt-2">
                                    Commodities
                                </Label>
                                <div className="border rounded-md p-3 h-32 overflow-y-auto space-y-2">
                                    {availableCommodities.length === 0 ? (
                                        <p className="text-sm text-muted-foreground">No commodities found. Add some in Settings.</p>
                                    ) : (
                                        availableCommodities.map(c => (
                                            <div key={c.id} className="flex items-center space-x-2">
                                                <input
                                                    type="checkbox"
                                                    id={`commodity-${c.id}`}
                                                    className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                                                    checked={selectedCommodities.includes(c.id)}
                                                    onChange={(e) => {
                                                        if (e.target.checked) {
                                                            setSelectedCommodities([...selectedCommodities, c.id]);
                                                        } else {
                                                            setSelectedCommodities(selectedCommodities.filter(id => id !== c.id));
                                                        }
                                                    }}
                                                />
                                                <label
                                                    htmlFor={`commodity-${c.id}`}
                                                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                                                >
                                                    {c.name}
                                                </label>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button type="submit" disabled={isLoading}>
                                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {isEditMode
                                    ? "Save Changes"
                                    : (formData.type as string === "VENDOR" ? "Save Vendor" : (formData.type as string === "PARTNER" ? "Save Partner" : "Save Company"))
                                }
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog >
        </>
    );
}
