"use client";

export function DeleteConfirm({ open, onClose, onConfirm }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-xl w-full max-w-sm shadow-xl space-y-4">

        <h2 className="text-lg font-semibold text-red-600">Delete Entry?</h2>
        <p className="text-gray-600 text-sm">
          This action cannot be undone. Are you sure?
        </p>

        <div className="flex justify-end gap-3 pt-2">
          <button
            className="px-4 py-2 border rounded-lg"
            onClick={onClose}
          >
            Cancel
          </button>
          
          <button
            className="px-4 py-2 bg-red-600 text-white rounded-lg"
            onClick={onConfirm}
          >
            Delete
          </button>
        </div>

      </div>
    </div>
  );
}
