
import React, { useState, useEffect } from 'react';
// FIX: Firebase imports are no longer needed here as they are handled by the compat service.
import { auth, db, appId } from '../services/firebase';
import { DEFAULT_ACCOUNT_TABLE } from '../utils/constants';

interface AuthScreenProps {
  initialIsLogin: boolean;
  onClose?: () => void;
}


const AuthScreen: React.FC<AuthScreenProps> = ({ initialIsLogin, onClose }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isLogin, setIsLogin] = useState(initialIsLogin);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [rememberMe, setRememberMe] = useState(true);

  // Determine if running as a modal or standalone page based on presence of onClose prop
  const isModal = !!onClose;

  useEffect(() => {
    setIsLogin(initialIsLogin);
  }, [initialIsLogin]);


  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    try {
        // Set persistence based on checkbox
        await auth.setPersistence(rememberMe ? 'local' : 'session');

      if (isLogin) {
        // FIX: Use v8 compat signInWithEmailAndPassword method.
        // The onAuthStateChanged listener in App.tsx will handle redirection and status checks.
        await auth.signInWithEmailAndPassword(email, password);
      } else {
        // FIX: Use v8 compat createUserWithEmailAndPassword method
        const userCredential = await auth.createUserWithEmailAndPassword(email, password);
        const user = userCredential.user;
        
        // FIX: Ensure user object and UID are present before creating Firestore doc to prevent race conditions.
        if (user && user.uid) {
          const userRef = db.collection('artifacts').doc(appId).collection('users').doc(user.uid);
          await userRef.set({
            profile: {
              email: user.email || '',
              name: name,
              address: '',
              phone: ''
            },
            role: 'user',
            status: 'active',
            credits: 1000, // Default credits for new users (Changed to 1000)
            uploadCount: 0, // Initialize upload count
            uploadHistory: [], // Initialize upload history
            mapping: {},
            accountTable: DEFAULT_ACCOUNT_TABLE,
          });
        } else {
          throw new Error("Firebase authentication succeeded, but the user object was not returned correctly. Please try again.");
        }
      }
      // On success, onAuthStateChanged in App.tsx will handle the redirect to dashboard.
      // We don't need to explicitly close the modal here as the parent page will be unmounted.
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handlePasswordReset = async () => {
    if (!email) {
        setError('Please enter your email to reset the password.');
        return;
    }
    setError('');
    setMessage('');
    try {
        // FIX: Use v8 compat sendPasswordResetEmail method
        await auth.sendPasswordResetEmail(email);
        setMessage('Password reset email sent. Please check your inbox.');
    } catch (err: any) {
        setError(err.message);
    }
  };

  return (
    <div 
      className={isModal ? "fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4" : "flex items-center justify-center min-h-[calc(100vh-2rem)] w-full p-4"} 
      onClick={isModal ? onClose : undefined}
    >
      <div className="relative p-8 bg-white rounded-lg shadow-xl w-full max-w-md" onClick={e => e.stopPropagation()}>
         {isModal && (
            <button onClick={onClose} aria-label="Close authentication form" className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 p-1 rounded-full">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
            </button>
         )}

        {/* App Branding & Description */}
        <div className="text-center mb-8 border-b border-gray-100 pb-6">
            <img 
              src="/logo.png" 
              alt="NZ GST Simple" 
              className="mx-auto h-20 w-auto mb-4 object-contain"
              onError={(e) => {
                // Fallback if image fails
                e.currentTarget.style.display = 'none';
                e.currentTarget.nextElementSibling?.classList.remove('hidden');
              }}
            />
            {/* Fallback text title if image is missing */}
            <h1 className="hidden text-3xl font-extrabold tracking-tight text-gray-900 mb-2">
                NZ GST <span className="text-blue-600">Simple</span>
            </h1>
            <p className="text-gray-500 text-sm">
            Automated bank transaction categorization and instant GST calculation for New Zealand businesses.
            </p>
        </div>

        <h2 className="text-xl font-bold text-center text-gray-800 mb-6">
          {isLogin ? 'Sign in to your account' : 'Create your account'}
        </h2>
        {error && <p className="text-red-500 text-sm mb-4 text-center">{error}</p>}
        {message && <p className="text-green-500 text-sm mb-4 text-center">{message}</p>}
        <form onSubmit={handleAuth}>
          {!isLogin && (
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Name / Company Name"
              className="w-full p-3 mb-4 bg-white border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          )}
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            className="w-full p-3 mb-4 bg-white border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            className="w-full p-3 mb-4 bg-white border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
          
          {isLogin && (
              <div className="flex items-center mb-4">
                  <input 
                    type="checkbox" 
                    id="rememberMe" 
                    checked={rememberMe} 
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="rememberMe" className="ml-2 block text-sm text-gray-900">
                      Remember me
                  </label>
              </div>
          )}

          <button type="submit" className="w-full bg-blue-600 text-white p-3 rounded-md hover:bg-blue-700 transition duration-300 font-semibold">
            {isLogin ? 'Sign In' : 'Sign Up'}
          </button>
        </form>
        <div className="text-center mt-4">
            <button onClick={() => setIsLogin(!isLogin)} className="w-full text-sm text-blue-600 hover:underline">
            {isLogin ? "Don't have an account? Sign Up" : 'Already have an account? Sign In'}
            </button>
            {isLogin && (
                <button onClick={handlePasswordReset} className="w-full text-sm text-gray-500 hover:underline mt-2">
                    Forgot Password?
                </button>
            )}
        </div>
      </div>
    </div>
  );
};

export default AuthScreen;
