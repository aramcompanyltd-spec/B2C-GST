

import React, { useState } from 'react';
import type { Transaction } from '../types';
import { getCategoryColor, formatDateForDisplay } from '../utils/helpers';

interface TransactionTableProps {
    transactions: Transaction[];
    categories: string[];
    updateTransaction: (id: string, updatedTx: Transaction) => void;
    selected: string[];
    setSelected: React.Dispatch<React.SetStateAction<string[]>>;
    requestDelete: (transaction: Transaction) => void;
    requestSort: (key: keyof Transaction) => void;
    sortConfig: { key: keyof Transaction | null; direction: 'ascending' | 'descending' };
}

const TransactionTable: React.FC<TransactionTableProps> = ({ transactions, categories, updateTransaction, selected, setSelected, requestDelete, sortConfig, requestSort }) => {
    const [editingRow, setEditingRow] = useState<Transaction | null>(null);

    const handleStartEdit = (tx: Transaction) => setEditingRow({ ...tx });
    const handleCancelEdit = () => setEditingRow(null);
    const handleSaveEdit = () => {
        if (!editingRow) return;
        const updatedTx = { ...editingRow, Amount: parseFloat(String(editingRow.Amount)) || 0 };
        updateTransaction(editingRow.id, updatedTx);
        setEditingRow(null);
    };

    const handleEditChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setEditingRow(prev => prev ? { ...prev, [name]: value } : null);
    };

    const toggleSelect = (id: string) => {
        setSelected(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
    };

    const toggleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.checked) {
            setSelected(transactions.map(tx => tx.id));
        } else {
            setSelected([]);
        }
    };

    const getSortIndicator = (columnKey: keyof Transaction) => {
        if (sortConfig.key !== columnKey) {
            return null;
        }
        return sortConfig.direction === 'ascending' ? '▲' : '▼';
    };
    
    return (
        <div className="w-full">
            <div className="flex items-center border-b bg-gray-50 font-medium text-xs text-gray-500 uppercase">
                <div className="p-2 w-10 flex-shrink-0"><input type="checkbox" onChange={toggleSelectAll} checked={transactions.length > 0 && selected.length === transactions.length} className="rounded" /></div>
                <div className="p-2 w-28 flex-shrink-0">
                    <button onClick={() => requestSort('Date')} className="flex items-center space-x-1 w-full text-left font-medium text-xs text-gray-500 uppercase hover:text-gray-800 transition-colors">
                        <span>Date</span>
                        <span className="text-gray-400 w-3">{getSortIndicator('Date')}</span>
                    </button>
                </div>
                <div className="p-2 flex-grow">
                    <button onClick={() => requestSort('Payee')} className="flex items-center space-x-1 w-full text-left font-medium text-xs text-gray-500 uppercase hover:text-gray-800 transition-colors">
                        <span>Payee</span>
                        <span className="text-gray-400 w-3">{getSortIndicator('Payee')}</span>
                    </button>
                </div>
                <div className="p-2 w-48 flex-shrink-0">
                    <button onClick={() => requestSort('category')} className="flex items-center space-x-1 w-full text-left font-medium text-xs text-gray-500 uppercase hover:text-gray-800 transition-colors">
                        <span>Account</span>
                        <span className="text-gray-400 w-3">{getSortIndicator('category')}</span>
                    </button>
                </div>
                <div className="p-2 w-24 flex-shrink-0">
                    <button onClick={() => requestSort('code')} className="flex items-center space-x-1 w-full text-left font-medium text-xs text-gray-500 uppercase hover:text-gray-800 transition-colors">
                        <span>Code</span>
                        <span className="text-gray-400 w-3">{getSortIndicator('code')}</span>
                    </button>
                </div>
                <div className="p-2 w-28 flex-shrink-0 text-left">
                    <button onClick={() => requestSort('Amount')} className="flex items-center space-x-1 w-full justify-start font-medium text-xs text-gray-500 uppercase hover:text-gray-800 transition-colors">
                        <span>Amount</span>
                        <span className="text-gray-400 w-3">{getSortIndicator('Amount')}</span>
                    </button>
                </div>
                <div className="p-2 w-20 flex-shrink-0 text-left">GST %</div>
                <div className="p-2 w-24 flex-shrink-0 text-left">GST Amt</div>
                <div className="p-2 w-24 text-center">Actions</div>
            </div>
            <div>
                {transactions.map((tx) => {
                    const isSelected = selected.includes(tx.id);
                    const isEditing = editingRow?.id === tx.id;
                    return (
                        <div key={tx.id} className={`flex items-center border-b min-h-[55px] ${isSelected ? 'bg-blue-50' : ''} ${isEditing ? 'bg-yellow-50' : ''}`}>
                            <div className="p-2 w-10 flex-shrink-0"><input type="checkbox" checked={isSelected} onChange={() => toggleSelect(tx.id)} className="rounded" /></div>
                            <div className="p-2 w-28 flex-shrink-0 text-sm text-gray-600">
                                {isEditing ? <input type="date" name="Date" value={editingRow.Date} onChange={handleEditChange} className="w-full p-1 bg-white border rounded" /> : formatDateForDisplay(tx.Date)}
                            </div>
                            <div className="p-2 flex-grow text-sm font-medium">
                                {isEditing ? <input type="text" name="Payee" value={editingRow.Payee} onChange={handleEditChange} className="w-full p-1 bg-white border rounded" /> : tx.Payee}
                            </div>
                            <div className="p-2 w-48 flex-shrink-0 text-sm">
                                {isEditing ? (
                                    <select name="category" value={editingRow.category} onChange={handleEditChange} className="w-full p-1 bg-white border rounded">
                                        {categories.map(c => <option key={c} value={c}>{c}</option>)}
                                    </select>
                                ) : (
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(tx.category)}`}>{tx.category}</span>
                                )}
                            </div>
                            <div className="p-2 w-24 flex-shrink-0 text-sm text-gray-600">
                                {tx.code}
                            </div>
                            <div className={`p-2 w-28 flex-shrink-0 text-left font-mono text-sm`}>
                                {isEditing ? <input type="number" name="Amount" value={editingRow.Amount} className="w-full p-1 bg-gray-100 border rounded text-left" disabled /> :
                                    <span className={tx.Amount > 0 ? 'text-green-600' : 'text-red-600'}>${Math.abs(tx.Amount).toFixed(2)}</span>
                                }
                            </div>
                            <div className="p-2 w-20 flex-shrink-0 text-left text-sm text-gray-600">{(tx.gstRatio! * 100).toFixed(0)}%</div>
                            <div className="p-2 w-24 flex-shrink-0 text-left text-sm font-mono text-gray-800">${tx.gstAmount!.toFixed(2)}</div>
                            <div className="p-2 w-24 text-center flex items-center justify-center space-x-2">
                                {isEditing ? (
                                    <>
                                        <button onClick={handleSaveEdit} className="text-green-600 hover:text-green-800 p-1 rounded-full hover:bg-green-100 transition-colors">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                            </svg>
                                        </button>
                                        <button onClick={handleCancelEdit} className="text-gray-600 hover:text-gray-800 p-1 rounded-full hover:bg-gray-100 transition-colors">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                        </button>
                                    </>
                                ) : (
                                    <>
                                        <button onClick={() => handleStartEdit(tx)} className="text-blue-600 hover:text-blue-800 p-1 rounded-full hover:bg-blue-100 transition-colors">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.5L15.232 5.232z" />
                                            </svg>
                                        </button>
                                        <button onClick={() => requestDelete(tx)} className="text-red-600 hover:text-red-800 p-1 rounded-full hover:bg-red-100 transition-colors">
                                             <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                            </svg>
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default TransactionTable;