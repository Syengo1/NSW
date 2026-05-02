'use client';

import usePlacesAutocomplete, { getGeocode, getLatLng } from "use-places-autocomplete";
import { useLoadScript } from "@react-google-maps/api";
import { MapPin, Loader2 } from "lucide-react";
import { useEffect } from "react";

const libraries: ("places")[] = ["places"];

interface AddressAutocompleteProps {
  selectedAddress: string; 
  onLocationSelect: (address: string, coords: { lat: number; lng: number }) => void;
  // NEW: Add a prop to sync manual typing back to the parent
  onAddressEdit: (address: string) => void; 
}

export default function AddressAutocomplete({ onLocationSelect, selectedAddress, onAddressEdit }: AddressAutocompleteProps) {
  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY as string,
    libraries,
  });

  const {
    ready,
    value,
    setValue,
    suggestions: { status, data },
    clearSuggestions,
    init,
  } = usePlacesAutocomplete({
    initOnMount: false,
    requestOptions: {
      componentRestrictions: { country: "ke" }, 
    },
    debounce: 300, 
  });

  useEffect(() => {
    if (isLoaded) init();
  }, [isLoaded, init]);

  // SYNC EXTERNAL MAP CLICKS TO THE INPUT FIELD
  useEffect(() => {
    if (selectedAddress && selectedAddress !== value) {
      // 'false' prevents a redundant Google API billing request when the map updates the text[cite: 14]
      setValue(selectedAddress, false);
    }
  }, [selectedAddress, setValue, value]);

  if (loadError) return <div className="text-red-500 text-xs">Error loading Maps API</div>;
  if (!isLoaded) return <div className="flex items-center gap-2 text-xs text-muted-foreground"><Loader2 size={14} className="animate-spin" /> Loading map data...</div>;

  const handleSelect = async (address: string) => {
    setValue(address, false);
    clearSuggestions();

    try {
      const results = await getGeocode({ address });
      const { lat, lng } = await getLatLng(results[0]);
      onLocationSelect(address, { lat, lng });
    } catch (error) {
      console.error("Error fetching coordinates: ", error);
    }
  };

  return (
    <div className="relative w-full">
      <MapPin className="absolute left-3 top-3.5 text-muted-foreground" size={16} />
      <input
        value={value}
        onChange={(e) => {
          const newText = e.target.value;
          // 1. Let the Google Places hook do its job for the dropdown[cite: 14]
          setValue(newText); 
          // 2. Sync the raw text up to the parent immediately so manual edits aren't lost
          onAddressEdit(newText); 
        }}
        disabled={!ready}
        placeholder="Search for an area, building, or estate..."
        className="w-full bg-secondary border border-border p-3 pl-10 text-sm font-bold uppercase focus:border-primary outline-none transition-all rounded-md focus:ring-1 focus:ring-primary"
      />
      
      {/* Dropdown Suggestions */}
      {status === "OK" && (
        <ul className="absolute z-50 w-full mt-1 bg-white dark:bg-zinc-900 border border-border rounded-md shadow-lg max-h-60 overflow-y-auto">
          {data.map(({ place_id, description }) => (
            <li
              key={place_id}
              onClick={() => handleSelect(description)}
              className="p-3 text-xs font-bold uppercase cursor-pointer hover:bg-neutral-100 dark:hover:bg-zinc-800 transition-colors border-b border-border last:border-0"
            >
              {description}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}