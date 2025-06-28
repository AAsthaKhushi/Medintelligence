import React, { useState } from 'react';

interface DeleteConfirmationDialogProps {
  open: boolean;
  onConfirm: (permanent?: boolean) => void;
  onCancel: () => void;
}

// DeleteConfirmationDialog asks the user to confirm deletion of a prescription.
const DeleteConfirmationDialog: React.FC<DeleteConfirmationDialogProps> = ({ open, onConfirm, onCancel }) => {
  const [permanent, setPermanent] = useState(false);
  const [undo, setUndo] = useState(false);

  if (!open) return null;
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-sm w-full">
        <div className="mb-4 text-slate-800 font-medium">
          {permanent ? 'Are you sure you want to permanently delete this prescription? This action cannot be undone.' : 'Are you sure you want to move this prescription to trash?'}
        </div>
        <div className="flex items-center gap-2 mb-4">
          <input type="checkbox" id="permanent" checked={permanent} onChange={e => setPermanent(e.target.checked)} />
          <label htmlFor="permanent" className="text-sm text-slate-700">Permanently delete</label>
        </div>
        <div className="flex justify-end gap-2">
          <button className="bg-gray-200 px-4 py-2 rounded" onClick={onCancel}>Cancel</button>
          <button className="bg-red-500 text-white px-4 py-2 rounded" onClick={() => { onConfirm(permanent); setUndo(true); }}>Delete</button>
        </div>
        {undo && (
          <div className="mt-4 text-green-600 text-sm">Prescription deleted. <button className="underline" onClick={onCancel}>Undo</button></div>
        )}
        <div className="mt-4 text-xs text-slate-400">Bulk delete coming soon.</div>
      </div>
    </div>
  );
};

export default DeleteConfirmationDialog; 