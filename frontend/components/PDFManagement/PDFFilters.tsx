// components/PDFManagement/PDFFilters.tsx
import { useState, useEffect } from "react";
import useDebounce from "@/hooks/useDebounce";
import { Search, Calendar, FileBadge, X } from "lucide-react";

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
    <div className="p-4 border-b">
      <div className="flex flex-col md:flex-row justify-between gap-4 mb-4">
        {/* Search field */}
        <form onSubmit={handleSearchSubmit} className="flex-1">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-gray-400" />
            </div>
            <input
              type="text"
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              placeholder="Search by filename..."
              className="w-full pl-10 pr-12 py-2 border rounded-lg"
            />
            <button
              type="submit"
              className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-purple-chat hover:bg-purple-chat/90 text-white p-1 rounded text-xs px-2"
            >
              Search
            </button>
          </div>
        </form>
        
        {/* Filter toggle and sort controls */}
        <div className="flex gap-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`px-3 py-2 rounded-lg border flex items-center gap-1 ${
              hasActiveFilters 
                ? "border-purple-chat text-purple-chat bg-purple-chat/5"
                : "border-gray-300 text-gray-700"
            }`}
          >
            <FileBadge size={16} />
            <span className="text-sm">Filters</span>
            {hasActiveFilters && (
              <span className="inline-flex items-center justify-center w-4 h-4 text-xs font-semibold text-white bg-purple-chat rounded-full">
                {(dateRange.start ? 1 : 0) + (dateRange.end ? 1 : 0) + 
                 (sizeRange.min !== null ? 1 : 0) + (sizeRange.max !== null ? 1 : 0)}
              </span>
            )}
          </button>
          
          <div className="flex items-center text-sm">
            <span className="mr-2">Sort:</span>
            <select
              value={`${sortBy}:${sortOrder}`}
              onChange={(e) => {
                const [field, order] = e.target.value.split(":");
                setSortBy(field);
                setSortOrder(parseInt(order));
              }}
              className="border rounded-lg p-2"
            >
              <option value="date_added:-1">Newest first</option>
              <option value="date_added:1">Oldest first</option>
              <option value="name:1">Name (A-Z)</option>
              <option value="name:-1">Name (Z-A)</option>
              <option value="size:-1">Size (largest first)</option>
              <option value="size:1">Size (smallest first)</option>
            </select>
          </div>
        </div>
      </div>
      
      {/* Advanced filters panel */}
      {showFilters && (
        <div className="mt-4 p-4 border rounded-lg bg-gray-50">
          <div className="flex flex-col md:flex-row gap-6">
            {/* Date range filter */}
            <div className="flex-1">
              <h3 className="font-medium text-sm mb-2 flex items-center gap-1">
                <Calendar size={16} />
                Date Range
              </h3>
              <div className="flex flex-wrap gap-2">
                <div>
                  <label className="block text-xs text-gray-600 mb-1">From</label>
                  <input
                    type="date"
                    value={localDateRange.start || ""}
                    onChange={(e) => setLocalDateRange({
                      ...localDateRange,
                      start: e.target.value || null
                    })}
                    className="border rounded p-1.5 text-sm w-full"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">To</label>
                  <input
                    type="date"
                    value={localDateRange.end || ""}
                    onChange={(e) => setLocalDateRange({
                      ...localDateRange,
                      end: e.target.value || null
                    })}
                    className="border rounded p-1.5 text-sm w-full"
                  />
                </div>
              </div>
            </div>
            
            {/* File size filter */}
            <div className="flex-1">
              <h3 className="font-medium text-sm mb-2 flex items-center gap-1">
                <FileBadge size={16} />
                File Size (MB)
              </h3>
              <div className="flex flex-wrap gap-2">
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Min (MB)</label>
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
                    className="border rounded p-1.5 text-sm w-full"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Max (MB)</label>
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
                    className="border rounded p-1.5 text-sm w-full"
                  />
                </div>
              </div>
            </div>
          </div>
          
          {/* Filter action buttons */}
          <div className="flex justify-end gap-2 mt-4">
            <button
              onClick={handleResetFilters}
              className="px-3 py-1.5 text-sm border border-gray-300 rounded flex items-center gap-1"
            >
              <X size={14} />
              Clear All
            </button>
            <button
              onClick={handleApplyFilters}
              className="px-3 py-1.5 text-sm bg-purple-chat text-white rounded"
            >
              Apply Filters
            </button>
          </div>
        </div>
      )}
      
      {/* Active filters display */}
      {hasActiveFilters && (
        <div className="mt-4 flex flex-wrap gap-2">
          {dateRange.start && (
            <div className="bg-purple-chat/10 text-purple-chat rounded-full px-3 py-1 text-xs flex items-center gap-1">
              <span>From: {new Date(dateRange.start).toLocaleDateString()}</span>
              <button
                onClick={() => setDateRange({ ...dateRange, start: null })}
                className="text-purple-chat hover:text-purple-chat/80"
              >
                <X size={12} />
              </button>
            </div>
          )}
          
          {dateRange.end && (
            <div className="bg-purple-chat/10 text-purple-chat rounded-full px-3 py-1 text-xs flex items-center gap-1">
              <span>To: {new Date(dateRange.end).toLocaleDateString()}</span>
              <button
                onClick={() => setDateRange({ ...dateRange, end: null })}
                className="text-purple-chat hover:text-purple-chat/80"
              >
                <X size={12} />
              </button>
            </div>
          )}
          
          {sizeRange.min !== null && (
            <div className="bg-purple-chat/10 text-purple-chat rounded-full px-3 py-1 text-xs flex items-center gap-1">
              <span>Min size: {sizeRange.min} MB</span>
              <button
                onClick={() => setSizeRange({ ...sizeRange, min: null })}
                className="text-purple-chat hover:text-purple-chat/80"
              >
                <X size={12} />
              </button>
            </div>
          )}
          
          {sizeRange.max !== null && (
            <div className="bg-purple-chat/10 text-purple-chat rounded-full px-3 py-1 text-xs flex items-center gap-1">
              <span>Max size: {sizeRange.max} MB</span>
              <button
                onClick={() => setSizeRange({ ...sizeRange, max: null })}
                className="text-purple-chat hover:text-purple-chat/80"
              >
                <X size={12} />
              </button>
            </div>
          )}
          
          {hasActiveFilters && (
            <button
              onClick={handleResetFilters}
              className="bg-gray-200 text-gray-700 rounded-full px-3 py-1 text-xs flex items-center gap-1"
            >
              <span>Clear all</span>
              <X size={12} />
            </button>
          )}
        </div>
      )}
    </div>
  );
}