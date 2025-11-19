import React, { useState, useRef } from 'react';
import type { FileSlot } from '../types';
import { BANKS } from '../utils/constants';

interface FileUploadProps {
  onProcess: (files: FileSlot[]) => void;
  isLoading: boolean;
  error: string;
}

const FileUpload: React.FC<FileUploadProps> = ({ onProcess, isLoading, error }) => {
  const [fileSlots, setFileSlots] = useState<FileSlot[]>([{ id: 1, file: null, bank: null }]);
  const [dragOverId, setDragOverId] = useState<number | null>(null);
  const fileInputRefs = useRef<{ [key: number]: HTMLInputElement | null }>({});

  const handleBankChange = (id: number, bank: string) => {
    setFileSlots(slots => slots.map(slot => slot.id === id ? { ...slot, bank, error: undefined } : slot));
  };

  const handleFileChange = (id: number, selectedFile: File | undefined) => {
    if (selectedFile) {
      setFileSlots(slots => slots.map(slot => slot.id === id ? { ...slot, file: selectedFile, error: undefined } : slot));
    }
  };

  const handleRemoveSlot = (id: number) => {
    setFileSlots(slots => slots.filter(slot => slot.id !== id));
  };

  const addFileSlot = () => {
    if (fileSlots.length < 10) {
      const newId = (fileSlots[fileSlots.length - 1]?.id || 0) + 1;
      setFileSlots(slots => [...slots, { id: newId, file: null, bank: null }]);
    }
  };

  const handleProcessClick = () => {
    const filesToProcess = fileSlots.filter(slot => slot.file && slot.bank);
    if (filesToProcess.length === 0) {
      alert("Please select a bank and upload at least one file.");
      return;
    }
    onProcess(filesToProcess);
  };

  const triggerFileSelect = (id: number) => {
    const slot = fileSlots.find(s => s.id === id);
    if (slot && !slot.bank) {
        setFileSlots(slots => slots.map(s => s.id === id ? { ...s, error: "Please select a bank first." } : s));
    } else {
        fileInputRefs.current[id]?.click();
    }
  };

  const handleDragEnter = (e: React.DragEvent, id: number) => { e.preventDefault(); e.stopPropagation(); setDragOverId(id); };
  const handleDragLeave = (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); setDragOverId(null); };
  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); };
  const handleDrop = (e: React.DragEvent, id: number) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverId(null);
    const targetSlot = fileSlots.find(s => s.id === id);
    if (!targetSlot || !targetSlot.bank) {
      setFileSlots(slots => slots.map(slot => slot.id === id ? { ...slot, error: "Please select a bank before dropping a file." } : slot));
      return;
    }
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      handleFileChange(id, files[0]);
    }
  };

  return (
    <div className="mt-8 flex flex-col items-center justify-center">
      <div className="w-full max-w-3xl p-6 bg-white rounded-lg shadow-lg">
        <div className="text-center mb-6">
          <svg className="mx-auto h-16 w-16 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 16.5V9.75m0 0l-3.75 3.75M12 9.75l3.75 3.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h2 className="text-2xl font-bold mt-4">File Upload</h2>
          <p className="text-gray-500 mt-1">Upload your bank transaction CSV files (max 10).</p>
        </div>
        <div className="space-y-4">
          {fileSlots.map((slot, index) => (
            <div key={slot.id} className="p-4 rounded-lg bg-gray-50 border border-gray-200">
              <div className="flex flex-col">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-semibold text-gray-700"><span className="font-bold text-blue-600 text-lg">{index + 1}</span>. Select Bank</p>
                  {fileSlots.length > 1 && (
                    <button onClick={() => handleRemoveSlot(slot.id)} className="text-red-500 hover:text-red-700 p-1 rounded-full hover:bg-red-100">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    </button>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  {BANKS.map(bank => (
                    <button key={bank.name} onClick={() => handleBankChange(slot.id, bank.name)} className={`px-4 py-2 text-sm font-semibold rounded-full transition-all duration-200 border-2 ${slot.bank === bank.name ? `${bank.color} ${bank.textColor} ring-2 ${bank.selectedColor}` : 'bg-gray-200 text-gray-700 border-transparent hover:bg-gray-300'}`}>
                      {bank.name}
                    </button>
                  ))}
                </div>
              </div>
              <div className={`mt-4 transition-all duration-300 ${slot.bank ? 'opacity-100' : 'opacity-50'}`} onDragEnter={(e) => handleDragEnter(e, slot.id)} onDragLeave={handleDragLeave} onDragOver={handleDragOver} onDrop={(e) => handleDrop(e, slot.id)}>
                <p className="text-sm font-medium text-gray-700 mb-2">Upload File</p>
                {
                  // FIX: The ref callback for a DOM element must not return a value. Using a block body `{...}` ensures an implicit `void` return.
                }
                <input type="file" className="hidden" accept=".csv" ref={el => { fileInputRefs.current[slot.id] = el; }} onChange={(e) => handleFileChange(slot.id, e.target.files?.[0])} disabled={!slot.bank} />
                <div onClick={() => triggerFileSelect(slot.id)} className={`w-full text-center p-6 border-2 border-dashed rounded-md ${slot.bank ? 'cursor-pointer hover:border-blue-500' : 'cursor-not-allowed'} ${dragOverId === slot.id ? 'border-blue-500 bg-blue-100' : 'border-gray-300'}`}>
                  <p className={`truncate text-sm ${slot.file ? 'text-gray-800 font-semibold' : 'text-gray-400'}`}>
                    {slot.file ? slot.file.name : (slot.bank ? 'Click to select or drop file here...' : <span className="font-bold">Please select a bank first.</span>)}
                  </p>
                </div>
                {slot.error && <p className="mt-2 text-sm text-center text-red-600 font-bold animate-pulse">{slot.error}</p>}
              </div>
            </div>
          ))}
        </div>
        <div className="flex justify-between items-center mt-6">
          {fileSlots.length < 10 ? (
            <button onClick={addFileSlot} className="text-sm text-blue-600 hover:underline">+ Add another file</button>
          ) : <div />}
          <button onClick={handleProcessClick} disabled={isLoading} className="bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 disabled:bg-blue-300 font-bold text-lg">
            {isLoading ? 'Processing...' : 'Start Analysis'}
          </button>
        </div>
        {error && <p className="mt-4 text-center text-red-600 bg-red-100 p-3 rounded-md">{error}</p>}
      </div>
    </div>
  );
};

export default FileUpload;