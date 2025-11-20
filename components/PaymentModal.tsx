
import React, { useState, useEffect, useRef } from 'react';
import { db, auth } from '../services/firebase';
import type { FirebaseUser } from '../types';

interface PaymentModalProps {
  user: FirebaseUser;
  onClose: () => void;
}

interface PricingTier {
  id: string;
  amount: number; // in dollars
  baseCredits: number;
  bonusCredits: number;
  color: string;
}

const TIERS: PricingTier[] = [
  { id: 'tier_20', amount: 20, baseCredits: 20, bonusCredits: 0, color: 'bg-gray-100 border-gray-200' },
  { id: 'tier_50', amount: 50, baseCredits: 50, bonusCredits: 5, color: 'bg-blue-50 border-blue-200' },
  { id: 'tier_100', amount: 100, baseCredits: 100, bonusCredits: 15, color: 'bg-indigo-50 border-indigo-200' },
];

const PaymentModal: React.FC<PaymentModalProps> = ({ user, onClose }) => {
  const [quantities, setQuantities] = useState<{ [key: string]: number }>({
    'tier_20': 0,
    'tier_50': 0,
    'tier_100': 0,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [checkoutUrl, setCheckoutUrl] = useState<string | null>(null);
  const [isTakingLong, setIsTakingLong] = useState(false);
  
  const unsubscribeRef = useRef<() => void>(() => {});

  useEffect(() => {
    return () => {
      unsubscribeRef.current();
    };
  }, []);

  const updateQuantity = (id: string, delta: number) => {
    setQuantities(prev => ({
      ...prev,
      [id]: Math.max(0, (prev[id] || 0) + delta)
    }));
  };

  const calculateTotals = () => {
    let totalCost = 0;
    let totalCredits = 0;

    TIERS.forEach(tier => {
      const qty = quantities[tier.id] || 0;
      totalCost += tier.amount * qty;
      totalCredits += (tier.baseCredits + tier.bonusCredits) * qty;
    });

    return { totalCost, totalCredits };
  };

  const { totalCost, totalCredits } = calculateTotals();

  const handleCheckout = async () => {
    if (totalCost === 0) {
      setError("Please select at least one package.");
      return;
    }
    
    setIsLoading(true);
    setError('');
    setCheckoutUrl(null);
    setIsTakingLong(false);

    // Set a timeout to warn the user if it takes too long (e.g. 10 seconds)
    const timeoutId = setTimeout(() => {
      setIsTakingLong(true);
    }, 10000);

    try {
      const lineItems = TIERS.map(tier => {
        const qty = quantities[tier.id];
        if (qty > 0) {
          return {
            price_data: {
              currency: 'nzd',
              product_data: {
                name: `$${tier.amount} Credit Top Up (${tier.baseCredits + tier.bonusCredits} Credits)`,
                description: `${tier.baseCredits} Base + ${tier.bonusCredits} Bonus Credits`,
              },
              unit_amount: tier.amount * 100, // Stripe expects cents
            },
            quantity: qty,
          };
        }
        return null;
      }).filter(Boolean);

      // Use absolute URL without query parameters to satisfy Stripe validation
      const returnUrl = window.location.origin + window.location.pathname;

      // Create a doc in the checkout_sessions collection.
      const docRef = await db
        .collection('customers')
        .doc(user.uid)
        .collection('checkout_sessions')
        .add({
          mode: 'payment',
          line_items: lineItems,
          success_url: returnUrl, 
          cancel_url: returnUrl,
          metadata: {
            userId: user.uid,
            creditsToAdd: totalCredits.toString(),
            type: 'credit_topup'
          }
        });

      // Listen for the sessionId or url to be written to the doc by the extension
      unsubscribeRef.current = docRef.onSnapshot((snap) => {
        const data = snap.data();
        if (!data) return;

        const { error, url } = data;
        
        if (error) {
          clearTimeout(timeoutId);
          console.error("Stripe Extension Error:", error);
          setError(`Payment Error: ${error.message}`);
          setIsLoading(false);
        }
        
        if (url) {
          clearTimeout(timeoutId);
          setCheckoutUrl(url);
          // Attempt automatic redirect
          window.location.assign(url);
        }
      }, (err) => {
        clearTimeout(timeoutId);
        console.error("Snapshot Error:", err);
        // Permission error is common here if rules are not set up for 'customers' collection
        if (err.code === 'permission-denied') {
             setError("Permission denied. Please ensure your account has access to billing.");
        } else {
             setError(`Connection Error: ${err.message}`);
        }
        setIsLoading(false);
      });

    } catch (err: any) {
      clearTimeout(timeoutId);
      console.error("Checkout init error:", err);
      setError(err.message || "Failed to initiate checkout.");
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="bg-blue-600 p-6 text-white flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold">Top Up Credits</h2>
            <p className="text-blue-100 text-sm mt-1">1 Credit = $1 NZD. Uploads cost 20 Credits.</p>
          </div>
          <button onClick={onClose} className="text-white hover:text-blue-200 p-2 rounded-full hover:bg-blue-700 transition">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6">
          {/* Tiers */}
          <div className="space-y-4">
            {TIERS.map((tier) => (
              <div key={tier.id} className={`flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-lg border-2 ${tier.color} transition-all`}>
                <div className="flex-1 mb-4 sm:mb-0">
                  <div className="flex items-baseline space-x-2">
                    <span className="text-2xl font-bold text-gray-800">${tier.amount}</span>
                    <span className="text-gray-600 font-medium">{tier.baseCredits + tier.bonusCredits} Credits</span>
                  </div>
                  {tier.bonusCredits > 0 && (
                    <div className="text-xs font-bold text-green-600 uppercase tracking-wide mt-1">
                      Includes {tier.bonusCredits} Free Bonus Credits!
                    </div>
                  )}
                </div>

                <div className="flex items-center bg-white rounded-lg border border-gray-300 shadow-sm">
                  <button 
                    onClick={() => updateQuantity(tier.id, -1)}
                    className="px-3 py-2 text-gray-600 hover:bg-gray-100 hover:text-blue-600 rounded-l-lg transition"
                    disabled={quantities[tier.id] === 0}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                    </svg>
                  </button>
                  <span className="px-4 py-2 font-mono font-bold text-lg w-12 text-center">
                    {quantities[tier.id] || 0}
                  </span>
                  <button 
                    onClick={() => updateQuantity(tier.id, 1)}
                    className="px-3 py-2 text-gray-600 hover:bg-gray-100 hover:text-blue-600 rounded-r-lg transition"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Summary & Action */}
          <div className="mt-8 border-t pt-6">
            <div className="flex justify-between items-end mb-6">
              <div className="text-gray-600">
                <p>Total Credits to add: <strong className="text-gray-900 text-lg">{totalCredits}</strong></p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-500 mb-1">Total to pay</p>
                <p className="text-3xl font-extrabold text-blue-600">
                  ${totalCost.toFixed(2)} <span className="text-sm font-normal text-gray-500">NZD</span>
                </p>
              </div>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md text-sm text-center font-medium">
                {error}
              </div>
            )}

            {isTakingLong && !checkoutUrl && !error && (
                <div className="mb-4 p-3 bg-yellow-50 text-yellow-800 rounded-md text-sm text-center">
                    <p className="font-bold">Taking longer than usual?</p>
                    <p>Stripe session creation is pending. Please check your internet connection or try again.</p>
                </div>
            )}

            {checkoutUrl ? (
                <div className="text-center">
                    <p className="mb-3 text-green-600 font-bold">Session Ready!</p>
                    <a
                        href={checkoutUrl}
                        className="inline-block w-full py-4 px-6 rounded-lg bg-green-600 text-white font-bold text-lg shadow-lg hover:bg-green-700 transition"
                    >
                        Click here to Pay
                    </a>
                </div>
            ) : (
                <button
                  onClick={handleCheckout}
                  disabled={isLoading || totalCost === 0}
                  className={`w-full py-4 px-6 rounded-lg text-white font-bold text-lg shadow-lg transition transform active:scale-95 ${
                    isLoading || totalCost === 0 
                      ? 'bg-gray-400 cursor-not-allowed' 
                      : 'bg-blue-600 hover:bg-blue-700 hover:shadow-xl'
                  }`}
                >
                  {isLoading ? (
                    <span className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Redirecting to Stripe...
                    </span>
                  ) : (
                    `Proceed to Checkout ($${totalCost})`
                  )}
                </button>
            )}
            
            <p className="text-center text-xs text-gray-400 mt-4">
              Secure payments powered by Stripe. You will be redirected to complete your purchase.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentModal;
