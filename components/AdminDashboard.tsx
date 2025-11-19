
import React, { useState, useEffect, useCallback } from 'react';
// FIX: Using Firebase v8 compat syntax, imports are no longer needed here.
import { db, appId } from '../services/firebase';
import type { UserData } from '../types';
import { DEFAULT_ACCOUNT_TABLE } from '../utils/constants';
import DeleteConfirmationModal from './DeleteConfirmationModal';
import EditUserModal from './EditUserModal';
import UploadHistoryModal from './UploadHistoryModal';

const AdminDashboard: React.FC = () => {
  const [users, setUsers] = useState<UserData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingUser, setEditingUser] = useState<UserData | null>(null);
  const [userToDelete, setUserToDelete] = useState<UserData | null>(null);
  const [viewingHistoryUser, setViewingHistoryUser] = useState<UserData | null>(null);

  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      // FIX: Use v8 compat syntax for collection reference
      const usersRef = db.collection('artifacts').doc(appId).collection('users');
      // FIX: Use v8 compat .get() method to fetch collection
      const querySnapshot = await usersRef.get();
      const userList = querySnapshot.docs.map(doc => {
        const data = doc.data();
        // Defensive data mapping to prevent crashes with malformed documents
        return {
          id: doc.id,
          profile: data.profile || { email: data.email || 'No Email Found', name: '' },
          role: data.role || 'user',
          status: data.status || 'active',
          credits: data.credits !== undefined ? data.credits : 0,
          uploadCount: data.uploadCount !== undefined ? data.uploadCount : 0,
          mapping: data.mapping || {},
          accountTable: data.accountTable || DEFAULT_ACCOUNT_TABLE,
          uploadHistory: data.uploadHistory || [],
        } as UserData;
      });
      setUsers(userList.sort((a, b) => a.profile.email.localeCompare(b.profile.email)));
    } catch (err: any) {
      console.error("Error fetching users:", err);
      setError("Failed to load user data. This may be due to Firestore permissions. Check the browser console for more details.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleUpdateUser = async (userId: string, newData: Partial<UserData>) => {
    const originalUsers = [...users];
    // Optimistic UI update for a smoother experience
    setUsers(currentUsers =>
      currentUsers.map(u => (u.id === userId ? { ...u, ...newData } : u))
    );

    try {
      const userRef = db.collection('artifacts').doc(appId).collection('users').doc(userId);
      await userRef.update(newData);
    } catch (err) {
      console.error("Error updating user:", err);
      setError("Failed to update user. Reverting changes.");
      setUsers(originalUsers); // Revert on error
    }
  };

  const handleSaveFromModal = (userId: string, newData: { status: string; credits: number; role: 'user' | 'admin' | 'agent' }) => {
    handleUpdateUser(userId, newData);
    setEditingUser(null);
  };

  const handleDeleteUser = async () => {
    if (!userToDelete) return;
    try {
        // FIX: Use v8 compat syntax for document reference and .delete() method
        const userRef = db.collection('artifacts').doc(appId).collection('users').doc(userToDelete.id);
        await userRef.delete();
        console.warn(`User ${userToDelete.profile.email} deleted from Firestore, but not from Firebase Auth. A Cloud Function is required for complete deletion.`);
    } catch (err) {
        console.error("Error deleting user:", err);
    } finally {
        setUserToDelete(null);
        fetchUsers(); // Refetch user list
    }
  };
  
  const requestDeleteFromModal = (user: UserData) => {
    setEditingUser(null);
    setUserToDelete(user);
  };

  if (isLoading) {
    return (
        <div className="flex justify-center items-center p-10">
            <svg className="animate-spin h-5 w-5 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span className="ml-2">Loading user list...</span>
        </div>
    );
  }

  if (error) {
    return (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg" role="alert">
            <strong className="font-bold">Error:</strong>
            <span className="block sm:inline ml-2">{error}</span>
        </div>
    );
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-800 mb-8">User Management</h1>
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
        <table className="w-full text-left">
          <thead className="border-b border-gray-200 bg-gray-50">
            <tr>
              <th className="px-6 py-3 font-semibold text-gray-600 text-sm uppercase">Name</th>
              <th className="px-6 py-3 font-semibold text-gray-600 text-sm uppercase">Email</th>
              <th className="px-6 py-3 font-semibold text-gray-600 text-sm uppercase">Status</th>
              <th className="px-6 py-3 font-semibold text-gray-600 text-sm uppercase">Role</th>
              <th className="px-6 py-3 font-semibold text-gray-600 text-sm uppercase text-center">Credits</th>
              <th className="px-6 py-3 font-semibold text-gray-600 text-sm uppercase text-center">Uploads</th>
              <th className="px-6 py-3 font-semibold text-gray-600 text-sm uppercase text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr key={user.id} className="border-b border-gray-200 last:border-b-0 hover:bg-gray-50 transition-colors duration-150">
                <td className="px-6 py-4 font-medium text-gray-900">{user.profile.name || user.profile.email.split('@')[0]}</td>
                <td className="px-6 py-4 text-gray-600">{user.profile.email}</td>
                <td className="px-6 py-4">
                  <select
                    value={user.status}
                    onChange={(e) => handleUpdateUser(user.id, { status: e.target.value })}
                    className={`w-28 py-1 px-2 text-sm rounded border capitalize font-semibold ${user.status === 'active' ? 'bg-green-100 border-green-300 text-green-800' : 'bg-red-100 border-red-300 text-red-800'}`}
                  >
                    <option value="active">Active</option>
                    <option value="suspended">Suspended</option>
                  </select>
                </td>
                <td className="px-6 py-4">
                  <span className={`capitalize px-3 py-1 text-xs font-bold rounded-full leading-none ${user.role === 'admin' ? 'bg-indigo-200 text-indigo-800' : (user.role === 'agent' ? 'bg-teal-200 text-teal-800' : 'bg-gray-200 text-gray-800')}`}>
                    {user.role}
                  </span>
                </td>
                <td className="px-6 py-4 text-gray-800 text-center font-semibold">
                  {user.credits ?? 0}
                </td>
                <td className="px-6 py-4 text-gray-800 text-center font-semibold">
                  {user.uploadCount ?? 0}
                </td>
                <td className="px-6 py-4 text-center flex justify-center space-x-2">
                  <button onClick={() => setViewingHistoryUser(user)} className="bg-white border border-gray-300 text-gray-700 px-3 py-1 rounded-md text-sm font-semibold hover:bg-gray-100 hover:border-gray-400">
                    History
                  </button>
                  <button onClick={() => setEditingUser(user)} className="bg-white border border-gray-300 text-gray-700 px-3 py-1 rounded-md text-sm font-semibold hover:bg-gray-100 hover:border-gray-400">
                    Edit
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {users.length === 0 && (
          <div className="text-center py-10">
            <p className="text-gray-500">No users found.</p>
          </div>
        )}
      </div>

      {editingUser && (
        <EditUserModal 
          user={editingUser} 
          onSave={handleSaveFromModal} 
          onClose={() => setEditingUser(null)} 
          onDelete={requestDeleteFromModal}
        />
      )}
      {userToDelete && (
        <DeleteConfirmationModal
          title="Delete User"
          message={`Are you sure you want to delete '${userToDelete.profile.email}'? This action cannot be undone.`}
          onConfirm={handleDeleteUser}
          onCancel={() => setUserToDelete(null)}
        />
      )}
      {viewingHistoryUser && (
          <UploadHistoryModal 
            history={viewingHistoryUser.uploadHistory || []} 
            onClose={() => setViewingHistoryUser(null)} 
            userName={viewingHistoryUser.profile.name || viewingHistoryUser.profile.email}
          />
      )}
    </div>
  );
};

export default AdminDashboard;
