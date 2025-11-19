
import React, { useState } from 'react';
import type { UserData } from '../types';

interface EditUserModalProps {
  user: UserData;
  onSave: (userId: string, newData: { status: string; credits: number; role: 'user' | 'admin' | 'agent' }) => void;
  onClose: () => void;
  onDelete: (user: UserData) => void;
}

const EditUserModal: React.FC<EditUserModalProps> = ({ user, onSave, onClose, onDelete }) => {
  const [status, setStatus] = useState(user.status || 'active');
  const [credits, setCredits] = useState(user.credits || 0);
  const [role, setRole] = useState(user.role || 'user');

  const handleSave = () => {
    onSave(user.id, { status, credits: Number(credits), role });
  };

  const handleDelete = () => {
    onDelete(user);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
        <h3 className="text-lg font-bold mb-4">Edit User: {user.profile.email}</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium">Status</label>
            <select value={status} onChange={(e) => setStatus(e.target.value)} className="w-full p-2 bg-white border rounded">
              <option value="active">Active</option>
              <option value="suspended">Suspended</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium">Credits</label>
            <input type="number" value={credits} onChange={(e) => setCredits(Number(e.target.value))} className="w-full p-2 bg-white border rounded" />
          </div>
          <div>
            <label className="block text-sm font-medium">Role</label>
            <select value={role} onChange={(e) => setRole(e.target.value as 'user' | 'admin' | 'agent')} className="w-full p-2 bg-white border rounded">
              <option value="user">User</option>
              <option value="admin">Admin</option>
              <option value="agent">Agent</option>
            </select>
          </div>
        </div>
        <div className="mt-6 flex justify-between items-center">
          <button onClick={handleDelete} className="px-4 py-2 text-sm bg-red-100 text-red-700 rounded-md hover:bg-red-200 font-semibold">
              Delete User
          </button>
          <div className="flex space-x-4">
              <button onClick={onClose} className="px-4 py-2 bg-gray-200 rounded-md hover:bg-gray-300">Cancel</button>
              <button onClick={handleSave} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">Save</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditUserModal;
