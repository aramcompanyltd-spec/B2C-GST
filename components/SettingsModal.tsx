import React, { useState } from 'react';
// FIX: Using Firebase v8 compat syntax to resolve module errors.
import { auth } from '../services/firebase';
import type { Settings, FirebaseUser } from '../types';

interface SettingsModalProps {
    user: FirebaseUser;
    settings: Settings;
    onSave: (newSettings: Partial<Settings>) => void;
    onClose: () => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ user, settings, onSave, onClose }) => {
    const [localSettings, setLocalSettings] = useState<Settings>(JSON.parse(JSON.stringify(settings)));
    const [resetFeedback, setResetFeedback] = useState('');

    const handleProfileChange = (field: string, value: string) => {
        setLocalSettings(prev => ({ ...prev, profile: { ...prev.profile, [field]: value } }));
    };
    
    const handleSave = () => onSave({ profile: localSettings.profile });

    const handlePasswordReset = async () => {
        if (!user || !user.email) {
            setResetFeedback("Email information not found.");
            return;
        }
        try {
            // FIX: Use v8 compat sendPasswordResetEmail method
            await auth.sendPasswordResetEmail(user.email);
            setResetFeedback("Password reset email sent. Please check your inbox.");
        } catch (error: any) {
            // FIX: Correctly reference the error object from the catch block to resolve scope issues.
            setResetFeedback(`Error: ${error.message}`);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-lg overflow-hidden">
                <h2 className="text-2xl font-bold mb-6">Profile Settings</h2>
                
                <div className="space-y-6 max-h-[60vh] overflow-y-auto pr-4">
                    <div className="space-y-4">
                         <div><label className="block text-sm font-medium text-gray-700">Email</label><input type="email" value={localSettings.profile?.email || ''} disabled className="mt-1 block w-full p-2 border rounded-md bg-gray-100" /></div>
                         <div><label className="block text-sm font-medium text-gray-700">Name</label><input type="text" value={localSettings.profile?.name || ''} onChange={e => handleProfileChange('name', e.target.value)} className="mt-1 block w-full p-2 bg-white border rounded-md" /></div>
                         <div><label className="block text-sm font-medium text-gray-700">Address</label><input type="text" value={localSettings.profile?.address || ''} onChange={e => handleProfileChange('address', e.target.value)} className="mt-1 block w-full p-2 bg-white border rounded-md" /></div>
                         <div><label className="block text-sm font-medium text-gray-700">Phone</label><input type="tel" value={localSettings.profile?.phone || ''} onChange={e => handleProfileChange('phone', e.target.value)} className="mt-1 block w-full p-2 bg-white border rounded-md" /></div>
                         <div className="border-t pt-4"><h3 className="font-semibold mb-2">Password</h3><button onClick={handlePasswordReset} className="text-sm text-blue-600 hover:underline">Send Password Reset Email</button>{resetFeedback && <p className="text-sm text-green-600 mt-2">{resetFeedback}</p>}</div>
                    </div>
                </div>
                <div className="mt-8 flex justify-end space-x-4">
                    <button onClick={onClose} className="px-4 py-2 bg-gray-200 rounded-md hover:bg-gray-300">Cancel</button>
                    <button onClick={handleSave} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">Save</button>
                </div>
            </div>
        </div>
    );
};

export default SettingsModal;
