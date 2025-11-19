
import React from 'react';

interface CreditsDepletedModalProps {
  onClose: () => void;
}

const CreditsDepletedModal: React.FC<CreditsDepletedModalProps> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="relative p-8 bg-white rounded-lg shadow-xl w-full max-w-md text-center" onClick={e => e.stopPropagation()}>
        <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-16 w-16 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <h2 className="text-2xl font-bold text-gray-800 mt-5 mb-3">Upload Limit Reached</h2>
        <p className="text-gray-600 mb-6">
          You have run out of credits. To continue using the service, please contact an administrator to top up your account.
        </p>
        <div className="bg-gray-100 p-4 rounded-md">
            <p className="text-sm text-gray-500">Contact for top-up:</p>
            <a href="mailto:info@webpole.co.nz" className="font-semibold text-blue-600 hover:underline">
                info@webpole.co.nz
            </a>
        </div>
        <button 
          onClick={onClose} 
          className="mt-6 w-full bg-blue-600 text-white p-3 rounded-md hover:bg-blue-700 transition duration-300"
        >
          Got it
        </button>
      </div>
    </div>
  );
};

export default CreditsDepletedModal;
