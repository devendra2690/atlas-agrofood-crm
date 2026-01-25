'use client';

import { useState, useEffect } from 'react';
import { getCountries, createCountry, deleteCountry, getStates, createState, deleteState, getCities, createCity, deleteCity } from '@/app/actions/location';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Trash2, Plus, Loader2, ChevronRight, MapPin } from 'lucide-react';
import { toast } from 'sonner';
import { Separator } from '@/components/ui/separator';

type LocationItem = {
    id: string;
    name: string;
};

export default function LocationsPage() {
    // Selection State
    const [selectedCountry, setSelectedCountry] = useState<LocationItem | null>(null);
    const [selectedState, setSelectedState] = useState<LocationItem | null>(null);

    // Data State
    const [countries, setCountries] = useState<LocationItem[]>([]);
    const [states, setStates] = useState<LocationItem[]>([]);
    const [cities, setCities] = useState<LocationItem[]>([]);

    // Loading State
    const [loadingCountries, setLoadingCountries] = useState(false);
    const [loadingStates, setLoadingStates] = useState(false);
    const [loadingCities, setLoadingCities] = useState(false);

    // Input State
    const [newCountry, setNewCountry] = useState('');
    const [newState, setNewState] = useState('');
    const [newCity, setNewCity] = useState('');

    useEffect(() => {
        loadCountries();
    }, []);

    useEffect(() => {
        if (selectedCountry) {
            loadStates(selectedCountry.id);
            setStates([]);
            setCities([]);
            setSelectedState(null);
        }
    }, [selectedCountry]);

    useEffect(() => {
        if (selectedState) {
            loadCities(selectedState.id);
            setCities([]);
        }
    }, [selectedState]);

    // Data Loaders
    async function loadCountries() {
        setLoadingCountries(true);
        const res = await getCountries();
        if (res.success && res.data) setCountries(res.data);
        setLoadingCountries(false);
    }

    async function loadStates(countryId: string) {
        setLoadingStates(true);
        const res = await getStates(countryId);
        if (res.success && res.data) setStates(res.data);
        setLoadingStates(false);
    }

    async function loadCities(stateId: string) {
        setLoadingCities(true);
        const res = await getCities(stateId);
        if (res.success && res.data) setCities(res.data);
        setLoadingCities(false);
    }

    // Handlers
    async function handleAddCountry() {
        if (!newCountry.trim()) return;
        const res = await createCountry(newCountry);
        if (res.success) {
            toast.success("Country added");
            setNewCountry('');
            loadCountries();
        } else toast.error(res.error || "Failed to add country");
    }

    async function handleAddState() {
        if (!newState.trim() || !selectedCountry) return;
        const res = await createState(newState, selectedCountry.id);
        if (res.success) {
            toast.success("State added");
            setNewState('');
            loadStates(selectedCountry.id);
        } else toast.error(res.error || "Failed");
    }

    async function handleAddCity() {
        if (!newCity.trim() || !selectedState) return;
        const res = await createCity(newCity, selectedState.id);
        if (res.success) {
            toast.success("City added");
            setNewCity('');
            loadCities(selectedState.id);
        } else toast.error(res.error || "Failed");
    }

    async function handleDeleteCountry(id: string) {
        if (!confirm("Start FRESH: Delete this country and ALL specific sub-locations?")) return;
        await deleteCountry(id);
        loadCountries();
        if (selectedCountry?.id === id) setSelectedCountry(null);
    }

    async function handleDeleteState(id: string) {
        if (!confirm("Delete state?")) return;
        await deleteState(id);
        if (selectedCountry) loadStates(selectedCountry.id);
        if (selectedState?.id === id) setSelectedState(null);
    }

    async function handleDeleteCity(id: string) {
        if (!confirm("Delete city?")) return;
        await deleteCity(id);
        if (selectedState) loadCities(selectedState.id);
    }

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-3xl font-bold tracking-tight">Location Settings</h2>
                <p className="text-muted-foreground">
                    Manage hierarchical locations for consistent data entry.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-[600px]">

                {/* Column 1: Countries */}
                <Card className="flex flex-col h-full">
                    <CardHeader className="py-4">
                        <CardTitle className="text-lg">1. Countries</CardTitle>
                    </CardHeader>
                    <CardContent className="flex-1 flex flex-col gap-4 overflow-hidden">
                        <div className="flex gap-2">
                            <Input
                                placeholder="New Country..."
                                value={newCountry}
                                onChange={e => setNewCountry(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && handleAddCountry()}
                            />
                            <Button size="icon" onClick={handleAddCountry} disabled={!newCountry.trim()}>
                                <Plus className="h-4 w-4" />
                            </Button>
                        </div>
                        <Separator />
                        <div className="flex-1 overflow-y-auto space-y-2 pr-2">
                            {countries.map(c => (
                                <div
                                    key={c.id}
                                    className={`flex items-center justify-between p-2 rounded cursor-pointer border ${selectedCountry?.id === c.id ? 'bg-slate-100 border-slate-300' : 'hover:bg-slate-50 border-transparent'}`}
                                    onClick={() => setSelectedCountry(c)}
                                >
                                    <span className="font-medium">{c.name}</span>
                                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={(e) => { e.stopPropagation(); handleDeleteCountry(c.id); }}>
                                        <Trash2 className="h-3 w-3 text-red-400" />
                                    </Button>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Column 2: States */}
                <Card className={`flex flex-col h-full ${!selectedCountry ? 'opacity-50' : ''}`}>
                    <CardHeader className="py-4">
                        <CardTitle className="text-lg">2. States</CardTitle>
                        <CardDescription>{selectedCountry ? `States in ${selectedCountry.name}` : 'Select a country first'}</CardDescription>
                    </CardHeader>
                    <CardContent className="flex-1 flex flex-col gap-4 overflow-hidden">
                        <div className="flex gap-2">
                            <Input
                                placeholder="New State..."
                                value={newState}
                                onChange={e => setNewState(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && handleAddState()}
                                disabled={!selectedCountry}
                            />
                            <Button size="icon" onClick={handleAddState} disabled={!newState.trim() || !selectedCountry}>
                                <Plus className="h-4 w-4" />
                            </Button>
                        </div>
                        <Separator />
                        <div className="flex-1 overflow-y-auto space-y-2 pr-2">
                            {states.map(s => (
                                <div
                                    key={s.id}
                                    className={`flex items-center justify-between p-2 rounded cursor-pointer border ${selectedState?.id === s.id ? 'bg-slate-100 border-slate-300' : 'hover:bg-slate-50 border-transparent'}`}
                                    onClick={() => setSelectedState(s)}
                                >
                                    <span className="font-medium">{s.name}</span>
                                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={(e) => { e.stopPropagation(); handleDeleteState(s.id); }}>
                                        <Trash2 className="h-3 w-3 text-red-400" />
                                    </Button>
                                </div>
                            ))}
                            {selectedCountry && states.length === 0 && !loadingStates && (
                                <div className="text-center text-sm text-muted-foreground py-4">No states added yet</div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Column 3: Cities */}
                <Card className={`flex flex-col h-full ${!selectedState ? 'opacity-50' : ''}`}>
                    <CardHeader className="py-4">
                        <CardTitle className="text-lg">3. Cities</CardTitle>
                        <CardDescription>{selectedState ? `Cities in ${selectedState.name}` : 'Select a state first'}</CardDescription>
                    </CardHeader>
                    <CardContent className="flex-1 flex flex-col gap-4 overflow-hidden">
                        <div className="flex gap-2">
                            <Input
                                placeholder="New City..."
                                value={newCity}
                                onChange={e => setNewCity(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && handleAddCity()}
                                disabled={!selectedState}
                            />
                            <Button size="icon" onClick={handleAddCity} disabled={!newCity.trim() || !selectedState}>
                                <Plus className="h-4 w-4" />
                            </Button>
                        </div>
                        <Separator />
                        <div className="flex-1 overflow-y-auto space-y-2 pr-2">
                            {cities.map(c => (
                                <div
                                    key={c.id}
                                    className="flex items-center justify-between p-2 rounded border border-transparent hover:bg-slate-50"
                                >
                                    <span className="font-medium">{c.name}</span>
                                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => handleDeleteCity(c.id)}>
                                        <Trash2 className="h-3 w-3 text-red-400" />
                                    </Button>
                                </div>
                            ))}
                            {selectedState && cities.length === 0 && !loadingCities && (
                                <div className="text-center text-sm text-muted-foreground py-4">No cities added yet</div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
