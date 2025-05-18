// frontend/components/PDFManagement/PDFRenameModal.tsx
import { useState } from "react";
import { backend } from "@/config/apiConfig";

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
      setError("Filename cannot be empty");
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
        throw new Error(errorData.detail || "Rename failed");
      }
      
      onRenameSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Rename failed");
      setIsRenaming(false);
    }
  };
  
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-bold mb-4">Rename PDF File</h2>
        
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="filename" className="block text-sm font-medium text-gray-700 mb-1">
              New Filename
            </label>
            <input
              type="text"
              id="filename"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="w-full p-2 border rounded-lg"
              disabled={isRenaming}
            />
          </div>
          
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}
          
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              disabled={isRenaming}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-purple-chat text-white rounded-md hover:bg-purple-chat/90 disabled:opacity-50"
              disabled={isRenaming}
            >
              {isRenaming ? "Saving..." : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}