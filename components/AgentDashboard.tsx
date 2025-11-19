import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { db, appId } from '../services/firebase';
import type { FirebaseUser, ManagedUser, Settings } from '../types';
import Pagination from './Pagination';
import DeleteConfirmationModal from './DeleteConfirmationModal';

interface AgentDashboardProps {
  user: FirebaseUser;
  onClientSelect: (client: ManagedUser) => void;
  settings: Settings;
}

const AddClientModal: React.FC<{
  onClose: () => void;
  onSave: (companyName: string, irdNumber: string) => void;
}> = ({ onClose, onSave }) => {
  const [companyName, setCompanyName] = useState('');
  const [irdNumber, setIrdNumber] = useState('');

  const handleSave = () => {
    if (companyName.trim() || irdNumber.trim()) {
      onSave(companyName.trim(), irdNumber.trim());
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
        <h3 className="text-lg font-bold mb-4">Add New Client</h3>
        <p className="text-sm text-gray-500 mb-4">Enter a Company Name or IRD Number to identify your client.</p>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium">Company Name</label>
            <input type="text" value={companyName} onChange={(e) => setCompanyName(e.target.value)} className="w-full p-2 bg-white border rounded" placeholder="e.g., ABC Trading Ltd" />
          </div>
          <div>
            <label className="block text-sm font-medium">IRD Number</label>
            <input type="text" value={irdNumber} onChange={(e) => setIrdNumber(e.target.value)} className="w-full p-2 bg-white border rounded" placeholder="e.g., 123-456-789" />
          </div>
        </div>
        <div className="mt-6 flex justify-end space-x-4">
          <button onClick={onClose} className="px-4 py-2 bg-gray-200 rounded-md hover:bg-gray-300">Cancel</button>
          <button onClick={handleSave} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">Save Client</button>
        </div>
      </div>
    </div>
  );
};

const AgentDashboard: React.FC<AgentDashboardProps> = ({ user, onClientSelect, settings }) => {
  const [managedUsers, setManagedUsers] = useState<ManagedUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [clientToDelete, setClientToDelete] = useState<ManagedUser | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 20;

  const fetchClients = useCallback(async () => {
    setIsLoading(true);
    try {
      const clientsRef = db.collection('artifacts').doc(appId).collection('users').doc(user.uid).collection('managedUsers');
      const snapshot = await clientsRef.get();
      const clientsList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ManagedUser));
      setManagedUsers(clientsList.sort((a,b) => a.companyName.localeCompare(b.companyName)));
    } catch (err: any) {
      console.error("Error fetching clients: ", err);
      setError('Failed to load client data.');
    } finally {
      setIsLoading(false);
    }
  }, [user.uid]);

  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  const handleAddClient = async (companyName: string, irdNumber: string) => {
    const newClient: Omit<ManagedUser, 'id'> = {
        companyName: companyName || `Client (IRD: ${irdNumber})`,
        irdNumber,
        mapping: {},
        accountTable: settings.accountTable,
    };
    try {
        const clientsRef = db.collection('artifacts').doc(appId).collection('users').doc(user.uid).collection('managedUsers');
        await clientsRef.add(newClient);
        setShowAddModal(false);
        fetchClients(); // Refresh list
    } catch (err) {
        console.error("Error adding client:", err);
        setError("Could not save the new client. Please try again.");
    }
  };

  const handleDeleteClient = async () => {
    if (!clientToDelete) return;
    try {
        const clientRef = db.collection('artifacts').doc(appId).collection('users').doc(user.uid).collection('managedUsers').doc(clientToDelete.id);
        await clientRef.delete();
        setClientToDelete(null);
        fetchClients(); // Refresh list after deletion
    } catch (err) {
        console.error("Error deleting client:", err);
        setError("Could not delete the client. Please try again.");
        setClientToDelete(null);
    }
  };

  const paginatedClients = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return managedUsers.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [managedUsers, currentPage]);


  if (isLoading) {
    return <p>Loading clients...</p>;
  }

  if (error) {
    return <p className="text-red-500">{error}</p>;
  }

  return (
    <div className="mt-8">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Client Management</h2>
        <button onClick={() => setShowAddModal(true)} className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 font-semibold">
          + Add New Client
        </button>
      </div>
      
      <div className="bg-white rounded-lg shadow-md">
        <div className="p-4 border-b">
          <h3 className="font-semibold">Your Clients ({managedUsers.length})</h3>
        </div>
        {managedUsers.length === 0 ? (
            <div className="text-center p-12 text-gray-500">
                <p className="font-semibold mb-2">No clients found.</p>
                <p>Click "Add New Client" to get started.</p>
            </div>
        ) : (
            <>
                <ul className="divide-y">
                    {paginatedClients.map(client => (
                    <li key={client.id} className="p-4 flex justify-between items-center hover:bg-gray-50">
                        <div>
                            <p className="font-semibold text-gray-900">{client.companyName}</p>
                            <p className="text-sm text-gray-500">IRD: {client.irdNumber || 'N/A'}</p>
                        </div>
                        <div className="flex items-center space-x-2">
                            <button onClick={() => onClientSelect(client)} className="bg-green-500 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-green-600">
                                Start New GST Task
                            </button>
                            <button onClick={() => setClientToDelete(client)} className="bg-red-500 text-white px-3 py-2 rounded-md text-sm font-medium hover:bg-red-600">
                                Delete
                            </button>
                        </div>
                    </li>
                    ))}
                </ul>
                {managedUsers.length > ITEMS_PER_PAGE && (
                    <div className="p-4 border-t">
                        <Pagination 
                            currentPage={currentPage}
                            totalItems={managedUsers.length}
                            itemsPerPage={ITEMS_PER_PAGE}
                            onPageChange={setCurrentPage}
                        />
                    </div>
                )}
            </>
        )}
      </div>

      {showAddModal && (
        <AddClientModal
          onClose={() => setShowAddModal(false)}
          onSave={handleAddClient}
        />
      )}
      {clientToDelete && (
        <DeleteConfirmationModal
            title="Confirm Client Deletion"
            message={`Are you sure you want to delete this client (${clientToDelete.companyName})? All associated data will be permanently removed.`}
            onConfirm={handleDeleteClient}
            onCancel={() => setClientToDelete(null)}
        />
      )}
    </div>
  );
};

export default AgentDashboard;