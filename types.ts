
// FIX: Using Firebase v8 compat syntax to resolve module errors.
import type firebase from 'firebase/compat/app';

export type FirebaseUser = firebase.User;

export interface Transaction {
  id: string;
  Date: string;
  Payee: string;
  Description: string;
  Amount: number;
  category: string;
  gstRatio?: number;
  gstAmount?: number;
  code?: string;
}

export interface AccountCategory {
  id: string;
  name: string;
  ratio: number; // Stored as a float, e.g., 0.15 for 15%
  code: string;
  isDeletable: boolean; // Core categories might not be deletable
}

export interface UploadRecord {
    id: string;
    timestamp: any; // Can be Firestore Timestamp or ISO string
    fileNames: string[];
    bank: string;
    totalTransactions: number;
}

export interface Settings {
  profile: {
    email: string;
    name: string;
    address: string;
    phone: string;
  };
  mapping: { [key: string]: string };
  accountTable: AccountCategory[];
  status?: string;
  credits?: number;
  role?: 'user' | 'admin' | 'agent';
  uploadCount?: number;
  uploadHistory?: UploadRecord[];
}

export interface ManagedUser {
  id: string;
  companyName: string;
  irdNumber: string;
  mapping: { [key: string]: string };
  accountTable: AccountCategory[];
}


export interface BankConfig {
  identifiers: string[];
  descriptionFields: string[];
  dateFormat: string;
  amountField: string;
}

export interface Bank {
  name: string;
  color: string;
  textColor: string;
  selectedColor: string;
}

export interface FileSlot {
  id: number;
  file: File | null;
  bank: string | null;
  error?: string;
}

export interface UserData extends Settings {
    id: string;
}
