
import React from 'react';
// FIX: Using Firebase v8 compat syntax to resolve module errors.
import type { FirebaseUser, Settings } from '../types';
import { auth } from '../services/firebase';

interface HeaderProps {
  user: FirebaseUser;
  settings: Settings;
  onSettingsClick: () => void;
  onAccountTableClick: () => void;
  onHistoryClick: () => void;
  onNewTask: () => void;
  onNewClientTask?: () => void;
  showNewTaskButton: boolean;
  showNewClientTaskButton?: boolean;
  isAgentView?: boolean;
  clientName?: string;
}

const Header: React.FC<HeaderProps> = ({ user, settings, onSettingsClick, onAccountTableClick, onHistoryClick, onNewTask, onNewClientTask, showNewTaskButton, showNewClientTaskButton, isAgentView, clientName }) => {
  const greeting = clientName ? `Client: ${clientName}` : `Welcome, ${user.email || 'Guest'}`;

  return (
    <header className="flex justify-between items-center pb-4 border-b border-gray-200">
      <div>
        <img 
          src="/logo.png" 
          alt="NZ GST Simple" 
          className="h-10 w-auto mb-2 object-contain"
          onError={(e) => {
            // Fallback if image fails
            e.currentTarget.style.display = 'none';
            e.currentTarget.nextElementSibling?.classList.remove('hidden');
          }}
        />
        <h1 className="hidden text-2xl font-extrabold tracking-tight text-gray-900">
          NZ GST <span className="text-blue-600">Simple</span>
        </h1>
        <div className="flex items-center space-x-4 text-sm text-gray-500 mt-1">
          <span>{greeting}</span>
          <span className="h-4 border-l border-gray-300"></span>
          <span>Credits: <strong>{settings.credits ?? 0}</strong></span>
          <span className="h-4 border-l border-gray-300"></span>
          <span>Uploads: <strong>{settings.uploadCount ?? 0}</strong></span>
        </div>
      </div>
      <div className="flex items-center space-x-4">
        {showNewClientTaskButton && onNewClientTask && (
            <button onClick={onNewClientTask} className="text-sm bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">
                New Task
            </button>
        )}
        {showNewTaskButton && (
          <button onClick={onNewTask} className="text-sm bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600">
            {isAgentView ? 'Back to Client List' : 'New Task'}
          </button>
        )}
        <button onClick={onAccountTableClick} className="text-sm bg-gray-200 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-300 font-medium">
            Account table
        </button>
        <button onClick={onHistoryClick} className="text-sm bg-gray-200 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-300 font-medium">
          History
        </button>
        <button onClick={onSettingsClick} className="text-sm bg-gray-200 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-300 font-medium">
          Settings
        </button>
        {/* FIX: Use v8 compat signOut method */}
        <button onClick={() => auth.signOut()} className="bg-red-500 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-red-600">
          Logout
        </button>
      </div>
    </header>
  );
};

export default Header;