

import React, { useState, useMemo } from 'react';
import type { AccountCategory } from '../types';
import DeleteConfirmationModal from './DeleteConfirmationModal';

interface AccountTableModalProps {
  initialTable: AccountCategory[];
  onSave: (newTable: AccountCategory[]) => void;
  onClose: () => void;
  agentDefaultTable?: AccountCategory[];
}

const AccountTableModal: React.FC<AccountTableModalProps> = ({ initialTable, onSave, onClose, agentDefaultTable }) => {
  const [table, setTable] = useState<AccountCategory[]>(() => JSON.parse(JSON.stringify(initialTable)));
  const [editingRowId, setEditingRowId] = useState<string | null>(null);
  const [editedRow, setEditedRow] = useState<AccountCategory | null>(null);
  const [saveFeedback, setSaveFeedback] = useState('');
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const handleAddNew = () => {
    const newCategory: AccountCategory = {
      id: crypto.randomUUID(),
      name: 'New Account',
      ratio: 1.0,
      code: '',
      isDeletable: true,
    };
    setTable(prev => [...prev, newCategory]);
    handleStartEdit(newCategory);
  };

  const handleDelete = (id: string) => {
    setTable(prev => prev.filter(row => row.id !== id));
  };
  
  const handleStartEdit = (row: AccountCategory) => {
    setEditingRowId(row.id);
    setEditedRow({ ...row });
  };
  
  const handleCancelEdit = () => {
    setEditingRowId(null);
    setEditedRow(null);
  };
  
  const handleSaveEdit = () => {
    if (!editedRow) return;
    setTable(prev => prev.map(row => row.id === editedRow.id ? editedRow : row));
    handleCancelEdit();
  };

  const handleEditChange = (field: keyof AccountCategory, value: string | number | boolean) => {
    if (!editedRow) return;
    
    let processedValue = value;
    if (field === 'ratio') {
        const numValue = Math.min(100, Math.max(0, parseFloat(value as string) || 0));
        processedValue = numValue / 100;
    }
    
    setEditedRow(prev => prev ? { ...prev, [field]: processedValue } : null);
  };

  const handleSave = () => {
    onSave(table);
    setSaveFeedback('Changes saved!');
    setTimeout(() => {
        setSaveFeedback('');
    }, 2000);
  };

  const handleResetToDefault = () => {
    if (agentDefaultTable) {
      setTable(JSON.parse(JSON.stringify(agentDefaultTable)));
    }
    setShowResetConfirm(false);
  };

  const headers = ['Account', 'Code', 'GST Ratio (%)', 'Actions'];

  const sortedTable = useMemo(() => {
    return [...table].sort((a, b) => {
        const codeA = a.code || '';
        const codeB = b.code || '';
        
        const codeComparison = codeA.localeCompare(codeB);
        if (codeComparison !== 0) return codeComparison;

        return a.name.localeCompare(b.name);
    });
  }, [table]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl flex flex-col" style={{ height: '90vh' }}>
        <div className="p-6 border-b">
          <h2 className="text-2xl font-bold">Account Table</h2>
          <p className="text-sm text-gray-500">Manage your chart of accounts for GST categorization.</p>
        </div>
        
        <div className="flex-grow overflow-y-auto">
          <table className="w-full text-sm text-left">
            <thead className="sticky top-0 bg-gray-100 z-10">
              <tr>
                {headers.map(h => <th key={h} className="p-3 font-semibold text-gray-600 uppercase">{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {sortedTable.map(row => {
                const isEditing = editingRowId === row.id;
                const currentRow = isEditing ? editedRow : row;

                if (!currentRow) return null;

                return (
                  <tr key={row.id} className={`border-b ${isEditing ? 'bg-yellow-50' : 'hover:bg-gray-50'}`}>
                    <td className="p-3">
                      {isEditing ? (
                        <input type="text" value={currentRow.name} onChange={e => handleEditChange('name', e.target.value)} className="w-full p-1 border rounded" />
                      ) : (
                        <span className="font-medium text-gray-800">{row.name}</span>
                      )}
                    </td>
                    <td className="p-3">
                      {isEditing ? (
                        <input type="text" value={currentRow.code} onChange={e => handleEditChange('code', e.target.value)} className="w-24 p-1 border rounded" />
                      ) : (
                        <span className="text-gray-800">{row.code || '-'}</span>
                      )}
                    </td>
                    <td className="p-3">
                      {isEditing ? (
                        <input type="number" value={(currentRow.ratio * 100).toFixed(0)} onChange={e => handleEditChange('ratio', e.target.value)} className="w-20 p-1 border rounded" />
                      ) : (
                        <span className="text-gray-800">{(row.ratio * 100).toFixed(0)}%</span>
                      )}
                    </td>
                    <td className="p-3">
                      {isEditing ? (
                        <div className="flex items-center space-x-2">
                           <button onClick={handleSaveEdit} className="text-green-600 hover:text-green-800 p-1">Save</button>
                           <button onClick={handleCancelEdit} className="text-gray-600 hover:text-gray-800 p-1">Cancel</button>
                        </div>
                      ) : (
                        <div className="flex items-center space-x-2">
                          <button onClick={() => handleStartEdit(row)} className="text-blue-600 hover:text-blue-800 p-1">Edit</button>
                          {row.isDeletable && (
                            <button onClick={() => handleDelete(row.id)} className="text-red-600 hover:text-red-800 p-1">Delete</button>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="p-6 border-t flex justify-between items-center">
          <div>
            <button onClick={handleAddNew} className="text-sm text-blue-600 hover:underline font-semibold">+ Add New Account</button>
            {agentDefaultTable && (
                <button
                    onClick={() => setShowResetConfirm(true)}
                    className="ml-4 text-sm text-orange-600 hover:underline font-semibold"
                >
                    Reset to Agent's Default
                </button>
            )}
          </div>
          <div className="flex items-center space-x-4">
            {saveFeedback && <span className="text-sm text-green-600 transition-opacity duration-300">{saveFeedback}</span>}
            <button onClick={handleSave} className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-bold">Save Changes</button>
            <button onClick={onClose} className="px-4 py-2 bg-gray-200 rounded-md hover:bg-gray-300">Close</button>
          </div>
        </div>
        {showResetConfirm && (
          <DeleteConfirmationModal
            title="Confirm Reset"
            message="Are you sure you want to reset this client's account table to the agent's default? Any custom changes will be lost."
            onConfirm={handleResetToDefault}
            onCancel={() => setShowResetConfirm(false)}
            confirmText="Reset"
            confirmColor="bg-orange-500 hover:bg-orange-600"
          />
        )}
      </div>
    </div>
  );
};

export default AccountTableModal;