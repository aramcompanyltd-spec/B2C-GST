
import React, { useState, useEffect, useMemo, useCallback } from 'react';
// FIX: Using Firebase v8 compat syntax to resolve module errors.
import firebase from 'firebase/compat/app';
import type { FirebaseUser, ManagedUser, AccountCategory, UploadRecord } from '../types';
import { auth, db, appId } from '../services/firebase';
import type { Transaction, Settings, FileSlot } from '../types';
import { CLASSIFICATION_KEYWORDS, BANK_HEADERS, DEFAULT_ACCOUNT_TABLE } from '../utils/constants';
import { getFieldValue, normalizeDate, calculateGST } from '../utils/helpers';

// Import child components
import Header from './Header';
import FileUpload from './FileUpload';
import SummarySection from './SummarySection';
import TransactionsSection from './TransactionsSection';
import GstReturnSection from './GstReturnSection';
import AdminDashboard from './AdminDashboard';
import SettingsModal from './SettingsModal';
import DeleteConfirmationModal from './DeleteConfirmationModal';
import AdminInfoCard from './AdminInfoCard';
import OnboardingGuide from './OnboardingGuide';
import CreditsDepletedModal from './CreditsDepletedModal';
import AgentDashboard from './AgentDashboard';
import AccountTableModal from './AccountTableModal';
import UploadHistoryModal from './UploadHistoryModal';


interface DashboardProps {
  user: FirebaseUser;
}

const Dashboard: React.FC<DashboardProps> = ({ user }) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isAccountTableOpen, setIsAccountTableOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [transactionToDelete, setTransactionToDelete] = useState<Transaction | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [activeTab, setActiveTab] = useState('calculator');
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showCreditsModal, setShowCreditsModal] = useState(false);
  const [selectedClient, setSelectedClient] = useState<ManagedUser | null>(null);
  const [showNewTaskConfirm, setShowNewTaskConfirm] = useState(false);
  const [showNewClientTaskConfirm, setShowNewClientTaskConfirm] = useState(false);

  useEffect(() => {
    const hasSeenOnboarding = localStorage.getItem('hasSeenOnboarding');
    if (!hasSeenOnboarding) {
      setShowOnboarding(true);
    }
  }, []);

  const fetchSettingsAndAdminStatus = useCallback(async () => {
    if (!user) return;
    const userRef = db.collection('artifacts').doc(appId).collection('users').doc(user.uid);
    const userDocSnap = await userRef.get();

    if (userDocSnap.exists) {
        let data = userDocSnap.data() as Settings;

        // Migration for old users: if accountTable doesn't exist, add the default one.
        if (!data.accountTable || data.accountTable.length === 0) {
            data.accountTable = DEFAULT_ACCOUNT_TABLE;
        }

        setSettings({
            profile: data.profile || { email: user.email!, name: '', address: '', phone: '' },
            mapping: data.mapping || {},
            accountTable: data.accountTable,
            status: data.status,
            credits: data.credits,
            role: data.role || 'user',
            uploadCount: data.uploadCount || 0,
            uploadHistory: data.uploadHistory || [],
        });

        setIsAdmin(data.role === 'admin');
    } else {
        console.warn(`User document for ${user.uid} not found. Creating a default document.`);
        const defaultSettings: Settings = {
            profile: { email: user.email!, name: '', address: '', phone: '' },
            role: 'user',
            status: 'active',
            credits: 30,
            uploadCount: 0,
            mapping: {},
            accountTable: DEFAULT_ACCOUNT_TABLE,
            uploadHistory: [],
        };
        try {
            await userRef.set(defaultSettings);
            setSettings(defaultSettings);
            setIsAdmin(false);
        } catch (e) {
            console.error("Failed to create default user document:", e);
            setError("There was a problem setting up your account. Please contact support.");
        }
    }
  }, [user]);

  useEffect(() => {
    fetchSettingsAndAdminStatus();
  }, [fetchSettingsAndAdminStatus]);

  const activeSettings = useMemo(() => {
    if (selectedClient) {
      const clientTable = selectedClient.accountTable && selectedClient.accountTable.length > 0
        ? selectedClient.accountTable
        : settings?.accountTable; // Use agent's table if client's is missing or empty

      return {
        mapping: selectedClient.mapping,
        accountTable: clientTable || DEFAULT_ACCOUNT_TABLE,
      };
    }
    return settings;
  }, [selectedClient, settings]);


  const dynamicCategories = useMemo(() => {
    if (!activeSettings?.accountTable) return {};
    return activeSettings.accountTable.reduce((acc, cat) => {
      acc[cat.name] = { gstRatio: cat.ratio };
      return acc;
    }, {} as { [key: string]: { gstRatio: number } });
  }, [activeSettings]);

  const sortedCategories = useMemo(() => {
    if (!activeSettings?.accountTable) return [];
    return [...activeSettings.accountTable]
      .sort((a, b) => {
        const codeA = a.code?.trim();
        const codeB = b.code?.trim();

        const aHasCode = !!codeA;
        const bHasCode = !!codeB;

        if (!aHasCode && !bHasCode) return a.name.localeCompare(b.name);
        if (aHasCode && !bHasCode) return -1;
        if (!aHasCode && bHasCode) return 1;

        // Both have codes, proceed with comparison
        const isNumA = /^\d+$/.test(codeA!);
        const isNumB = /^\d+$/.test(codeB!);

        // If both are purely numeric, compare as numbers
        if (isNumA && isNumB) {
            return parseInt(codeA!, 10) - parseInt(codeB!, 10);
        }

        // Use localeCompare for alphanumeric or mixed cases.
        // This will correctly sort "Item 2" before "Item 10".
        return codeA!.localeCompare(codeB!, undefined, { numeric: true });
      })
      .map(cat => cat.name);
  }, [activeSettings]);

  const saveSettings = useCallback(async (newSettings: Partial<Settings | ManagedUser>) => {
    if (!user) return;

    if (selectedClient) {
      const updatedClient = { ...selectedClient, ...newSettings };
      setSelectedClient(updatedClient as ManagedUser);
      const clientRef = db.collection('artifacts').doc(appId).collection('users').doc(user.uid).collection('managedUsers').doc(selectedClient.id);
      await clientRef.set(newSettings, { merge: true });
    } else {
      setSettings(prev => prev ? { ...prev, ...newSettings } as Settings : null);
      const userRef = db.collection('artifacts').doc(appId).collection('users').doc(user.uid);
      await userRef.set(newSettings, { merge: true });
    }
    
    setIsSettingsOpen(false);
  }, [user, selectedClient]);
  
  const classifyTransaction = useCallback((tx: Omit<Transaction, 'category'>, userMapping: { [key: string]: string }) => {
    const desc = `${tx.Payee || ''} ${tx.Description || ''}`.toUpperCase();
    const payeeUpper = (tx.Payee || '').toUpperCase();

    if (userMapping[payeeUpper]) return userMapping[payeeUpper];

    if (tx.Amount > 0) {
      if ((CLASSIFICATION_KEYWORDS['Sales - Zero Rated'] || []).some(kw => desc.includes(kw))) {
        return 'Sales - Zero Rated';
      }
      return 'Sales'; // Default for income
    }

    for (const [category, keywords] of Object.entries(CLASSIFICATION_KEYWORDS)) {
      if (category === 'Sales - Zero Rated') continue;
      if (keywords.some(kw => desc.includes(kw))) return category;
    }
    return 'Uncategorized';
  }, []);

  const handleProcessFiles = (filesToProcess: FileSlot[]) => {
    if (!isAdmin && settings?.credits !== undefined && settings.credits <= 0) {
      setShowCreditsModal(true);
      return;
    }
      
    setIsLoading(true);
    setError('');
    let processedCount = 0;
    const allTransactions: Omit<Transaction, 'category'>[] = [];
    const totalFiles = filesToProcess.length;

    filesToProcess.forEach(({ file, bank }) => {
      if (!file || !bank) return;
      
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
            const data = e.target?.result;
            let rows: any[];
            
            const bankConfig = BANK_HEADERS[bank];

            const findHeaderRowIndex = (rowData: string[][]): number => {
                const commonDateHeaders = ['date', 'transaction date'];
                const commonAmountHeaders = ['amount', bankConfig.amountField.toLowerCase()];
                const descriptionHeaders = bankConfig.descriptionFields.map(f => f.toLowerCase());
                
                return rowData.findIndex(row => {
                    const lowerCaseRow = row.map(cell => String(cell || '').toLowerCase().trim());
                    const hasDate = lowerCaseRow.some(cell => commonDateHeaders.includes(cell));
                    const hasAmount = lowerCaseRow.some(cell => commonAmountHeaders.includes(cell));
                    const hasDescription = descriptionHeaders.some(h => lowerCaseRow.includes(h));
                    return hasDate && (hasAmount || hasDescription);
                });
            };

            if (file.name.endsWith('.csv')) {
                const rawParsed = (window as any).Papa.parse(data, { skipEmptyLines: true });
                const rawData: string[][] = rawParsed.data;
                const headerRowIndex = findHeaderRowIndex(rawData);

                if (headerRowIndex === -1) {
                    throw new Error(`Could not find a valid transaction header row. Please ensure the file contains columns like 'Date' and '${bankConfig.amountField}'.`);
                }
                
                const header = rawData[headerRowIndex].map(h => h.trim());
                const dataRows = rawData.slice(headerRowIndex + 1);

                rows = dataRows.map(rowArray => {
                    const rowObject: { [key: string]: any } = {};
                    header.forEach((headerName, index) => {
                        if (headerName) {
                            rowObject[headerName] = rowArray[index];
                        }
                    });
                    return rowObject;
                });
            } else {
                throw new Error(`Unsupported file type: ${file.name}. Please upload a CSV file.`);
            }

            const parsedData = rows.map((row, index) => {
            const amountStr = String(getFieldValue(row, [bankConfig.amountField, 'Amount']) || '0').replace(/,/g, '');
            const amount = parseFloat(amountStr);

            if (isNaN(amount) || amount === 0) return null;
            
            return {
              id: `${file.name}-${index}`,
              Date: normalizeDate(getFieldValue(row, ['Date', 'Transaction Date'])),
              Payee: getFieldValue(row, bankConfig.descriptionFields),
              Description: getFieldValue(row, ['Memo', 'Particulars', 'Details']),
              Amount: amount
            };
          }).filter(Boolean) as Omit<Transaction, 'category'>[];

          allTransactions.push(...parsedData);
        } catch (err: any) {
            console.error("File processing error:", err);
            setError(`Error processing file ${file.name}: ${err.message}`);
        }

        processedCount++;
        if (processedCount === totalFiles) {
          if (activeSettings && user && settings) {
            const classified = allTransactions.map(tx => ({
              ...tx,
              category: classifyTransaction(tx, activeSettings.mapping)
            }));
            
            setTransactions(prev => 
                [...prev, ...classified].filter((v,i,a)=>a.findIndex(t=>(t.id === v.id))===i)
            );

            // Credits and upload count are always tied to the logged-in user (agent or user).
            // Use a Firestore transaction for this read-modify-write operation to prevent race conditions
            // and ensure updates are based on the latest server data, which avoids security rule violations.
            const userRef = db.collection('artifacts').doc(appId).collection('users').doc(user.uid);
            db.runTransaction(async (transaction) => {
              const userDoc = await transaction.get(userRef);
              if (!userDoc.exists) {
                throw new Error("User document not found. Cannot update stats.");
              }

              const userData = userDoc.data() as Settings;
              const newUploadCount = (userData.uploadCount || 0) + 1;
              const currentCredits = userData.credits ?? 0;
              const newCreditCount = !isAdmin ? Math.max(0, currentCredits - 1) : currentCredits;
              
              // Store history in the user document array instead of subcollection to avoid permission issues
              const currentHistory = (userData.uploadHistory || []) as UploadRecord[];
              const newRecord: UploadRecord = {
                  id: crypto.randomUUID(),
                  timestamp: new Date().toISOString(),
                  fileNames: filesToProcess.map(f => f.file?.name || 'Unknown').filter(Boolean),
                  bank: filesToProcess.map(f => f.bank || '?').join(', '),
                  totalTransactions: allTransactions.length,
              };
              
              // Prepend new record
              const updatedHistory = [newRecord, ...currentHistory];

              transaction.update(userRef, {
                uploadCount: newUploadCount,
                credits: newCreditCount,
                uploadHistory: updatedHistory
              });

              return { newUploadCount, newCreditCount, updatedHistory };
            })
            .then((res) => {
              if (res) {
                // Update local state only after the transaction is successfully committed.
                setSettings(s => s ? { 
                    ...s, 
                    uploadCount: res.newUploadCount, 
                    credits: res.newCreditCount,
                    uploadHistory: res.updatedHistory
                } : null);
              }
            })
            .catch(err => {
              console.error("Failed to update user stats:", err);
              setError("Failed to save usage data. Please refresh and check your credits.");
            });
          }
          setIsLoading(false);
        }
      };
      reader.onerror = () => {
          setError(`Error reading file ${file.name}.`);
          processedCount++;
          if(processedCount === totalFiles) setIsLoading(false);
      }
      reader.readAsBinaryString(file);
    });
  };

  const handleConfirmDelete = () => {
    if (!transactionToDelete) return;
    setTransactions(current => current.filter(t => t.id !== transactionToDelete.id));
    setTransactionToDelete(null);
  };
  
  const updateTransaction = useCallback(async (id: string, updatedTx: Transaction) => {
    const originalTx = transactions.find(tx => tx.id === id);
    const newTransactions = transactions.map(tx => (tx.id === id ? updatedTx : tx));
    setTransactions(newTransactions);

    if (activeSettings && originalTx && originalTx.category !== updatedTx.category) {
      const newMapping = { ...activeSettings.mapping, [updatedTx.Payee.toUpperCase()]: updatedTx.category };
      await saveSettings({ mapping: newMapping });
    }
  }, [transactions, activeSettings, saveSettings]);

  const processedData = useMemo(() => {
    if (!activeSettings) return [];
    return transactions.map(tx => {
      const catInfo = dynamicCategories[tx.category];
      const accountCategory = activeSettings.accountTable.find(cat => cat.name === tx.category);
      const ratio = catInfo ? catInfo.gstRatio : 0;
      
      const gstAmount = calculateGST(tx.Amount, ratio);
      return { ...tx, gstRatio: ratio, gstAmount, code: accountCategory?.code || '' };
    });
  }, [transactions, activeSettings, dynamicCategories]);

  const handleNewTask = () => {
    setTransactions([]);
    if(settings?.role === 'agent') {
      setSelectedClient(null);
    }
  };

  const requestNewTask = () => {
    if (transactions.length > 0) {
      setShowNewTaskConfirm(true);
    } else {
      handleNewTask();
    }
  };

  const startNewClientTask = () => {
    setTransactions([]);
    setError('');
  };

  const requestNewClientTask = () => {
    if (transactions.length > 0) {
      setShowNewClientTaskConfirm(true);
    } else {
      startNewClientTask();
    }
  };

  const handleDismissOnboarding = () => {
    setShowOnboarding(false);
    localStorage.setItem('hasSeenOnboarding', 'true');
  };

  const handleClientSelect = (client: ManagedUser) => {
    setSelectedClient(client);
    setTransactions([]);
    setError('');
  };

  if (!settings || !activeSettings) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-gray-100">
        <div className="flex items-center space-x-2">
          <svg className="animate-spin h-5 w-5 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p>Loading settings...</p>
        </div>
      </div>
    );
  }

  // Agent View: Client List
  if (settings.role === 'agent' && !selectedClient) {
    return (
      <div className="p-4 md:p-8 max-w-7xl mx-auto">
        <Header user={user} settings={settings} onSettingsClick={() => setIsSettingsOpen(true)} onAccountTableClick={() => setIsAccountTableOpen(true)} onHistoryClick={() => setIsHistoryOpen(true)} onNewTask={handleNewTask} showNewTaskButton={false} />
        <AgentDashboard user={user} onClientSelect={handleClientSelect} settings={settings} />

        {isSettingsOpen && (
          <SettingsModal
            user={user}
            settings={settings}
            onSave={saveSettings}
            onClose={() => setIsSettingsOpen(false)}
          />
        )}
        
        {isAccountTableOpen && (
          <AccountTableModal
            initialTable={activeSettings.accountTable as AccountCategory[]}
            onSave={(newTable) => saveSettings({ accountTable: newTable })}
            onClose={() => setIsAccountTableOpen(false)}
          />
        )}
         {isHistoryOpen && (
          <UploadHistoryModal 
            history={settings.uploadHistory || []} 
            onClose={() => setIsHistoryOpen(false)} 
          />
        )}
      </div>
    )
  }
  
  const clientName = selectedClient?.companyName || settings?.profile?.name || user.email || 'user';
  const showNewClientTaskButton = settings.role === 'agent' && !!selectedClient && transactions.length > 0;

  // Main Calculator / Admin View
  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto">
      <Header 
        user={user} 
        settings={settings} 
        onSettingsClick={() => setIsSettingsOpen(true)}
        onAccountTableClick={() => setIsAccountTableOpen(true)}
        onHistoryClick={() => setIsHistoryOpen(true)}
        onNewTask={requestNewTask} 
        onNewClientTask={requestNewClientTask}
        showNewTaskButton={transactions.length > 0 || !!selectedClient}
        showNewClientTaskButton={showNewClientTaskButton}
        isAgentView={settings.role === 'agent'}
        clientName={selectedClient?.companyName}
      />

      {isAdmin && (
        <div className="mb-6 border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button onClick={() => setActiveTab('calculator')} className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'calculator' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>
              GST Calculator
            </button>
            <button onClick={() => setActiveTab('admin')} className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'admin' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>
              User Management
            </button>
          </nav>
        </div>
      )}

      <main>
        {activeTab === 'calculator' && (
          !transactions.length ? (
            <>
              {isAdmin && !selectedClient && <AdminInfoCard settings={settings} onEditClick={() => setIsSettingsOpen(true)} />}
              {showOnboarding && !selectedClient && <OnboardingGuide onDismiss={handleDismissOnboarding} />}
              <FileUpload onProcess={handleProcessFiles} isLoading={isLoading} error={error} />
            </>
          ) : (
            <div className="space-y-8 mt-6">
              <SummarySection data={processedData} accountTable={activeSettings.accountTable as AccountCategory[]} clientName={clientName} />
              <TransactionsSection 
                data={processedData}
                categories={sortedCategories}
                updateTransaction={updateTransaction}
                setTransactions={setTransactions}
                saveSettings={saveSettings}
                settings={{...activeSettings} as Settings}
                requestDelete={setTransactionToDelete}
                clientName={clientName}
              />
              <GstReturnSection data={processedData} />
            </div>
          )
        )}
        {activeTab === 'admin' && isAdmin && <AdminDashboard />}
      </main>

      {isSettingsOpen && (
        <SettingsModal
          user={user}
          settings={settings}
          onSave={saveSettings}
          onClose={() => setIsSettingsOpen(false)}
        />
      )}
      
      {isAccountTableOpen && (
        <AccountTableModal
          initialTable={activeSettings.accountTable as AccountCategory[]}
          onSave={(newTable) => saveSettings({ accountTable: newTable })}
          onClose={() => setIsAccountTableOpen(false)}
          agentDefaultTable={settings.role === 'agent' && selectedClient ? settings.accountTable : undefined}
        />
      )}

       {isHistoryOpen && (
          <UploadHistoryModal 
            history={settings.uploadHistory || []} 
            onClose={() => setIsHistoryOpen(false)} 
          />
        )}

      {showCreditsModal && (
        <CreditsDepletedModal onClose={() => setShowCreditsModal(false)} />
      )}

      {transactionToDelete && (
        <DeleteConfirmationModal
          title="Confirm Deletion"
          message={`Are you sure you want to delete this transaction? This action cannot be undone.`}
          onConfirm={handleConfirmDelete}
          onCancel={() => setTransactionToDelete(null)}
        />
      )}

      {showNewTaskConfirm && (
        <DeleteConfirmationModal
          title={settings.role === 'agent' ? "Back to Client List?" : "Start a New Task?"}
          message="Are you sure? The current transaction data will be cleared. This action cannot be undone and may affect your credit balance."
          onConfirm={() => {
            handleNewTask();
            setShowNewTaskConfirm(false);
          }}
          onCancel={() => setShowNewTaskConfirm(false)}
          confirmText={settings.role === 'agent' ? "Yes, Go Back" : "Yes, Start New"}
          confirmColor="bg-green-600 hover:bg-green-700"
        />
      )}

      {showNewClientTaskConfirm && (
        <DeleteConfirmationModal
          title="Start a New Task?"
          message="Are you sure? The current transaction data will be cleared. This action cannot be undone and may affect your credit balance."
          onConfirm={() => {
            startNewClientTask();
            setShowNewClientTaskConfirm(false);
          }}
          onCancel={() => setShowNewClientTaskConfirm(false)}
          confirmText="Yes, Start New"
          confirmColor="bg-blue-600 hover:bg-blue-700"
        />
      )}
    </div>
  );
};

export default Dashboard;
