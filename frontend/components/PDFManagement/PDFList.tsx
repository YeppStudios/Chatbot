// components/PDFManagement/PDFList.tsx
import { useState } from "react";
import { backend } from "@/config/apiConfig";
import { MultiLineSkeletonLoader } from "../Loaders";
import PDFRenameModal from "./PDFRenameModal";
import PDFDeleteModal from "./PDFDeleteModal";
import { MessageCircleReply, Check, Edit, Trash2, Download, AlertCircle, MoreVertical } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu"; // Adjust the import path as needed

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
      return date.toLocaleDateString('pl-PL', {
        day: '2-digit',
        month: '2-digit', 
        year: 'numeric'
      }).replace(/\//g, '-');
    } catch (e) {
      return 'Nieprawidłowa data';
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
        throw new Error('Nie udało się zaktualizować statusu pliku');
      }
      
      // Refresh file list
      onDeleteSuccess();
    } catch (error) {
      console.error('Błąd podczas przełączania statusu aktywności pliku:', error);
    } finally {
      setUpdatingActive(null);
    }
  };
  
  // Handle download - using the working implementation from the provided file
  const handleDownload = async (fileId: string, fileName: string) => {
    if (!token) {
      setDownloadError("Brak tokenu uwierzytelniającego. Spróbuj zalogować się ponownie.");
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
        let errorMessage = `Nie udało się pobrać pliku (${response.status})`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.detail || errorMessage;
        } catch {
          // If not JSON, use status text
          errorMessage = response.statusText || errorMessage;
        }
        
        setDownloadError(errorMessage);
        console.error("Błąd pobierania:", errorMessage);
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
      console.error("Błąd podczas pobierania pliku:", error);
      setDownloadError("Nie udało się pobrać pliku. Błąd sieci lub serwer niedostępny.");
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
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 inline-block shadow-sm">
          <div className="flex items-center justify-center mb-2">
            <AlertCircle className="text-red-500 mr-2" size={20} />
            <p className="text-red-600 font-medium">{error}</p>
          </div>
          <p className="text-gray-600">
            Wystąpił błąd podczas ładowania plików PDF. Spróbuj ponownie później lub skontaktuj się z pomocą techniczną.
          </p>
        </div>
      </div>
    );
  }

  if (!loading && searchQuery && searchQuery.trim() !== "" && (!pdfFiles || pdfFiles.length === 0)) {
    return (
      <div className="p-12 text-center">
        <div className="text-gray-500">
          <p className="text-lg mb-2">Brak plików PDF pasujących do wyszukiwania</p>
          <p className="text-sm text-gray-400">
            Spróbuj użyć innych słów kluczowych lub sprawdź pisownię
          </p>
        </div>
      </div>
    );
  }
  
  if (!pdfFiles || pdfFiles.length === 0) {
    return (
      <div className="p-12 text-center">
        <div className="bg-gray-50 p-8 rounded-lg inline-block shadow-sm">
          <MessageCircleReply className="w-12 h-12 mb-4 text-gray-300 mx-auto" />
          <p className="text-gray-700 text-lg font-medium mb-2">Brak plików PDF</p>
          <p className="text-gray-500">
            Dodaj swój pierwszy plik PDF za pomocą przycisku "Dodaj plik PDF" powyżej
          </p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="p-4 overflow-x-auto">
      {downloadError && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md border border-red-200 flex items-center">
          <AlertCircle className="mr-2 flex-shrink-0" size={16} />
          <span>{downloadError}</span>
        </div>
      )}
      
      <table className="w-full border-collapse rounded-lg overflow-hidden shadow-sm">
        <thead>
          <tr className="bg-gray-100">
            <th className="p-3 text-left border-b border-r border-gray-200 w-16 font-medium text-gray-700">Aktywny</th>
            <th className="p-3 text-left border-b border-r border-gray-200 font-medium text-gray-700">Nazwa pliku</th>
            <th className="p-3 text-left border-b border-r border-gray-200 w-32 font-medium text-gray-700">Data dodania</th>
            <th className="p-3 text-left border-b border-r border-gray-200 w-24 font-medium text-gray-700">Rozmiar</th>
            <th className="p-3 text-center border-b border-gray-200 w-32 font-medium text-gray-700">Akcje</th>
          </tr>
        </thead>
        <tbody>
          {pdfFiles.map((file, index) => (
            <tr key={file._id} className={`hover:bg-gray-50 transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
              <td className="p-3 border-b border-r border-gray-200 text-center">
                <div className="flex justify-center">
                  <button
                    onClick={() => toggleActive(file._id, !!file.active)}
                    disabled={updatingActive === file._id}
                    className={`w-6 h-6 rounded-md ${
                      file.active ? 'bg-purple-chat text-white hover:bg-purple-chat/90' : 'bg-gray-200 hover:bg-gray-300'
                    } flex items-center justify-center transition-colors duration-200`}
                    title={file.active ? "Aktywny (kliknij, aby wyłączyć)" : "Nieaktywny (kliknij, aby włączyć)"}
                  >
                    {updatingActive === file._id ? (
                      <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    ) : file.active ? (
                      <Check size={14} />
                    ) : null}
                  </button>
                </div>
              </td>
              <td className="p-3 border-b border-r border-gray-200">{file.name}</td>
              <td className="p-3 border-b border-r border-gray-200">{formatDate(file.date_added)}</td>
              <td className="p-3 border-b border-r border-gray-200">{formatFileSize(file.size)}</td>
              <td className="p-3 border-b border-gray-200 text-center">
                <div className="flex justify-center">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="text-gray-600 hover:text-gray-800 transition-colors p-1.5 rounded-full hover:bg-gray-100 focus:outline-none">
                        <MoreVertical size={16} />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-48 bg-white border border-gray-200 shadow-lg">
                      {/* Rename option */}
                      <DropdownMenuItem
                        onClick={() => {
                          setSelectedFile(file);
                          setIsRenameModalOpen(true);
                        }}
                        className="cursor-pointer py-2"
                      >
                        <Edit className="mr-2 h-4 w-4" />
                        <span>Zmień nazwę</span>
                      </DropdownMenuItem>
                      
                      {/* Download option */}
                      <DropdownMenuItem
                        onClick={() => handleDownload(file._id, file.name)}
                        className="cursor-pointer py-2"
                        disabled={downloadingFile === file._id}
                      >
                        {downloadingFile === file._id ? (
                          <>
                            <div className="mr-2 w-4 h-4 border-2 border-gray-600 border-t-transparent rounded-full animate-spin" />
                            <span>Pobieranie...</span>
                          </>
                        ) : (
                          <>
                            <Download className="mr-2 h-4 w-4" />
                            <span>Pobierz</span>
                          </>
                        )}
                      </DropdownMenuItem>
                      
                      
                      {/* Delete option */}
                      <DropdownMenuItem
                        onClick={() => {
                          setSelectedFile(file);
                          setIsDeleteModalOpen(true);
                        }}
                        className="cursor-pointer text-red-600 hover:text-red-700 focus:text-red-700 py-2"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        <span>Usuń</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
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