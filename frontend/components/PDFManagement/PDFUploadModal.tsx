// components/PDFManagement/PDFUploadModal.tsx
import { useState, useRef } from "react";
import { backend } from "@/config/apiConfig";
import { X } from "lucide-react";

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
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errorType, setErrorType] = useState<"size" | "text" | "general" | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  if (!isOpen) return null;
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      validateAndSetFile(selectedFile);
    }
  };
  
  const validateAndSetFile = (selectedFile: File) => {
    setError(null);
    setErrorType(null);
    
    // Check file type
    if (selectedFile.type !== "application/pdf") {
      setError("Only PDF files are allowed");
      setErrorType("general");
      return;
    }
    
    // Check file size (10MB limit)
    const MAX_SIZE = 10 * 1024 * 1024; // 10MB
    if (selectedFile.size > MAX_SIZE) {
      setError(`File size exceeds 10MB limit (${(selectedFile.size / (1024 * 1024)).toFixed(2)}MB)`);
      setErrorType("size");
      return;
    }
    
    setFile(selectedFile);
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
    
    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile) {
      validateAndSetFile(droppedFile);
    }
  };
  
  const handleUpload = async () => {
    if (!file || !token) return;
    
    setIsUploading(true);
    setError(null);
    setErrorType(null);
    
    const formData = new FormData();
    formData.append("file", file);
    
    try {
      console.log(`Uploading file to ${backend.serverUrl}/pdf`);
      
      const response = await fetch(`${backend.serverUrl}/pdf`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = "Upload failed";
        let errorTypeValue: "size" | "text" | "general" = "general";
        
        try {
          // Try to parse JSON error
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.detail || "Upload failed";
          
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
            errorMessage = "File size exceeds the maximum limit of 10MB.";
          } else if (response.status === 422) {
            errorTypeValue = "text";
            errorMessage = "File contains insufficient text for processing.";
          }
        }
        
        setError(errorMessage);
        setErrorType(errorTypeValue);
        throw new Error(errorMessage);
      }
      
      const data = await response.json();
      console.log("Upload successful:", data);
      onUploadSuccess();
    } catch (err) {
      if (!error) {
        setError(err instanceof Error ? err.message : "Upload failed");
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
        return "Try compressing your PDF or upload a smaller file. The maximum file size is 10MB.";
      case "text":
        return "The system could not extract sufficient text from this PDF. Make sure it's not image-only, password protected, or heavily scanned. OCR quality matters for scanned documents.";
      default:
        return null;
    }
  };
  
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md relative">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-gray-500 hover:text-gray-700"
          aria-label="Close"
        >
          <X size={18} />
        </button>
        
        <h2 className="text-xl font-bold mb-4">Upload PDF File</h2>
        
        {/* Drag & drop area */}
        <div
          className={`border-2 border-dashed rounded-lg p-8 text-center mb-4 ${
            isDragging
              ? "border-purple-chat bg-purple-chat/5"
              : error
              ? "border-red-400 bg-red-50"
              : "border-gray-300 hover:border-purple-chat/50"
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
            className="hidden"
          />
          
          {file && !error ? (
            <div className="text-center">
              <p className="font-medium">{file.name}</p>
              <p className="text-sm text-gray-500 mt-1">
                {(file.size / (1024 * 1024)).toFixed(2)} MB
              </p>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setFile(null);
                }}
                className="text-red-600 text-sm mt-2 hover:underline"
              >
                Remove
              </button>
            </div>
          ) : (
            <div>
              <p className="font-medium">
                {error ? "Please try again" : "Drag & drop your PDF file here, or click to browse"}
              </p>
              <p className="text-sm text-gray-500 mt-1">
                Only PDF files up to 10MB are supported
              </p>
            </div>
          )}
        </div>
        
        {/* Error message */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            <p className="font-medium">{error}</p>
            {getErrorHelp() && (
              <p className="text-sm mt-1">{getErrorHelp()}</p>
            )}
          </div>
        )}
        
        {/* Buttons */}
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            disabled={isUploading}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleUpload}
            className="px-4 py-2 bg-purple-chat text-white rounded-md hover:bg-purple-chat/90 disabled:opacity-50"
            disabled={!file || isUploading || !!error}
          >
            {isUploading ? (
              <span className="flex items-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Uploading...
              </span>
            ) : (
              "Upload"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}