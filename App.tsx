
import React, { useState, useEffect } from 'react';
// FIX: Using Firebase v8 compat syntax to resolve module errors.
import type { FirebaseUser } from './types';
import { auth, db, appId } from './services/firebase';
import AuthScreen from './components/AuthScreen';
import Dashboard from './components/Dashboard';

// Suspended view component defined within App.tsx to avoid creating new files.
const SuspendedAccountView: React.FC<{ onReturnHome: () => void; }> = ({ onReturnHome }) => {
    return (
        <div className="fixed inset-0 bg-gray-100 z-50 flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-lg text-center bg-white p-10 rounded-xl shadow-2xl">
                <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-20 w-20 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <h2 className="text-3xl font-bold text-gray-800 mt-6 mb-3">Account Suspended</h2>
                <p className="text-gray-600 mb-8 text-lg">
                    Your access to this service has been suspended.
                    <br />
                    Please contact support to request reactivation.
                </p>
                <a href="mailto:info@livingkorea.co.nz?subject=account%20activate%20request" className="inline-block w-full bg-blue-600 text-white px-6 py-4 rounded-lg hover:bg-blue-700 transition duration-300 font-semibold text-lg shadow-md">
                    Contact Support
                </a>
                <p className="mt-4 text-sm text-gray-500">
                    Or call: <a href="tel:0226785500" className="font-semibold text-gray-700 hover:underline">022-678-5500</a>
                </p>
                <button 
                    onClick={onReturnHome}
                    className="mt-6 text-sm text-gray-500 hover:underline"
                >
                    Return to Homepage
                </button>
            </div>
        </div>
    );
};


type AuthStatus = 'loading' | 'unauthenticated' | 'authenticated' | 'suspended';

export default function App() {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [authStatus, setAuthStatus] = useState<AuthStatus>('loading');

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (currentUser) => {
      if (currentUser) {
        try {
          const userRef = db.collection('artifacts').doc(appId).collection('users').doc(currentUser.uid);
          const userDoc = await userRef.get();

          if (userDoc.exists && userDoc.data()?.status === 'suspended') {
            await auth.signOut(); // This will re-trigger onAuthStateChanged with null
            setAuthStatus('suspended');
            setUser(null);
          } else {
            setUser(currentUser);
            setAuthStatus('authenticated');
          }
        } catch (error) {
          console.error("Error checking user status:", error);
          await auth.signOut();
          setAuthStatus('unauthenticated');
          setUser(null);
        }
      } else {
        if (authStatus !== 'suspended') {
          setUser(null);
          setAuthStatus('unauthenticated');
        }
      }
    });

    return () => unsubscribe();
  }, [authStatus]);

  if (authStatus === 'loading') {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-gray-100">
        <div className="flex items-center space-x-2">
          <svg className="animate-spin h-5 w-5 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p>Loading Application...</p>
        </div>
      </div>
    );
  }
  
  if (authStatus === 'suspended') {
    return <SuspendedAccountView onReturnHome={() => setAuthStatus('unauthenticated')} />;
  }

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-800">
      {user && authStatus === 'authenticated' ? <Dashboard user={user} /> : <AuthScreen initialIsLogin={true} />}
    </div>
  );
}
