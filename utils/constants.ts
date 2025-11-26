
import type { BankConfig, Bank, AccountCategory } from '../types';

export const BANK_HEADERS: { [key: string]: BankConfig } = {
  ASB: { identifiers: ['Payee', 'Memo', 'Amount'], descriptionFields: ['Payee', 'Memo'], dateFormat: 'DD/MM/YYYY', amountField: 'Amount' },
  BNZ: { identifiers: ['Code'], descriptionFields: ['Code'], dateFormat: 'DD/MM/YYYY', amountField: 'Amount' },
  Westpac: { identifiers: ['Other Party'], descriptionFields: ['Other Party'], dateFormat: 'DD/MM/YYYY', amountField: 'Amount' },
  Kiwibank: { identifiers: ['Description', 'Particulars', 'Other Party'], descriptionFields: ['Description', 'Particulars', 'Other Party'], dateFormat: 'DD/MM/YYYY', amountField: 'Amount' },
  ANZ: { identifiers: ['Details', 'Description', 'Particulars'], descriptionFields: ['Details', 'Description', 'Particulars'], dateFormat: 'DD/MM/YYYY', amountField: 'Amount' },
};

export const BANKS: Bank[] = [
  { name: 'ASB', color: 'bg-yellow-400', textColor: 'text-black', selectedColor: 'ring-yellow-500' },
  { name: 'BNZ', color: 'bg-blue-800', textColor: 'text-white', selectedColor: 'ring-blue-900' },
  { name: 'Westpac', color: 'bg-red-600', textColor: 'text-white', selectedColor: 'ring-red-700' },
  { name: 'Kiwibank', color: 'bg-green-500', textColor: 'text-white', selectedColor: 'ring-green-600' },
  { name: 'ANZ', color: 'bg-blue-500', textColor: 'text-white', selectedColor: 'ring-blue-600' },
];

export const DEFAULT_ACCOUNT_TABLE: AccountCategory[] = [
    { id: '1', name: 'Sales', ratio: 1.0, code: '200', isDeletable: true },
    { id: '2', name: 'Sales - Zero Rated', ratio: 0.0, code: '205', isDeletable: true },
    { id: '3', name: 'Purchases', ratio: 1.0, code: '210', isDeletable: true },
    { id: '4', name: 'Promotion & Marketing', ratio: 1.0, code: '290', isDeletable: true },
    { id: '5', name: 'Bank Charge', ratio: 0.0, code: '302', isDeletable: true },
    { id: '6', name: 'Entertainment', ratio: 0.5, code: '327', isDeletable: true },
    { id: '7', name: 'General Expenses', ratio: 1.0, code: '335', isDeletable: true },
    { id: '8', name: 'Insurance', ratio: 1.0, code: '340', isDeletable: true },
    { id: '9', name: 'Power', ratio: 1.0, code: '384', isDeletable: true },
    { id: '10', name: 'Motor Vehicle Expenses', ratio: 0.25, code: '410', isDeletable: true },
    { id: '11', name: 'Home Office Expenses', ratio: 0.25, code: '425', isDeletable: true },
    { id: '12', name: 'Rates', ratio: 1.0, code: '440', isDeletable: true },
    { id: '13', name: 'Staff Expenses', ratio: 1.0, code: '457', isDeletable: true },
    { id: '14', name: 'Mobile Phone', ratio: 1.0, code: '464', isDeletable: true },
    { id: '15', name: 'Travel - National', ratio: 1.0, code: '469', isDeletable: true },
    { id: '16', name: 'Travel - International', ratio: 0.0, code: '470', isDeletable: true },
    { id: '17', name: 'Salary and Wages', ratio: 0.0, code: '475', isDeletable: true },
    { id: '18', name: 'GST Payment or Refund', ratio: 0.0, code: '630', isDeletable: true },
    { id: '19', name: 'Transfers', ratio: 0.0, code: '997', isDeletable: true },
    { id: '20', name: 'Uncategorized', ratio: 0.0, code: '998', isDeletable: true },
];

export const CLASSIFICATION_KEYWORDS: { [key: string]: string[] } = {
  'Sales - Zero Rated': ['EXPORT', 'GST-FREE', 'ZERO-RATED'],
  'Purchases': ['COUNTDOWN', 'PAKNSAVE', 'NEW WORLD', 'BUNNINGS', 'MITRE 10', 'WAREHOUSE STATIONERY', 'SPARK', 'VODAFONE', '2DEGREES'],
  'Entertainment': ['RESTAURANT', 'CAFE', 'BAR', 'UBER EATS', 'DELIVEREASY', 'MENULOG'],
  'Motor Vehicle Expenses': ['Z ENERGY', 'BP', 'MOBIL', 'CALTEX', 'GULL', 'AA', 'VTNZ', 'CAR PARTS', 'REPCO'],
  'Transfers': ['TRANSFER', 'TFR', 'INTERNET BANKING', 'AUTOMATIC PAYMENT', 'DIRECT DEBIT', 'CREDIT CARD PAYMENT'],
};
