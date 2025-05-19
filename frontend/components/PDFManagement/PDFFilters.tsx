// components/PDFManagement/PDFFilters.tsx
import { useState, useEffect } from "react";
import useDebounce from "@/hooks/useDebounce";
import { Search, Calendar, FileBadge, X, SlidersHorizontal } from "lucide-react";

interface PDFFiltersProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  sortBy: string;
  setSortBy: (field: string) => void;
  sortOrder: number;
  setSortOrder: (order: number) => void;
  // New filter props
  dateRange: { start: string | null; end: string | null };
  setDateRange: (range: { start: string | null; end: string | null }) => void;
  sizeRange: { min: number | null; max: number | null };
  setSizeRange: (range: { min: number | null; max: number | null }) => void;
}

export default function PDFFilters({
  searchQuery,
  setSearchQuery,
  sortBy,
  setSortBy,
  sortOrder,
  setSortOrder,
  dateRange,
  setDateRange,
  sizeRange,
  setSizeRange,
}: PDFFiltersProps) {
  const [localSearch, setLocalSearch] = useState(searchQuery);
  const debouncedSearchTerm = useDebounce(localSearch, 500); // 500ms debounce
  
  const [showFilters, setShowFilters] = useState(false);
  
  const [localDateRange, setLocalDateRange] = useState(dateRange);
  const [localSizeRange, setLocalSizeRange] = useState(sizeRange);
  
  // Effect to update parent's search query when debounced value changes
  useEffect(() => {
    setSearchQuery(debouncedSearchTerm);
  }, [debouncedSearchTerm, setSearchQuery]);
  
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchQuery(localSearch); // Immediately apply search without waiting for debounce
  };
  
  const handleApplyFilters = () => {
    setDateRange(localDateRange);
    setSizeRange(localSizeRange);
  };
  
  const handleResetFilters = () => {
    setLocalDateRange({ start: null, end: null });
    setLocalSizeRange({ min: null, max: null });
    setDateRange({ start: null, end: null });
    setSizeRange({ min: null, max: null });
  };
  
  const hasActiveFilters = (
    dateRange.start || 
    dateRange.end || 
    sizeRange.min !== null || 
    sizeRange.max !== null
  );
  
  return (
    <div className="p-5 border-b bg-white shadow-sm">
      <div className="flex flex-col md:flex-row justify-between gap-4 mb-4">
        {/* Search field */}
        <form onSubmit={handleSearchSubmit} className="flex-1">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-indigo-500" />
            </div>
            <input
              type="text"
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              placeholder="Szukaj według nazwy pliku..."
              className="w-full pl-10 pr-24 py-2.5 border border-indigo-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
            />
            <button
              type="submit"
              className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-purple-chat hover:bg-purple-chat/90 text-white py-1.5 px-4 rounded-md text-sm font-medium transition-colors"
            >
              Szukaj
            </button>
          </div>
        </form>
        
        {/* Filter toggle and sort controls */}
        <div className="flex gap-3">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`px-4 py-2.5 rounded-lg flex items-center gap-2 transition-all ${
              hasActiveFilters 
                ? "bg-indigo-100 text-indigo-700 border border-indigo-200"
                : "bg-gray-100 border border-gray-200 text-gray-700 hover:bg-gray-200"
            }`}
          >
            <SlidersHorizontal size={16} />
            <span className="text-sm font-medium">Filtry</span>
            {hasActiveFilters && (
              <span className="inline-flex items-center justify-center w-5 h-5 text-xs font-semibold text-white bg-indigo-600 rounded-full">
                {(dateRange.start ? 1 : 0) + (dateRange.end ? 1 : 0) + 
                 (sizeRange.min !== null ? 1 : 0) + (sizeRange.max !== null ? 1 : 0)}
              </span>
            )}
          </button>
          
          <div className="flex items-center bg-gray-50 px-3 border border-gray-200 rounded-lg">
            <span className="mr-2 text-sm font-medium text-gray-600">Sortuj:</span>
            <select
              value={`${sortBy}:${sortOrder}`}
              onChange={(e) => {
                const [field, order] = e.target.value.split(":");
                setSortBy(field);
                setSortOrder(parseInt(order));
              }}
              className="bg-transparent py-2.5 pl-1 pr-8 text-sm focus:outline-none"
            >
              <option value="date_added:-1">Najnowsze najpierw</option>
              <option value="date_added:1">Najstarsze najpierw</option>
              <option value="name:1">Nazwa (A-Z)</option>
              <option value="name:-1">Nazwa (Z-A)</option>
              <option value="size:-1">Rozmiar (największe najpierw)</option>
              <option value="size:1">Rozmiar (najmniejsze najpierw)</option>
            </select>
          </div>
        </div>
      </div>
      
      {/* Advanced filters panel */}
      {showFilters && (
        <div className="mt-4 p-5 border border-indigo-100 rounded-lg bg-indigo-50/50 shadow-sm">
          <div className="flex flex-col md:flex-row gap-8">
            {/* Date range filter */}
            <div className="flex-1">
              <h3 className="font-medium text-sm mb-3 flex items-center gap-2 text-indigo-700">
                <Calendar size={16} />
                Zakres dat
              </h3>
              <div className="flex flex-wrap gap-4">
                <div className="flex-1">
                  <label className="block text-xs text-gray-600 mb-1.5 font-medium">Od</label>
                  <input
                    type="date"
                    value={localDateRange.start || ""}
                    onChange={(e) => setLocalDateRange({
                      ...localDateRange,
                      start: e.target.value || null
                    })}
                    className="border border-gray-200 rounded-md p-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-xs text-gray-600 mb-1.5 font-medium">Do</label>
                  <input
                    type="date"
                    value={localDateRange.end || ""}
                    onChange={(e) => setLocalDateRange({
                      ...localDateRange,
                      end: e.target.value || null
                    })}
                    className="border border-gray-200 rounded-md p-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
              </div>
            </div>
            
            {/* File size filter */}
            <div className="flex-1">
              <h3 className="font-medium text-sm mb-3 flex items-center gap-2 text-indigo-700">
                <FileBadge size={16} />
                Rozmiar pliku (MB)
              </h3>
              <div className="flex flex-wrap gap-4">
                <div className="flex-1">
                  <label className="block text-xs text-gray-600 mb-1.5 font-medium">Min (MB)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.1"
                    value={localSizeRange.min !== null ? localSizeRange.min : ""}
                    onChange={(e) => setLocalSizeRange({
                      ...localSizeRange,
                      min: e.target.value ? parseFloat(e.target.value) : null
                    })}
                    placeholder="0"
                    className="border border-gray-200 rounded-md p-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-xs text-gray-600 mb-1.5 font-medium">Maks (MB)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.1"
                    value={localSizeRange.max !== null ? localSizeRange.max : ""}
                    onChange={(e) => setLocalSizeRange({
                      ...localSizeRange,
                      max: e.target.value ? parseFloat(e.target.value) : null
                    })}
                    placeholder="∞"
                    className="border border-gray-200 rounded-md p-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
              </div>
            </div>
          </div>
          
          {/* Filter action buttons */}
          <div className="flex justify-end gap-3 mt-5">
            <button
              onClick={handleResetFilters}
              className="px-4 py-2 text-sm border border-gray-300 rounded-md flex items-center gap-2 text-gray-700 hover:bg-gray-100 transition-colors"
            >
              <X size={14} />
              Wyczyść wszystko
            </button>
            <button
              onClick={handleApplyFilters}
              className="px-4 py-2 text-sm bg-indigo-600 hover:bg-indigo-700 text-white rounded-md font-medium transition-colors"
            >
              Zastosuj filtry
            </button>
          </div>
        </div>
      )}
      
      {/* Active filters display */}
      {hasActiveFilters && (
        <div className="mt-4 flex flex-wrap gap-2">
          {dateRange.start && (
            <div className="bg-indigo-100 text-indigo-700 rounded-full px-3 py-1.5 text-xs flex items-center gap-1.5 border border-indigo-200">
              <span className="font-medium">Od: {new Date(dateRange.start).toLocaleDateString()}</span>
              <button
                onClick={() => setDateRange({ ...dateRange, start: null })}
                className="text-indigo-500 hover:text-indigo-700 bg-indigo-200 rounded-full p-0.5"
              >
                <X size={12} />
              </button>
            </div>
          )}
          
          {dateRange.end && (
            <div className="bg-indigo-100 text-indigo-700 rounded-full px-3 py-1.5 text-xs flex items-center gap-1.5 border border-indigo-200">
              <span className="font-medium">Do: {new Date(dateRange.end).toLocaleDateString()}</span>
              <button
                onClick={() => setDateRange({ ...dateRange, end: null })}
                className="text-indigo-500 hover:text-indigo-700 bg-indigo-200 rounded-full p-0.5"
              >
                <X size={12} />
              </button>
            </div>
          )}
          
          {sizeRange.min !== null && (
            <div className="bg-indigo-100 text-indigo-700 rounded-full px-3 py-1.5 text-xs flex items-center gap-1.5 border border-indigo-200">
              <span className="font-medium">Min. rozmiar: {sizeRange.min} MB</span>
              <button
                onClick={() => setSizeRange({ ...sizeRange, min: null })}
                className="text-indigo-500 hover:text-indigo-700 bg-indigo-200 rounded-full p-0.5"
              >
                <X size={12} />
              </button>
            </div>
          )}
          
          {sizeRange.max !== null && (
            <div className="bg-indigo-100 text-indigo-700 rounded-full px-3 py-1.5 text-xs flex items-center gap-1.5 border border-indigo-200">
              <span className="font-medium">Maks. rozmiar: {sizeRange.max} MB</span>
              <button
                onClick={() => setSizeRange({ ...sizeRange, max: null })}
                className="text-indigo-500 hover:text-indigo-700 bg-indigo-200 rounded-full p-0.5"
              >
                <X size={12} />
              </button>
            </div>
          )}
          
          {hasActiveFilters && (
            <button
              onClick={handleResetFilters}
              className="bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-full px-3 py-1.5 text-xs flex items-center gap-1.5 border border-gray-200 transition-colors"
            >
              <span className="font-medium">Wyczyść wszystko</span>
              <X size={12} />
            </button>
          )}
        </div>
      )}
    </div>
  );
}