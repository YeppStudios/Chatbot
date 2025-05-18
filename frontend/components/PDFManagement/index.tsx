// components/PDFManagement/index.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import { backend } from "@/config/apiConfig";
import PDFUploadModal from "./PDFUploadModal";
import PDFList from "./PDFList";
import PDFFilters from "./PDFFilters";
import { getAuthToken } from "@/utils/auth/getToken";

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
      
      console.log(`Fetching PDFs from: ${url}`);
      
      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Server responded with status ${response.status}:`, errorText);
        try {
          const errorData = JSON.parse(errorText);
          setFetchError(errorData.detail || `Error fetching PDF files (${response.status})`);
        } catch (e) {
          setFetchError(`Error fetching PDF files (${response.status})`);
        }
        return;
      }
      
      const data = await response.json();
      console.log("Successfully fetched PDF files:", data);
      setPDFFiles(data.pdf_files || []);
      setTotalPages(data.pages || 1);
    } catch (error) {
      console.error("Failed to fetch PDF files:", error);
      setFetchError("Failed to connect to the server. Please check your internet connection.");
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
    <div className="bg-white min-h-screen">
      <div className="bg-white p-5 text-center flex justify-between items-center shadow-lg">
        <h1 className="text-xl font-medium">PDF File Management</h1>
        <button
          onClick={() => setIsUploadModalOpen(true)}
          className="bg-purple-chat hover:bg-purple-chat/90 text-white px-4 py-2 rounded-lg flex items-center"
        >
          <span className="mr-2">+</span>
          Add PDF File
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
      <div className="fixed bottom-0 left-0 right-0 py-6 px-8 bg-white w-full shadow-lg border-t border-purple-chat/10">
        <div className="flex justify-center space-x-2">
          <button
            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
            disabled={currentPage <= 1}
            className={`px-4 py-2 border rounded ${
              currentPage <= 1
                ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                : "bg-white text-gray-700 hover:bg-purple-chat/10"
            }`}
          >
            Previous
          </button>
          
          <span className="px-4 py-2">
            Page {currentPage} of {totalPages || 1}
          </span>
          
          <button
            onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage >= totalPages}
            className={`px-4 py-2 border rounded ${
              currentPage >= totalPages
                ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                : "bg-white text-gray-700 hover:bg-purple-chat/10"
            }`}
          >
            Next
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