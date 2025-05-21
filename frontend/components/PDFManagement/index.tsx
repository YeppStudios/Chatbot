// components/PDFManagement/index.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import { backend } from "@/config/apiConfig";
import PDFUploadModal from "./PDFUploadModal";
import PDFList from "./PDFList";
import PDFFilters from "./PDFFilters";
import { getAuthToken } from "@/utils/auth/getToken";
import { PlusCircle } from "lucide-react";

const PDFManagement = () => {
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [pdfFiles, setPDFFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("date_added");
  const [sortOrder, setSortOrder] = useState(-1);
  const [token, setToken] = useState<string>("");
  const [fetchError, setFetchError] = useState<string | null>(null);
  
  // New filter states
  const [dateRange, setDateRange] = useState<{ start: string | null; end: string | null }>({
    start: null,
    end: null
  });
  
  const [sizeRange, setSizeRange] = useState<{ min: number | null; max: number | null }>({
    min: null,
    max: null
  });
  
  // Continuously check for token updates
  useEffect(() => {
    const updateToken = () => {
      const authToken = getAuthToken();
      if (authToken && authToken !== token) {
        setToken(authToken);
      }
    };

    updateToken();
    const interval = setInterval(updateToken, 1000);
    return () => clearInterval(interval);
  }, [token]);
  
  // Create filter params for the API
  const getFilterParams = useCallback(() => {
    const params = new URLSearchParams();
    
    params.append('page', currentPage.toString());
    params.append('search', searchQuery);
    params.append('sort_by', sortBy);
    params.append('sort_order', sortOrder.toString());
    
    if (dateRange.start) {
      params.append('date_start', dateRange.start);
    }
    
    if (dateRange.end) {
      params.append('date_end', dateRange.end);
    }
    
    if (sizeRange.min !== null) {
      // Convert MB to bytes for the API
      const minBytes = Math.floor(sizeRange.min * 1024 * 1024);
      params.append('size_min', minBytes.toString());
    }
    
    if (sizeRange.max !== null) {
      // Convert MB to bytes for the API
      const maxBytes = Math.floor(sizeRange.max * 1024 * 1024);
      params.append('size_max', maxBytes.toString());
    }
    
    return params.toString();
  }, [currentPage, searchQuery, sortBy, sortOrder, dateRange, sizeRange]);
  
  const fetchPDFFiles = useCallback(async () => {
    if (!token) return;
    
    setLoading(true);
    setFetchError(null);
    
    try {
      const filterParams = getFilterParams();
      const url = `${backend.serverUrl}/pdfs?${filterParams}`;
      
      console.log(`Pobieranie plików PDF z: ${url}`);
      
      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Serwer odpowiedział ze statusem ${response.status}:`, errorText);
        try {
          const errorData = JSON.parse(errorText);
          setFetchError(errorData.detail || `Błąd podczas pobierania plików PDF (${response.status})`);
        } catch (e) {
          setFetchError(`Błąd podczas pobierania plików PDF (${response.status})`);
        }
        return;
      }
      
      const data = await response.json();
      console.log("Pomyślnie pobrano pliki PDF:", data);
      setPDFFiles(data.pdf_files || []);
      setTotalPages(data.pages || 1);
    } catch (error) {
      console.error("Nie udało się pobrać plików PDF:", error);
      setFetchError("Nie udało się połączyć z serwerem. Sprawdź swoje połączenie internetowe.");
    } finally {
      setLoading(false);
    }
  }, [token, getFilterParams]);
  
  // Update when filters change
  useEffect(() => {
    fetchPDFFiles();
  }, [fetchPDFFiles]);
  
  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, dateRange, sizeRange]);
  
  const handleSearchQueryChange = useCallback((query: string) => {
    setSearchQuery(query);
  }, []);
  
  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="bg-white p-5 md:px-6 md:py-5 flex justify-between items-center shadow-md border-b border-gray-200">
        <h1 className="text-xl font-semibold text-gray-800">Zarządzanie plikami PDF</h1>
        <button
          onClick={() => setIsUploadModalOpen(true)}
          className="bg-purple-chat hover:bg-purple-chat/90 text-white px-4 py-2 rounded-md flex items-center gap-2 font-medium transition-colors"
        >
          <PlusCircle size={18} />
          Dodaj pliki PDF
        </button>
      </div>
      
      <PDFFilters
        searchQuery={searchQuery}
        setSearchQuery={handleSearchQueryChange}
        sortBy={sortBy}
        setSortBy={setSortBy}
        sortOrder={sortOrder}
        setSortOrder={setSortOrder}
        dateRange={dateRange}
        setDateRange={setDateRange}
        sizeRange={sizeRange}
        setSizeRange={setSizeRange}
      />
      
      <PDFList
        pdfFiles={pdfFiles}
        loading={loading}
        onDeleteSuccess={fetchPDFFiles}
        token={token}
        error={fetchError}
        searchQuery={searchQuery}
      />
      
      {/* Pagination */}
      <div className="fixed bottom-0 left-0 right-0 py-5 px-8 bg-white w-full shadow-lg border-t border-gray-200">
        <div className="flex justify-center space-x-3">
          <button
            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
            disabled={currentPage <= 1}
            className={`px-4 py-2 border rounded-md flex items-center gap-1 transition-colors ${
              currentPage <= 1
                ? "bg-gray-100 text-gray-400 cursor-not-allowed border-gray-200"
                : "bg-white text-gray-700 hover:bg-indigo-50 border-indigo-200 hover:text-indigo-700"
            }`}
          >
            Poprzednia
          </button>
          
          <span className="px-4 py-2 bg-indigo-50 border border-indigo-100 rounded-md text-indigo-800 font-medium">
            Strona {currentPage} z {totalPages || 1}
          </span>
          
          <button
            onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage >= totalPages}
            className={`px-4 py-2 border rounded-md flex items-center gap-1 transition-colors ${
              currentPage >= totalPages
                ? "bg-gray-100 text-gray-400 cursor-not-allowed border-gray-200"
                : "bg-white text-gray-700 hover:bg-indigo-50 border-indigo-200 hover:text-indigo-700"
            }`}
          >
            Następna
          </button>
        </div>
      </div>
      
      <PDFUploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onUploadSuccess={() => {
          setIsUploadModalOpen(false);
          fetchPDFFiles();
        }}
        token={token}
      />
    </div>
  );
};

export default PDFManagement;