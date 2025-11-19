
import React from 'react';
import type { Settings } from '../types';

interface AdminInfoCardProps {
  settings: Settings;
  onEditClick: () => void;
}

// FIX: Replaced JSX.Element with React.ReactNode to resolve "Cannot find namespace 'JSX'" error.
const InfoRow: React.FC<{ icon: React.ReactNode; label: string; value: string | number | undefined }> = ({ icon, label, value }) => (
  <div className="flex items-start text-sm">
    <div className="flex-shrink-0 w-5 h-5 text-gray-400 mr-3 mt-0.5">{icon}</div>
    <div>
      <p className="font-semibold text-gray-800">{label}</p>
      <p className="text-gray-600">{value || 'Not set'}</p>
    </div>
  </div>
);

const AdminInfoCard: React.FC<AdminInfoCardProps> = ({ settings, onEditClick }) => {
  const { profile } = settings;

  return (
    <div className="mb-8 p-6 bg-white rounded-2xl shadow-lg border border-gray-200">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-gray-800">Admin Information</h2>
        <button 
          onClick={onEditClick}
          className="text-sm font-medium text-blue-600 hover:text-blue-800 flex items-center"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.5L15.232 5.232z" />
          </svg>
          Edit Profile
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-4">
        <InfoRow 
          label="Name" 
          value={profile.name}
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
            </svg>
          } 
        />
        <InfoRow 
          label="Email Address" 
          value={profile.email}
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
              <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
            </svg>
          } 
        />
        <InfoRow 
          label="Address" 
          value={profile.address}
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
            </svg>
          }
        />
        <InfoRow 
          label="Phone Number" 
          value={profile.phone}
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
            </svg>
          }
        />
        <InfoRow 
            label="Total Uploads"
            value={settings.uploadCount ?? 0}
            icon={
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6.293 6.707a1 1 0 010-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L11 5.414V13a1 1 0 11-2 0V5.414L7.707 6.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
            }
        />
        <InfoRow 
            label="Usage Credits"
            value={settings.credits ?? 0}
            icon={
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M8.433 7.418c.158-.103.346-.196.567-.267v1.698a2.5 2.5 0 00-1.168-.217c-1.22-.04-2.5.97-2.5 2.366 0 1.253 1.116 2.166 2.243 2.166 1.026 0 1.787-.723 1.787-1.633 0-.501-.246-.917-.757-1.248-.593-.38-1.543-.848-1.543-1.536 0-.57.462-1.013 1.08-1.013.388 0 .736.16.98.403z" />
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm0 2a10 10 0 100-20 10 10 0 000 20z" clipRule="evenodd" />
                </svg>
            }
        />
      </div>
    </div>
  );
};

export default AdminInfoCard;