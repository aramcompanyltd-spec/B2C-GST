

import React, { useMemo } from 'react';
import type { AccountCategory } from '../types';

interface SummaryProps {
    data: any[];
    accountTable: AccountCategory[];
    clientName: string;
}

interface SummaryRow {
    name: string;
    code: string;
    total: number;
    gstRatio: number;
    actual: number;
    gst: number;
}

interface SummaryTableProps {
  title: string;
  items: SummaryRow[];
  totals: { total: number; actual: number; gst: number };
  headerContent?: React.ReactNode;
}

const SummaryTable: React.FC<SummaryTableProps> = ({ title, items, totals, headerContent }) => {
  return (
    <div className="bg-white p-6 rounded-lg shadow-sm text-gray-800 overflow-x-auto">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-700">{title}</h3>
        {headerContent}
      </div>
      <table className="w-full text-sm table-fixed">
        <colgroup>
            <col className="w-1/4" />
            <col className="w-1/12" />
            <col className="w-1/6" />
            <col className="w-1/6" />
            <col className="w-1/6" />
            <col className="w-1/6" />
        </colgroup>
        <thead>
          <tr className="border-b bg-gray-50">
            <th className="text-left font-medium text-gray-500 py-2 px-2 uppercase whitespace-nowrap">Account</th>
            <th className="text-left font-medium text-gray-500 py-2 px-2 uppercase whitespace-nowrap">Code</th>
            <th className="text-left font-medium text-gray-500 py-2 px-2 uppercase whitespace-nowrap">Total Amount</th>
            <th className="text-left font-medium text-gray-500 py-2 px-2 uppercase whitespace-nowrap">GST ratio %</th>
            <th className="text-left font-medium text-gray-500 py-2 px-2 uppercase whitespace-nowrap">Actual Amount</th>
            <th className="text-left font-medium text-gray-500 py-2 px-2 uppercase whitespace-nowrap">GST</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.name} className="odd:bg-white even:bg-gray-50 border-b">
              <td className="py-2 px-2 text-gray-900 font-medium truncate" title={item.name}>{item.name}</td>
              <td className="py-2 px-2 text-gray-600">{item.code}</td>
              <td className="text-left py-2 px-2 text-gray-900 font-mono">${item.total.toFixed(2)}</td>
              <td className="text-left py-2 px-2 text-gray-600">{(item.gstRatio * 100).toFixed(0)}%</td>
              <td className="text-left py-2 px-2 text-gray-900 font-mono">
                {`$${item.actual.toFixed(2)}`}
              </td>
              <td className="text-left py-2 px-2 text-gray-900 font-mono">
                {item.gst > 0 ? `$${item.gst.toFixed(2)}` : '-'}
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="border-t-2 font-bold bg-gray-100">
            <td colSpan={2} className="py-2 px-2 text-gray-900 uppercase">Total</td>
            <td className="text-left py-2 px-2 text-gray-900 font-mono">${totals.total.toFixed(2)}</td>
            <td className="py-2 px-2"></td>
            <td className="text-left py-2 px-2 text-gray-900 font-mono">${totals.actual.toFixed(2)}</td>
            <td className="text-left py-2 px-2 text-gray-900 font-mono">${totals.gst.toFixed(2)}</td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
};

const SummarySection: React.FC<SummaryProps> = ({ data, accountTable, clientName }) => {
  const { salesData, expensesData } = useMemo(() => {
    const intermediateSummaries: { [key: string]: { total: number; code: string; gstRatio: number } } = {};

    data.forEach(tx => {
        if (!intermediateSummaries[tx.category]) {
            const categoryInfo = accountTable.find(cat => cat.name === tx.category);
            intermediateSummaries[tx.category] = {
                total: 0,
                code: categoryInfo?.code || '',
                gstRatio: categoryInfo?.ratio ?? 0,
            };
        }
        intermediateSummaries[tx.category].total += tx.Amount;
    });

    const salesItems: SummaryRow[] = [];
    const expensesItems: SummaryRow[] = [];
    const salesTotals = { total: 0, actual: 0, gst: 0 };
    const expensesTotals = { total: 0, actual: 0, gst: 0 };

    Object.entries(intermediateSummaries).forEach(([name, summary]) => {
        const isSale = summary.total > 0;
        const totalAmount = Math.abs(summary.total);
        
        // Per user request, Actual Amount is the business portion of the total amount.
        const actualAmount = totalAmount * summary.gstRatio;
        // The GST is calculated from this business portion.
        const gstAmount = actualAmount * (3 / 23);
        
        const row: SummaryRow = { name, code: summary.code, total: totalAmount, gstRatio: summary.gstRatio, actual: actualAmount, gst: gstAmount };
        
        if (isSale) {
            salesItems.push(row);
            salesTotals.total += totalAmount;
            salesTotals.actual += actualAmount;
            salesTotals.gst += gstAmount;
        } else {
            expensesItems.push(row);
            expensesTotals.total += totalAmount;
            expensesTotals.actual += actualAmount;
            expensesTotals.gst += gstAmount;
        }
    });

    const sortByCode = (a: SummaryRow, b: SummaryRow) => (a.code || '999').localeCompare(b.code || '999', undefined, { numeric: true });
    salesItems.sort(sortByCode);
    expensesItems.sort(sortByCode);

    return { 
        salesData: { items: salesItems, totals: salesTotals }, 
        expensesData: { items: expensesItems, totals: expensesTotals } 
    };
  }, [data, accountTable]);

  const handleJournalDownload = () => {
    let journalEntries: { Account: string; Code: string; Debit: number; Credit: number }[] = [];
    let totalDebit = 0;
    let totalCredit = 0;
    let drawingsEntry: { Account: string; Code: string; Debit: number; Credit: number } | null = null;

    const summaries: { [key: string]: { total: number; code: string; gstRatio: number } } = {};
    data.forEach(tx => {
        if (!summaries[tx.category]) {
            const categoryInfo = accountTable.find(cat => cat.name === tx.category);
            summaries[tx.category] = {
                total: 0,
                code: categoryInfo?.code || '',
                gstRatio: categoryInfo?.ratio ?? 0,
            };
        }
        summaries[tx.category].total += tx.Amount;
    });

    Object.entries(summaries).forEach(([categoryName, summary]) => {
        const { total, code, gstRatio } = summary;
        
        const totalAmount = Math.abs(total);
        let exclusiveAmount;

        if (gstRatio === 0) {
            exclusiveAmount = totalAmount;
        } else {
            // "Actual amount" is the business-claimable portion of the total amount.
            const actualAmount = totalAmount * gstRatio;
            // The GST is calculated from this business portion.
            const gstOnActual = actualAmount * (3 / 23);
            // The journal entry should be the GST-exclusive value of the business portion.
            exclusiveAmount = actualAmount - gstOnActual;
        }

        if (total > 0) { // Credit
            journalEntries.push({ Account: categoryName, Code: code, Debit: 0, Credit: exclusiveAmount });
            totalCredit += exclusiveAmount;
        } else { // Debit
            journalEntries.push({ Account: categoryName, Code: code, Debit: exclusiveAmount, Credit: 0 });
            totalDebit += exclusiveAmount;
        }
    });

    const difference = totalCredit - totalDebit;
    if (Math.abs(difference) > 0.01) { 
        if (difference > 0) {
            drawingsEntry = { Account: 'Drawings', Code: '501', Debit: difference, Credit: 0 };
            totalDebit += difference;
        } else {
            drawingsEntry = { Account: 'Drawings', Code: '501', Debit: 0, Credit: Math.abs(difference) };
            totalCredit += Math.abs(difference);
        }
    }
    
    journalEntries.sort((a, b) => {
        if (a.Credit > 0 && b.Debit > 0) return -1;
        if (a.Debit > 0 && b.Credit > 0) return 1;
        return (a.Code || '999').localeCompare(b.Code || '999', undefined, { numeric: true });
    });

    if (drawingsEntry) {
        journalEntries.push(drawingsEntry);
    }

    const csvData = journalEntries.map(entry => ({
        Account: entry.Account,
        Code: entry.Code,
        Debit: entry.Debit > 0 ? entry.Debit.toFixed(2) : '',
        Credit: entry.Credit > 0 ? entry.Credit.toFixed(2) : ''
    }));

    csvData.push({ Account: 'Total', Code: '', Debit: totalDebit.toFixed(2), Credit: totalCredit.toFixed(2) });

    const csv = (window as any).Papa.unparse(csvData, { columns: ['Account', 'Code', 'Debit', 'Credit'] });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    const now = new Date();
    const timestamp = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
    const safeClientName = clientName.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    const filename = `${safeClientName}_journal_${timestamp}.csv`;
    
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const journalDownloadButton = (
    <button 
        onClick={handleJournalDownload} 
        className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 font-semibold flex items-center space-x-2 shadow-sm"
    >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
        </svg>
        <span>Journal Download</span>
    </button>
  );

  return (
    <div className="space-y-8">
      <SummaryTable 
        title="Sales & Income" 
        items={salesData.items} 
        totals={salesData.totals}
        headerContent={journalDownloadButton}
      />
      <SummaryTable 
        title="Purchases & Expenses" 
        items={expensesData.items} 
        totals={expensesData.totals} 
      />
    </div>
  );
};

export default SummarySection;