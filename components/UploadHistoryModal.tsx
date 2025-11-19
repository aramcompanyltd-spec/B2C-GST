
import React, { useState, useMemo } from 'react';
import type { UploadRecord } from '../types';
import Pagination from './Pagination';

interface UploadHistoryModalProps {
  history: UploadRecord[];
  onClose: () => void;
  userName?: string;
}

const UploadHistoryModal: React.FC<UploadHistoryModalProps> = ({ history, onClose, userName }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const ITEMS_PER_PAGE = 20;

  const getDate = (timestamp: any): Date => {
    if (!timestamp) return new Date();
    if (typeof timestamp === 'string') return new Date(timestamp);
    if (timestamp.toDate) return timestamp.toDate(); // Firestore Timestamp
    return new Date();
  };

  const filteredRecords = useMemo(() => {
    return history.filter(record => {
      if (!record.timestamp) return false;
      const recordDate = getDate(record.timestamp);
      // Reset hours for accurate date comparison
      recordDate.setHours(0, 0, 0, 0);

      let isValid = true;
      if (startDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        if (recordDate < start) isValid = false;
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(0, 0, 0, 0);
        if (recordDate > end) isValid = false;
      }
      return isValid;
    });
  }, [history, startDate, endDate]);

  const paginatedRecords = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredRecords.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredRecords, currentPage]);

  const handleDownload = () => {
     const csvData = filteredRecords.map(rec => {
         const date = getDate(rec.timestamp);
         return {
             Date: date.toLocaleDateString() + ' ' + date.toLocaleTimeString()
         }
     });

     const csv = (window as any).Papa.unparse(csvData);
     const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
     const link = document.createElement("a");
     const url = URL.createObjectURL(blob);
     const timestamp = new Date().toISOString().slice(0,10);
     
     link.setAttribute("href", url);
     link.setAttribute("download", `upload_history_${timestamp}.csv`);
     document.body.appendChild(link);
     link.click();
     document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl flex flex-col" style={{ maxHeight: '90vh' }}>
        <div className="p-6 border-b flex justify-between items-center">
          <div>
              <h2 className="text-2xl font-bold text-gray-800">
                  Upload History {userName ? <span className="text-blue-600 text-lg">for {userName}</span> : ''}
              </h2>
              <p className="text-sm text-gray-500">View upload logs.</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-4 bg-gray-50 border-b flex flex-wrap items-end gap-4">
            <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Start Date</label>
                <input type="date" value={startDate} onChange={e => { setStartDate(e.target.value); setCurrentPage(1); }} className="p-2 border rounded text-sm" />
            </div>
            <div>
                 <label className="block text-xs font-medium text-gray-700 mb-1">End Date</label>
                <input type="date" value={endDate} onChange={e => { setEndDate(e.target.value); setCurrentPage(1); }} className="p-2 border rounded text-sm" />
            </div>
            <div className="flex-grow"></div>
             <button 
                onClick={handleDownload} 
                disabled={filteredRecords.length === 0}
                className="bg-green-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-green-700 disabled:bg-green-300 flex items-center space-x-2"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                <span>Download CSV</span>
            </button>
        </div>

        <div className="flex-grow overflow-y-auto p-6">
          {history.length === 0 ? (
            <p className="text-center text-gray-500 py-8">No upload history available.</p>
          ) : filteredRecords.length === 0 ? (
            <p className="text-center text-gray-500 py-8">No history found for the selected period.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-100 text-gray-600 uppercase font-semibold">
                  <tr>
                    <th className="p-3">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {paginatedRecords.map(rec => {
                      const date = getDate(rec.timestamp);
                      return (
                        <tr key={rec.id} className="hover:bg-gray-50">
                          <td className="p-3 whitespace-nowrap">
                              <div className="font-medium text-gray-900">{date.toLocaleDateString()}</div>
                              <div className="text-xs text-gray-500">{date.toLocaleTimeString()}</div>
                          </td>
                        </tr>
                      );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
        
        <div className="p-4 border-t">
             <Pagination 
                currentPage={currentPage}
                totalItems={filteredRecords.length}
                itemsPerPage={ITEMS_PER_PAGE}
                onPageChange={setCurrentPage}
            />
        </div>
      </div>
    </div>
  );
};

export default UploadHistoryModal;
