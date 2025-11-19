
import React from 'react';

interface OnboardingGuideProps {
    onDismiss: () => void;
}

const OnboardingGuide: React.FC<OnboardingGuideProps> = ({ onDismiss }) => {
    return (
        <div className="relative mb-8 p-6 bg-blue-50 border border-blue-200 rounded-2xl shadow-sm text-gray-800">
            <button
                onClick={onDismiss}
                aria-label="Dismiss guide"
                className="absolute top-3 right-3 text-blue-400 hover:text-blue-600 p-1 rounded-full hover:bg-blue-100 transition-colors"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
            </button>
            <div className="flex items-center mb-4">
                <div className="flex-shrink-0 bg-blue-500 text-white rounded-full h-10 w-10 flex items-center justify-center mr-4">
                   <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                </div>
                <h2 className="text-xl font-bold text-blue-800">How to Get Started</h2>
            </div>
            <div className="grid md:grid-cols-3 gap-6 text-center">
                <div className="flex flex-col items-center">
                    <p className="text-4xl font-bold text-blue-300 mb-2">1</p>
                    <h3 className="font-semibold mb-1">Upload Files</h3>
                    <p className="text-sm text-gray-600">Select a bank and upload your transaction CSV or XLSX file.</p>
                </div>
                 <div className="flex flex-col items-center">
                    <p className="text-4xl font-bold text-blue-300 mb-2">2</p>
                    <h3 className="font-semibold mb-1">Review Transactions</h3>
                    <p className="text-sm text-gray-600">We'll automatically categorize everything. Edit any transaction as needed.</p>
                </div>
                 <div className="flex flex-col items-center">
                    <p className="text-4xl font-bold text-blue-300 mb-2">3</p>
                    <h3 className="font-semibold mb-1">Get Your Summary</h3>
                    <p className="text-sm text-gray-600">Your final GST return summary is generated instantly. It's that simple!</p>
                </div>
            </div>
        </div>
    );
};

export default OnboardingGuide;
