

import React, { useState, useMemo, useEffect } from 'react';
// FIX: Using Firebase v8 compat syntax, imports are no longer needed here.
import { db, auth, appId } from '../services/firebase';
import type { Transaction, Settings } from '../types';
import TransactionTable from './TransactionTable';
import Pagination from './Pagination';

interface TransactionsSectionProps {
    data: Transaction[];
    categories: string[];
    updateTransaction: (id: string, updatedTx: Transaction) => Promise<void>;
    setTransactions: React.Dispatch<React.SetStateAction<Transaction[]>>;
    saveSettings: (settings: Settings) => Promise<void>;
    settings: Settings;
    requestDelete: (transaction: Transaction) => void;
    clientName: string;
}

const TransactionsSection: React.FC<TransactionsSectionProps> = ({ data, categories, updateTransaction, setTransactions, saveSettings, settings, requestDelete, clientName }) => {
    const [selected, setSelected] = useState<string[]>([]);
    const [activeTable, setActiveTable] = useState<'expenses' | 'income'>('expenses');
    const [currentPage, setCurrentPage] = useState(1);
    const [bulkCategory, setBulkCategory] = useState('');
    const [sortConfig, setSortConfig] = useState<{ key: keyof Transaction | null; direction: 'ascending' | 'descending' }>({ key: null, direction: 'ascending' });
    const ITEMS_PER_PAGE = 20;

    const requestSort = (key: keyof Transaction) => {
        let direction: 'ascending' | 'descending' = 'ascending';
        if (sortConfig.key === key && sortConfig.direction === 'ascending') {
            direction = 'descending';
        }
        setSortConfig({ key, direction });
    };
    
    const { incomeTx, expenseTx } = useMemo(() => {
        let income = data.filter(tx => tx.Amount > 0);
        let expense = data.filter(tx => tx.Amount < 0);

        if (sortConfig.key) {
            const key = sortConfig.key as keyof Transaction;
            
            const sorter = (a: Transaction, b: Transaction) => {
                const valA = a[key];
                const valB = b[key];

                if (valA === undefined || valA === null) return 1;
                if (valB === undefined || valB === null) return -1;
                
                let comparison = 0;
                if (typeof valA === 'number' && typeof valB === 'number') {
                    comparison = valA - valB;
                } else {
                    comparison = String(valA).localeCompare(String(valB));
                }

                return sortConfig.direction === 'ascending' ? comparison : -comparison;
            };

            income = income.sort(sorter);
            expense = expense.sort(sorter);

        } else {
            // Default sorting logic
            const sortTransactions = (a: Transaction, b: Transaction): number => {
                const codeA = a.code || '';
                const codeB = b.code || '';

                if (codeA && codeB) {
                    const codeCompare = codeA.localeCompare(codeB);
                    if (codeCompare !== 0) return codeCompare;
                } else if (codeA) {
                    return -1; // A has code, B doesn't, A comes first
                } else if (codeB) {
                    return 1; // B has code, A doesn't, B comes first
                }

                // If codes are same or both are empty, sort by category name
                const catCompare = a.category.localeCompare(b.category);
                if (catCompare !== 0) return catCompare;

                // Then by payee as a fallback
                return a.Payee.localeCompare(b.Payee);
            };
            
            income = income.sort(sortTransactions);
            expense = expense.sort(sortTransactions);
        }

        return { incomeTx: income, expenseTx: expense };
    }, [data, sortConfig]);
    
    useEffect(() => {
        setCurrentPage(1);
        setSelected([]);
        setSortConfig({ key: null, direction: 'ascending' });
    }, [activeTable]);

    const currentTableData = activeTable === 'expenses' ? expenseTx : incomeTx;

    const paginatedData = useMemo(() => {
        const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
        return currentTableData.slice(startIndex, startIndex + ITEMS_PER_PAGE);
    }, [currentTableData, currentPage]);
    
    const handleApplyBulkChange = async () => {
        if (!bulkCategory) {
            alert("Please select a category to apply.");
            return;
        }
        
        const newTransactions = data.map(tx =>
            selected.includes(tx.id) ? { ...tx, category: bulkCategory } : tx
        );
        setTransactions(newTransactions);

        if (!auth.currentUser) return;
        
        // FIX: Use v8 compat batch syntax
        const batch = db.batch();
        const userRef = db.collection('artifacts').doc(appId).collection('users').doc(auth.currentUser.uid);
        let newMapping = { ...settings.mapping };

        selected.forEach(id => {
            const tx = data.find(t => t.id === id);
            if (tx) {
                newMapping[tx.Payee.toUpperCase()] = bulkCategory;
            }
        });
        
        batch.update(userRef, { mapping: newMapping });
        await batch.commit();
        await saveSettings({ ...settings, mapping: newMapping });
        
        setSelected([]);
        setBulkCategory('');
    };

    const handleDownload = (format: 'csv') => {
        const now = new Date();
        const timestamp = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}_${String(now.getHours()).padStart(2, '0')}-${String(now.getMinutes()).padStart(2, '0')}`;
        const safeClientName = clientName.replace(/[^a-z0-9]/gi, '_').toLowerCase();
        const filename = `${safeClientName}_gst_report_${timestamp}`;
        
        const sortedData = [...data].sort((a, b) => {
            // Use a very high character for empty codes to push them to the end.
            const codeA = a.code || '\uFFFF'; 
            const codeB = b.code || '\uFFFF';
            return String(codeA).localeCompare(String(codeB), undefined, { numeric: true });
        });

        const reportData = sortedData.map(tx => ({
            'Date': tx.Date,
            'Payee': tx.Payee,
            'Category': tx.category,
            'Code': tx.code || '',
            'Amount': tx.Amount.toFixed(2),
            'GST Ratio': `${(tx.gstRatio! * 100).toFixed(0)}%`,
            'GST Amount': tx.gstAmount!.toFixed(2)
        }));

        if (format === 'csv') {
            const csv = (window as any).Papa.unparse(reportData);
            const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement("a");
            const url = URL.createObjectURL(blob);
            link.setAttribute("href", url);
            link.setAttribute("download", `${filename}.csv`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    };

    return (
        <div className="bg-white p-6 rounded-lg shadow-sm">
            <div className="flex justify-between items-center mb-4">
                <div className="flex border-b">
                    <button onClick={() => setActiveTable('expenses')} className={`px-4 py-2 text-sm font-medium ${activeTable === 'expenses' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500'}`}>Purchases & Expenses ({expenseTx.length})</button>
                    <button onClick={() => setActiveTable('income')} className={`px-4 py-2 text-sm font-medium ${activeTable === 'income' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500'}`}>Sales & Income ({incomeTx.length})</button>
                </div>
                <div className="flex items-center space-x-2">
                    <button 
                        onClick={() => handleDownload('csv')} 
                        className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 font-semibold flex items-center space-x-2 shadow-sm"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                        <span>CSV Download</span>
                    </button>
                </div>
            </div>

            {selected.length > 0 && (
                <div className="bg-blue-50 p-3 rounded-md mb-4 flex items-center space-x-4">
                    <span className="font-medium text-sm text-blue-800">{selected.length} item(s) selected</span>
                    <select 
                        value={bulkCategory}
                        onChange={(e) => setBulkCategory(e.target.value)} 
                        className="bg-white border-gray-300 rounded-md shadow-sm text-sm"
                    >
                        <option value="">Change category...</option>
                        {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                    </select>
                    <button 
                        onClick={handleApplyBulkChange} 
                        disabled={!bulkCategory}
                        className="text-sm bg-blue-600 text-white px-3 py-1.5 rounded-md hover:bg-blue-700 disabled:bg-blue-300 font-semibold"
                    >
                        Apply
                    </button>
                    <button onClick={() => { setSelected([]); setBulkCategory(''); }} className="text-sm text-gray-600 hover:underline">Cancel</button>
                </div>
            )}
            
            <TransactionTable 
                transactions={paginatedData}
                categories={categories}
                updateTransaction={updateTransaction}
                selected={selected}
                setSelected={setSelected}
                requestDelete={requestDelete}
                sortConfig={sortConfig}
                requestSort={requestSort}
            />

            <Pagination 
                currentPage={currentPage}
                totalItems={currentTableData.length}
                itemsPerPage={ITEMS_PER_PAGE}
                onPageChange={setCurrentPage}
            />
        </div>
    );
};

export default TransactionsSection;