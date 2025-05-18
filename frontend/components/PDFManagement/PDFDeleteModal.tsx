// frontend/components/PDFManagement/PDFDeleteModal.tsx
import { useState } from "react";
import { backend } from "@/config/apiConfig";

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
        throw new Error(errorData.detail || "Delete failed");
      }
      
      onDeleteSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed");
      setIsDeleting(false);
    }
  };
  
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-bold mb-2">Delete PDF File</h2>
        <p className="text-gray-600 mb-4">
          Are you sure you want to delete <strong>{file.name}</strong>? This action cannot be undone.
        </p>
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}
        
        <div className="flex justify-end gap-3 mt-6">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            disabled={isDeleting}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleDelete}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
            disabled={isDeleting}
          >
            {isDeleting ? "Deleting..." : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}