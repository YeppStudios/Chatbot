// frontend/components/PDFManagement/PDFDeleteModal.tsx
import { useState } from "react";
import { backend } from "@/config/apiConfig";
import { Trash2, X, AlertTriangle, AlertCircle } from "lucide-react";

interface PDFDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  file: {
    _id: string;
    name: string;
  };
  onDeleteSuccess: () => void;
  token: string | undefined;
}

export default function PDFDeleteModal({
  isOpen,
  onClose,
  file,
  onDeleteSuccess,
  token,
}: PDFDeleteModalProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  if (!isOpen) return null;
  
  const handleDelete = async () => {
    if (!token) return;
    
    setIsDeleting(true);
    setError(null);
    
    try {
      const response = await fetch(`${backend.serverUrl}/pdf/${file._id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Usunięcie nie powiodło się");
      }
      
      onDeleteSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Usunięcie nie powiodło się");
      setIsDeleting(false);
    }
  };
  
  return (
    <div 
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm animate-fadeIn"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isDeleting) {
          onClose();
        }
      }}
    >
      <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-xl transform transition-all duration-300 ease-in-out animate-scaleIn" style={{ maxWidth: "95vw" }}>
        <div className="flex items-center mb-4">
          <div className="bg-red-100 p-3 rounded-full mr-4">
            <AlertTriangle className="text-red-500" size={24} />
          </div>
          <h2 className="text-xl font-bold text-gray-800">Usuń plik PDF</h2>
        </div>
        
        <p className="text-gray-600 mb-6 border-l-4 border-red-200 pl-4 py-2 bg-red-50 rounded-r">
          Czy na pewno chcesz usunąć <strong className="text-red-700">{file.name}</strong>? Tej akcji nie można cofnąć.
        </p>
        
        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 rounded mb-4 flex items-start">
            <AlertCircle className="flex-shrink-0 mr-2 mt-0.5" size={18} />
            <span>{error}</span>
          </div>
        )}
        
        <div className="flex justify-end gap-3 mt-6">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-2"
            disabled={isDeleting}
          >
            <X size={16} />
            <span>Anuluj</span>
          </button>
          <button
            type="button"
            onClick={handleDelete}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center gap-2 shadow-sm"
            disabled={isDeleting}
          >
            {isDeleting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Usuwanie...</span>
              </>
            ) : (
              <>
                <Trash2 size={16} />
                <span>Usuń</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}