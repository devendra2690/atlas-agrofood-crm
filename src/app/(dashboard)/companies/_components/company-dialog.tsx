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
}

export function CompanyDialog({ company, trigger, defaultType = "PROSPECT" }: CompanyDialogProps) {
    const [open, setOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const isEditMode = !!company;

    // Form State
    const [formData, setFormData] = useState({
        name: "",
        type: defaultType,
        phone: "",
        email: "",
    });

    // Location State
    const [countryId, setCountryId] = useState<string>("");
    const [stateId, setStateId] = useState<string>("");
    const [cityId, setCityId] = useState<string>("");

    // Data State
    const [countries, setCountries] = useState<{ id: string, name: string }[]>([]);
    const [states, setStates] = useState<{ id: string, name: string }[]>([]);
    const [cities, setCities] = useState<{ id: string, name: string }[]>([]);

    // Commodity State
    const [availableCommodities, setAvailableCommodities] = useState<{ id: string, name: string }[]>([]);
    const [selectedCommodities, setSelectedCommodities] = useState<string[]>([]);

    // Load Initial Data (Countries & Commodities)
    useEffect(() => {
        getCommodities().then(res => {
            if (res.success && res.data) setAvailableCommodities(res.data);
        });
        getCountries().then(res => {
            if (res.success && res.data) setCountries(res.data);
        });
    }, []);

    // Init Edit Data
    useEffect(() => {
        if (company) {
            setFormData({
                name: company.name,
                type: company.type,
                phone: company.phone || "",
                email: company.email || "",
            });
            // Pre-select commodities
            if (company.commodities) {
                setSelectedCommodities(company.commodities.map((c: any) => c.id));
            }

            // Handle Location Pre-filling (complex due to async cascading)
            // We assume company has relations: company.country.id, etc.
            // Or if existing data was string-based, it might be null now.
            // But we know we just cleared the DB, so we only care about new relations.

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
        if (!countryId) errors.push("Country is required");
        if (!stateId) errors.push("State is required");
        if (!cityId) errors.push("City is required");
        if (selectedCommodities.length === 0) errors.push("At least one commodity is required");

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
                    setFormData({ name: "", type: defaultType, phone: "", email: "" });
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
            <AlertDialog open={!!error} onOpenChange={(open) => !open && setError(null)}>
                <AlertDialogContent className="z-[100]">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-destructive">Error</AlertDialogTitle>
                        <AlertDialogDescription className="whitespace-pre-line">
                            {error}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogAction onClick={() => setError(null)}>OK</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogTrigger asChild>
                    {trigger ? trigger : (
                        <Button>
                            <Plus className="mr-2 h-4 w-4" /> Add Company
                        </Button>
                    )}
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px] overflow-y-auto max-h-[90vh]">
                    <form onSubmit={handleSubmit}>
                        <DialogHeader>
                            <DialogTitle>{isEditMode ? "Edit Company" : "Add New Company"}</DialogTitle>
                            <DialogDescription>
                                {isEditMode ? "Update company details." : "Create a new Client, Prospect, or Vendor profile."}
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="name" className="text-right">
                                    Name <span className="text-red-500">*</span>
                                </Label>
                                <Input
                                    id="name"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="col-span-3"
                                    required
                                />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="type" className="text-right">
                                    Type <span className="text-red-500">*</span>
                                </Label>
                                <div className="col-span-3">
                                    <Select
                                        value={formData.type}
                                        onValueChange={(val) => setFormData({ ...formData, type: val as CompanyType })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select type" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="PROSPECT">Prospect</SelectItem>
                                            <SelectItem value="CLIENT">Client</SelectItem>
                                            <SelectItem value="VENDOR">Vendor</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="phone" className="text-right">
                                    Phone <span className="text-red-500">*</span>
                                </Label>
                                <Input
                                    id="phone"
                                    value={formData.phone}
                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                    className="col-span-3"
                                />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="email" className="text-right">
                                    Email
                                </Label>
                                <Input
                                    id="email"
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    className="col-span-3"
                                />
                            </div>

                            {/* Location Fields */}
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label className="text-right">Country <span className="text-red-500">*</span></Label>
                                <div className="col-span-3">
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
                            </div>

                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label className="text-right">State <span className="text-red-500">*</span></Label>
                                <div className="col-span-3">
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
                            </div>

                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label className="text-right">City <span className="text-red-500">*</span></Label>
                                <div className="col-span-3">
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
                            </div>

                            <div className="grid grid-cols-4 items-start gap-4">
                                <Label className="text-right pt-2">
                                    Commodities <span className="text-red-500">*</span>
                                </Label>
                                <div className="col-span-3 border rounded-md p-3 h-32 overflow-y-auto space-y-2">
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
                                {isEditMode ? "Save Changes" : "Save Company"}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog >
        </>
    );
}
