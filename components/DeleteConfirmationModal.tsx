
import React from 'react';

interface DeleteConfirmationModalProps {
  onConfirm: () => void;
  onCancel: () => void;
  title: string;
  message: string;
  confirmText?: string;
  confirmColor?: string;
}

const DeleteConfirmationModal: React.FC<DeleteConfirmationModalProps> = ({ onConfirm, onCancel, title, message, confirmText = 'Delete', confirmColor = 'bg-red-600 hover:bg-red-700' }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-sm">
        <h3 className="text-lg font-bold">{title}</h3>
        <p className="mt-2 text-sm text-gray-600">{message}</p>
        <div className="mt-6 flex justify-end space-x-4">
          <button onClick={onCancel} className="px-4 py-2 bg-gray-200 rounded-md hover:bg-gray-300">Cancel</button>
          <button onClick={onConfirm} className={`px-4 py-2 text-white rounded-md ${confirmColor}`}>
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteConfirmationModal;
