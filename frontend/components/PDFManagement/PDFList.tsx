// components/PDFManagement/PDFList.tsx
import { useState } from "react";
import { backend } from "@/config/apiConfig";
import { MultiLineSkeletonLoader } from "../Loaders";
import PDFRenameModal from "./PDFRenameModal";
import PDFDeleteModal from "./PDFDeleteModal";
import { MessageCircleReply, Check } from "lucide-react";

interface PDFFile {
  _id: string;
  name: string;
  size: number;
  date_added: string;
  vectorized: boolean;
  active?: boolean;
}

interface PDFListProps {
  pdfFiles: PDFFile[];
  loading: boolean;
  onDeleteSuccess: () => void;
  token: string | undefined;
  error?: string | null;
  searchQuery?: string;
}

export default function PDFList({
  pdfFiles,
  loading,
  onDeleteSuccess,
  token,
  error,
  searchQuery,
}: PDFListProps) {
  const [selectedFile, setSelectedFile] = useState<PDFFile | null>(null);
  const [isRenameModalOpen, setIsRenameModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [updatingActive, setUpdatingActive] = useState<string | null>(null);
  const [downloadingFile, setDownloadingFile] = useState<string | null>(null);
  const [downloadError, setDownloadError] = useState<string | null>(null);
  
  // Format file size for display
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + " B";
    else if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    else return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };
  
  // Format date for display (dd-mm-yyyy)
  const formatDate = (dateString: string): string => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: '2-digit', 
        year: 'numeric'
      }).replace(/\//g, '-');
    } catch (e) {
      return 'Invalid date';
    }
  };
  
  // Toggle active status
const toggleActive = async (fileId: string, currentActive: boolean) => {
  if (!token) return;
  
  setUpdatingActive(fileId);
  
  try {
    const response = await fetch(`${backend.serverUrl}/pdf/${fileId}/toggle-active`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ active: !currentActive })
    });
    
    if (!response.ok) {
      throw new Error('Failed to update file status');
    }
    
    // Refresh file list
    onDeleteSuccess();
  } catch (error) {
    console.error('Error toggling file active status:', error);
  } finally {
    setUpdatingActive(null);
  }
};
  
  // Handle download - using the working implementation from the provided file
  const handleDownload = async (fileId: string, fileName: string) => {
    if (!token) {
      setDownloadError("Authentication token is missing. Please try logging in again.");
      return;
    }
    
    setDownloadingFile(fileId);
    setDownloadError(null);
    
    try {
      const response = await fetch(`${backend.serverUrl}/pdf/${fileId}/download`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      if (!response.ok) {
        let errorMessage = `Failed to download file (${response.status})`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.detail || errorMessage;
        } catch {
          // If not JSON, use status text
          errorMessage = response.statusText || errorMessage;
        }
        
        setDownloadError(errorMessage);
        console.error("Download error:", errorMessage);
        return;
      }
      
      // Convert the response to a blob
      const blob = await response.blob();
      
      // Create a blob URL for the file
      const url = window.URL.createObjectURL(blob);
      
      // Create a temporary link and trigger download
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      
      // Clean up
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Error downloading file:", error);
      setDownloadError("Failed to download file. Network error or server unavailable.");
    } finally {
      setDownloadingFile(null);
    }
  };
  
  if (loading) {
    return (
      <div className="p-8">
        <MultiLineSkeletonLoader lines={5} justifyContent="center" />
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="p-8 text-center">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 inline-block">
          <p className="text-red-600 font-medium">{error}</p>
          <p className="text-gray-600 mt-2">
            There was an error loading the PDF files. Please try again later or contact support.
          </p>
        </div>
      </div>
    );
  }

  if (!loading && searchQuery && searchQuery.trim() !== "" && (!pdfFiles || pdfFiles.length === 0)) {
    return (
      <div className="p-12 text-center">
        <div className="text-gray-500">
          <p className="text-lg mb-2">No PDF files match your search</p>
          <p className="text-sm text-gray-400">
            Try using different keywords or check your spelling
          </p>
        </div>
      </div>
    );
  }
  
  if (!pdfFiles || pdfFiles.length === 0) {
    return (
      <div className="p-12 text-center">
        <MessageCircleReply className="w-10 h-10 mb-4 opacity-20 mx-auto" />
        <p className="text-gray-500 text-lg mb-2">No PDF files found</p>
        <p className="text-gray-400 text-sm">
          Upload your first PDF file using the "Add PDF File" button above
        </p>
      </div>
    );
  }
  
  return (
    <div className="p-4 overflow-x-auto">
      {downloadError && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">
          {downloadError}
        </div>
      )}
      
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-gray-100">
            <th className="p-3 text-left border w-16">Active</th>
            <th className="p-3 text-left border">Filename</th>
            <th className="p-3 text-left border w-32">Date Added</th>
            <th className="p-3 text-left border w-24">Size</th>
            <th className="p-3 text-center border w-32">Actions</th>
          </tr>
        </thead>
        <tbody>
          {pdfFiles.map((file) => (
            <tr key={file._id} className="hover:bg-gray-50">
              <td className="p-3 border text-center">
                <div className="flex justify-center">
                  <button
                    onClick={() => toggleActive(file._id, !!file.active)}
                    disabled={updatingActive === file._id}
                    className={`w-5 h-5 rounded ${
                      file.active ? 'bg-purple-chat text-white' : 'bg-gray-200'
                    } flex items-center justify-center`}
                    title={file.active ? "Active (click to disable)" : "Inactive (click to enable)"}
                  >
                    {updatingActive === file._id ? (
                      <span className="animate-pulse">...</span>
                    ) : file.active ? (
                      <Check size={12} />
                    ) : null}
                  </button>
                </div>
              </td>
              <td className="p-3 border">{file.name}</td>
              <td className="p-3 border">{formatDate(file.date_added)}</td>
              <td className="p-3 border">{formatFileSize(file.size)}</td>
              <td className="p-3 border text-center">
                <div className="flex justify-center space-x-2">
                  {/* Rename button - using text emoji */}
                  <button
                    onClick={() => {
                      setSelectedFile(file);
                      setIsRenameModalOpen(true);
                    }}
                    className="text-blue-600 hover:text-blue-800"
                    title="Rename"
                  >
                    🖉
                  </button>
                  
                  {/* Delete button - using text emoji */}
                  <button
                    onClick={() => {
                      setSelectedFile(file);
                      setIsDeleteModalOpen(true);
                    }}
                    className="text-red-600 hover:text-red-800"
                    title="Delete"
                  >
                    ✖️
                  </button>
                  
                  {/* Download button - using text emoji with spinner */}
                  <button
                    onClick={() => handleDownload(file._id, file.name)}
                    className="text-gray-600 hover:text-gray-800"
                    title="Download"
                    disabled={downloadingFile === file._id}
                  >
                    {downloadingFile === file._id ? (
                      <div className="w-4 h-4 border-2 border-gray-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
                    ) : (
                      "📥"
                    )}
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      
      {/* Modals */}
      {selectedFile && (
        <>
          <PDFRenameModal
            isOpen={isRenameModalOpen}
            onClose={() => setIsRenameModalOpen(false)}
            file={selectedFile}
            onRenameSuccess={() => {
              setIsRenameModalOpen(false);
              onDeleteSuccess();
            }}
            token={token}
          />
          <PDFDeleteModal
            isOpen={isDeleteModalOpen}
            onClose={() => setIsDeleteModalOpen(false)}
            file={selectedFile}
            onDeleteSuccess={() => {
              setIsDeleteModalOpen(false);
              onDeleteSuccess();
            }}
            token={token}
          />
        </>
      )}
    </div>
  );
}