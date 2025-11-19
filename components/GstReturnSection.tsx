import React, { useMemo } from 'react';
import { Transaction } from '../types';

interface GstReturnProps {
    data: Transaction[];
}

interface ReturnLineProps {
    label: string;
    amount: number;
    note?: string;
    highlight?: boolean;
    isFinal?: boolean;
    isOdd?: boolean;
}

const ReturnLine: React.FC<ReturnLineProps> = ({ label, amount, note, highlight, isFinal, isOdd }) => {
    const finalClass = isFinal ? (amount >= 0 ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800') : '';
    const oddClass = isOdd && !highlight && !isFinal ? 'bg-gray-50' : '';
    return (
        <div className={`grid grid-cols-3 gap-4 items-center py-3 px-4 rounded-md ${highlight ? 'bg-blue-50' : ''} ${finalClass} ${oddClass}`}>
            <div className="col-span-2">
                <p className="font-semibold">{label}</p>
                {note && <p className="text-xs text-gray-500">{note}</p>}
            </div>
            <p className={`font-mono text-lg font-bold text-left ${!isFinal ? 'text-gray-900' : ''} ${highlight || isFinal ? 'text-xl' : ''}`}>
                ${Math.abs(amount).toFixed(2)}
            </p>
        </div>
    );
};

const GstReturnSection: React.FC<GstReturnProps> = ({ data }) => {
    const summary = useMemo(() => {
        let totalSales = 0, zeroRatedSales = 0, gstCollected = 0, adjustedPurchases = 0, gstPaid = 0;
        
        data.forEach(tx => {
            if (tx.Amount > 0) { // Sales / Income
                if (tx.category !== 'Transfers') {
                    totalSales += tx.Amount;
                }
                if (tx.category === 'Sales - Zero Rated') {
                    zeroRatedSales += tx.Amount;
                }
                gstCollected += tx.gstAmount || 0;
            } else { // Purchases & Expenses
                // gstRatio is used to determine the portion of the expense that is claimable
                adjustedPurchases += Math.abs(tx.Amount) * (tx.gstRatio || 0);
                gstPaid += tx.gstAmount || 0;
            }
        });
        
        const netGstSales = totalSales - zeroRatedSales;
        const gstDifference = gstCollected - gstPaid;
        return { totalSales, zeroRatedSales, netGstSales, gstCollected, adjustedPurchases, gstPaid, gstDifference };
    }, [data]);

    const returnLines = [
        { type: 'line', label: "Total Sales and Income", amount: summary.totalSales, note: "(GSTable and Zero-Rated)" },
        { type: 'line', label: "Zero-Rated Supplies", amount: summary.zeroRatedSales },
        { type: 'line', label: "Net GST Sales and Income", amount: summary.netGstSales, note: "(Total Sales - Zero-Rated Supplies)" },
        { type: 'line', label: "Total GST Collected on Sales", amount: summary.gstCollected, highlight: true },
        { type: 'separator', heavy: false },
        { type: 'line', label: "Total Purchases and Expenses (GST Adjusted)", amount: summary.adjustedPurchases, note: "(Sum of: Category Amount × GST Ratio)" },
        { type: 'line', label: "Total GST Paid", amount: summary.gstPaid, highlight: true },
        { type: 'separator', heavy: true },
        { type: 'line', label: summary.gstDifference >= 0 ? 'Total GST to Pay' : 'Total GST to Refund', amount: summary.gstDifference, note: "(GST Collected - GST Paid)", isFinal: true },
    ];
    let lineIndex = 0;

    return (
        <div className="bg-white p-6 rounded-lg shadow-sm text-gray-800">
            <h3 className="text-xl font-semibold mb-4">GST Return Summary</h3>
            <div className="space-y-2">
                 {returnLines.map((line, index) => {
                    if (line.type === 'separator') {
                        return <hr key={index} className={`my-4 ${line.heavy ? 'border-t-2' : ''}`} />;
                    }
                    if (line.type === 'line') {
                        const isOdd = lineIndex % 2 === 1;
                        lineIndex++;
                        return (
                            <ReturnLine 
                                key={index}
                                label={line.label!}
                                amount={line.amount!}
                                note={line.note}
                                highlight={line.highlight}
                                isFinal={line.isFinal}
                                isOdd={isOdd}
                            />
                        );
                    }
                    return null;
                })}
            </div>
        </div>
    );
};

export default GstReturnSection;