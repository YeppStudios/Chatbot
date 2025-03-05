import React from "react";

interface ConfirmDeleteProps {
  onOpen: (open: boolean) => void;
  confirmDelete: () => void;
  isOpen: boolean;
}

const ConfirmDelete = ({
  onOpen,
  isOpen,
  confirmDelete,
}: ConfirmDeleteProps) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      onClick={(e) => {
        e.stopPropagation();
      }}
    >
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <div className="mb-4">
          <h2 className="text-xl font-bold">Delete Conversation</h2>
          <p className="text-gray-500 mt-1">
            Are you sure you want to delete this conversation? This action
            cannot be undone.
          </p>
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={() => onOpen(false)}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              confirmDelete();
              onOpen(false);
            }}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDelete;
