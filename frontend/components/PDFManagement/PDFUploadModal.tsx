// components/PDFManagement/PDFUploadModal.tsx
import { useState, useRef } from "react";
import { backend } from "@/config/apiConfig";
import { X, Upload, FileText, AlertCircle, Info, CheckCircle, XCircle } from "lucide-react";

interface PDFUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUploadSuccess: () => void;
  token: string | undefined;
}

export default function PDFUploadModal({
  isOpen,
  onClose,
  onUploadSuccess,
  token,
}: PDFUploadModalProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errorType, setErrorType] = useState<"size" | "text" | "general" | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  if (!isOpen) return null;
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    if (selectedFiles.length > 0) {
      validateAndSetFiles(selectedFiles);
    }
  };
  
  const validateAndSetFiles = (selectedFiles: File[]) => {
    setError(null);
    setErrorType(null);
    
    // Filter files by type and size
    const validFiles = selectedFiles.filter(file => {
      // Check file type
      if (file.type !== "application/pdf") {
        return false;
      }
      
      // Check file size (10MB limit)
      const MAX_SIZE = 10 * 1024 * 1024; // 10MB
      if (file.size > MAX_SIZE) {
        return false;
      }
      
      return true;
    });
    
    if (validFiles.length === 0 && selectedFiles.length > 0) {
      setError("Wszystkie wybrane pliki są nieprawidłowe (tylko pliki PDF do 10MB są akceptowane)");
      setErrorType("general");
      return;
    }
    
    setFiles([...files, ...validFiles]);
  };
  
  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };
  
  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };
  
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };
  
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const droppedFiles = Array.from(e.dataTransfer.files || []);
    if (droppedFiles.length > 0) {
      validateAndSetFiles(droppedFiles);
    }
  };
  
  const removeFile = (indexToRemove: number) => {
    setFiles(files.filter((_, index) => index !== indexToRemove));
  };
  
  const handleUpload = async () => {
    if (files.length === 0 || !token) return;
    
    setIsUploading(true);
    setError(null);
    setErrorType(null);
    
    const formData = new FormData();
    files.forEach(file => {
      formData.append("files", file);
    });
    
    try {
      console.log(`Przesyłanie ${files.length} plików do ${backend.serverUrl}/pdf`);
      
      const response = await fetch(`${backend.serverUrl}/pdf`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = "Przesyłanie nie powiodło się";
        let errorTypeValue: "size" | "text" | "general" = "general";
        
        try {
          // Try to parse JSON error
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.detail || "Przesyłanie nie powiodło się";
          
          // Determine error type
          if (response.status === 413 || errorMessage.includes("size exceeds")) {
            errorTypeValue = "size";
          } else if (response.status === 422 || errorMessage.includes("insufficient text") || errorMessage.includes("no extractable text")) {
            errorTypeValue = "text";
          }
        } catch (e) {
          // If not valid JSON, use status code to determine error type
          if (response.status === 413) {
            errorTypeValue = "size";
            errorMessage = "Rozmiar plików przekracza maksymalny limit.";
          } else if (response.status === 422) {
            errorTypeValue = "text";
            errorMessage = "Pliki zawierają niewystarczającą ilość tekstu do przetworzenia.";
          }
        }
        
        setError(errorMessage);
        setErrorType(errorTypeValue);
        throw new Error(errorMessage);
      }
      
      const data = await response.json();
      console.log("Przesyłanie zakończone sukcesem:", data);
      onUploadSuccess();
    } catch (err) {
      if (!error) {
        setError(err instanceof Error ? err.message : "Przesyłanie nie powiodło się");
        if (!errorType) setErrorType("general");
      }
    } finally {
      setIsUploading(false);
    }
  };
  
  // Get user-friendly help message based on error type
  const getErrorHelp = () => {
    switch (errorType) {
      case "size":
        return "Spróbuj skompresować pliki PDF lub prześlij mniejsze pliki. Maksymalny rozmiar pliku to 10MB.";
      case "text":
        return "System nie mógł wyodrębnić wystarczającej ilości tekstu z przesłanych plików PDF. Upewnij się, że nie zawierają tylko obrazów, nie są chronione hasłem ani mocno zeskanowane. Jakość OCR ma znaczenie w przypadku skanowanych dokumentów.";
      default:
        return null;
    }
  };
  
  const getTotalSize = () => {
    return files.reduce((total, file) => total + file.size, 0);
  };
  
  return (
    <div 
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm animate-fadeIn"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isUploading) {
          onClose();
        }
      }}
    >
      <div className="bg-white rounded-lg p-6 w-full max-w-md relative shadow-xl transform transition-all duration-300 ease-in-out animate-scaleIn" style={{ maxWidth: "95vw" }}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-800 flex items-center">
            <Upload className="mr-2 text-purple-600" size={20} />
            Prześlij pliki PDF
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 hover:bg-gray-100 p-1.5 rounded-full transition-colors"
            aria-label="Zamknij"
            disabled={isUploading}
          >
            <X size={20} />
          </button>
        </div>
        
        {/* Drag & drop area */}
        <div
          className={`border-2 border-dashed rounded-lg p-8 text-center mb-5 transition-all cursor-pointer ${
            isDragging
              ? "border-purple-600 bg-purple-50"
              : error
              ? "border-red-400 bg-red-50"
              : files.length > 0
              ? "border-green-500 bg-green-50"
              : "border-gray-300 hover:border-purple-500 hover:bg-purple-50/50"
          }`}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="application/pdf"
            multiple
            className="hidden"
          />
          
          {files.length > 0 && !error ? (
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-3 bg-green-50 rounded-full flex items-center justify-center">
                <FileText className="text-green-600" size={28} />
              </div>
              <p className="font-medium text-gray-800">{files.length} {files.length === 1 ? "plik wybrany" : "pliki wybrane"}</p>
              <p className="text-sm text-gray-500 mt-1">
                Łączny rozmiar: {(getTotalSize() / (1024 * 1024)).toFixed(2)} MB
              </p>
              <p className="text-sm text-gray-500 mt-1">
                Kliknij aby dodać więcej plików
              </p>
            </div>
          ) : (
            <div>
              <div className="w-16 h-16 mx-auto mb-3 bg-gray-100 rounded-full flex items-center justify-center">
                {error ? (
                  <AlertCircle className="text-red-500" size={28} />
                ) : (
                  <Upload className="text-gray-500" size={28} />
                )}
              </div>
              <p className="font-medium text-gray-800">
                {error ? "Spróbuj ponownie" : "Przeciągnij i upuść pliki PDF tutaj lub kliknij, aby przeglądać"}
              </p>
              <p className="text-sm text-gray-500 mt-2 flex items-center justify-center">
                <Info size={14} className="mr-1" />
                Obsługiwane są tylko pliki PDF do 10MB
              </p>
            </div>
          )}
        </div>
        
        {/* Selected files list */}
        {files.length > 0 && (
          <div className="mb-5 max-h-64 overflow-y-auto border border-gray-200 rounded-md">
            <ul className="divide-y divide-gray-200">
              {files.map((file, index) => (
                <li key={index} className="flex justify-between items-center px-4 py-3 hover:bg-gray-50">
                  <div className="flex items-center">
                    <FileText className="text-gray-500 mr-3" size={18} />
                    <div>
                      <p className="text-sm font-medium text-gray-700 truncate" style={{ maxWidth: "200px" }}>
                        {file.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {(file.size / (1024 * 1024)).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeFile(index);
                    }}
                    className="text-gray-400 hover:text-red-500 transition-colors"
                    disabled={isUploading}
                  >
                    <XCircle size={18} />
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
        
        {/* Error message */}
        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 rounded mb-5 shadow-sm">
            <div className="flex">
              <AlertCircle className="flex-shrink-0 mr-2" size={18} />
              <div>
                <p className="font-medium">{error}</p>
                {getErrorHelp() && (
                  <p className="text-sm mt-1 text-red-600">{getErrorHelp()}</p>
                )}
              </div>
            </div>
          </div>
        )}
        
        {/* Progress indicator when uploading */}
        {isUploading && (
          <div className="mb-5">
            <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
              <div className="h-full bg-purple-600 rounded-full animate-pulse"></div>
            </div>
            <p className="text-sm text-center mt-2 text-gray-600">Przesyłanie plików...</p>
          </div>
        )}
        
        {/* Buttons */}
        <div className="flex justify-end gap-3 mt-6">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
            disabled={isUploading}
          >
            Anuluj
          </button>
          <button
            type="button"
            onClick={handleUpload}
            className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors disabled:opacity-50 flex items-center shadow-sm"
            disabled={files.length === 0 || isUploading || !!error}
          >
            {isUploading ? (
              <span className="flex items-center">
                <div className="w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Przesyłanie...
              </span>
            ) : (
              <>
                <Upload size={16} className="mr-2" />
                {files.length > 1 ? `Prześlij ${files.length} pliki` : "Prześlij"}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}