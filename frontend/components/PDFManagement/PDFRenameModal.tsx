// frontend/components/PDFManagement/PDFRenameModal.tsx
import { useState } from "react";
import { backend } from "@/config/apiConfig";
import { XCircle, Save, X, AlertCircle } from "lucide-react";

interface PDFRenameModalProps {
  isOpen: boolean;
  onClose: () => void;
  file: {
    _id: string;
    name: string;
  };
  onRenameSuccess: () => void;
  token: string | undefined;
}

export default function PDFRenameModal({
  isOpen,
  onClose,
  file,
  onRenameSuccess,
  token,
}: PDFRenameModalProps) {
  const [newName, setNewName] = useState(file.name);
  const [isRenaming, setIsRenaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  if (!isOpen) return null;
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    
    // Validate new name
    if (!newName.trim()) {
      setError("Nazwa pliku nie może być pusta");
      return;
    }
    
    // Ensure filename ends with .pdf
    let processedName = newName.trim();
    if (!processedName.toLowerCase().endsWith(".pdf")) {
      processedName += ".pdf";
    }
    
    setIsRenaming(true);
    setError(null);
    
    try {
      const formData = new FormData();
      formData.append("new_name", processedName);
      
      const response = await fetch(`${backend.serverUrl}/pdf/${file._id}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Zmiana nazwy nie powiodła się");
      }
      
      onRenameSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Zmiana nazwy nie powiodła się");
      setIsRenaming(false);
    }
  };
  
  return (
    <div 
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-fadeIn"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isRenaming) {
          onClose();
        }
      }}
    >
      <div 
        className="bg-white rounded-lg p-6 w-full max-w-md shadow-lg transform transition-all duration-300 ease-in-out animate-scaleIn"
        style={{ 
          maxWidth: "90vw" 
        }}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-800">Zmień nazwę pliku PDF</h2>
          <button 
            onClick={onClose} 
            disabled={isRenaming}
            className="text-gray-500 hover:text-gray-700 transition-colors p-1 rounded-full hover:bg-gray-100"
          >
            <X size={20} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="filename" className="block text-sm font-medium text-gray-700 mb-2">
              Nowa nazwa pliku
            </label>
            <div className="relative">
              <input
                type="text"
                id="filename"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all outline-none"
                disabled={isRenaming}
                autoFocus
                placeholder="Wprowadź nową nazwę pliku..."
              />
              {newName && (
                <button
                  type="button"
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  onClick={() => setNewName("")}
                  disabled={isRenaming}
                >
                  <XCircle size={18} />
                </button>
              )}
            </div>
            <p className="mt-1 text-sm text-gray-500">
              Rozszerzenie .pdf zostanie dodane automatycznie jeśli go nie podasz
            </p>
          </div>
          
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
              disabled={isRenaming}
            >
              <X size={16} />
              <span>Anuluj</span>
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors disabled:opacity-50 flex items-center gap-2 shadow-sm"
              disabled={isRenaming}
            >
              {isRenaming ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Zapisywanie...</span>
                </>
              ) : (
                <>
                  <Save size={16} />
                  <span>Zapisz</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}