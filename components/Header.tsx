
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
        <h1 className="text-2xl font-extrabold tracking-tight text-gray-900">
          NZ GST <span className="text-blue-600">Simple</span>
        </h1>
        <div className="flex items-center space-x-4 text-sm text-gray-500 mt-1">
          <span>{greeting}</span>
          <span className="h-4 border-l border-gray-300"></span>
          <span>Uploads: <strong>{settings.uploadCount ?? 0}</strong></span>
          <span className="h-4 border-l border-gray-300"></span>
          <div className="flex items-center space-x-1">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-yellow-500" viewBox="0 0 20 20" fill="currentColor"><path d="M8.433 7.418c.158-.103.346-.196.567-.267v1.698a2.5 2.5 0 00-1.168-.217c-1.22-.04-2.5.97-2.5 2.366 0 1.253 1.116 2.166 2.243 2.166 1.026 0 1.787-.723 1.787-1.633 0-.501-.246-.917-.757-1.248-.593-.38-1.543-.848-1.543-1.536 0-.57.462-1.013 1.08-1.013.388 0 .736.16.98.403z" /><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm0 2a10 10 0 100-20 10 10 0 000 20z" clipRule="evenodd" /></svg>
            <span>Credits: {
              settings.role === 'admin'
              ? <strong className="text-blue-600 font-semibold">Unlimited</strong>
              : <strong className={settings.credits !== undefined && settings.credits <= 5 ? 'text-red-500 animate-pulse' : 'text-gray-800'}>{settings.credits ?? 0}</strong>
            }</span>
          </div>
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
        {settings.role !== 'user' && (
            <button onClick={onAccountTableClick} className="text-sm bg-gray-200 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-300 font-medium">
                Account table
            </button>
        )}
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
