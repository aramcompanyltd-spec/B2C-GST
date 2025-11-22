
const functions = require('firebase-functions');
const admin = require('firebase-admin');

admin.initializeApp();

// Listens for payment documents created or updated by the "Run Payments with Stripe" extension
exports.addCreditsOnPayment = functions.firestore
  .document('customers/{userId}/payments/{paymentId}')
  .onWrite(async (change, context) => {
    // If the document does not exist, it was deleted.
    if (!change.after.exists) return null;

    const paymentData = change.after.data();
    const userId = context.params.userId;
    const paymentId = context.params.paymentId;

    // Idempotency Check: Prevent infinite loops or double counting
    if (paymentData.creditsAdded) {
        return null;
    }

    // Determine success status.
    const status = paymentData.status || paymentData.payment_status;
    const metadata = paymentData.metadata || {};

    // We consider the payment successful if:
    // 1. Status is explicitly 'succeeded' or 'paid'.
    // 2. OR Status is missing/undefined, but the document contains our specific 'credit_topup' metadata.
    const isSuccess = 
        status === 'succeeded' || 
        status === 'paid' || 
        (!status && metadata.type === 'credit_topup');

    const db = admin.firestore();
    // NOTE: The appId here ('default-app-id') must match what is used in services/firebase.ts
    const userRef = db.collection('artifacts').doc('default-app-id').collection('users').doc(userId);
    const paymentRef = change.after.ref;

    // Prepare update data for the user document.
    // We create these fields (paymentStatus, lastPaymentId) as requested so you can verify the payment status in the user document.
    const userUpdate = {
        paymentStatus: status || 'unknown',
        lastPaymentId: paymentId,
        lastPaymentDate: admin.firestore.FieldValue.serverTimestamp()
    };

    // If successful top-up, increment credits
    if (isSuccess && metadata.type === 'credit_topup' && metadata.creditsToAdd) {
        const creditsToAdd = parseInt(metadata.creditsToAdd, 10);
        
        if (!isNaN(creditsToAdd) && creditsToAdd > 0) {
            userUpdate.credits = admin.firestore.FieldValue.increment(creditsToAdd);
        }
    }

    try {
        // Use a transaction to verify the flag and add credits atomically
        await db.runTransaction(async (t) => {
            // Double check the payment document inside the transaction
            const freshPaymentSnap = await t.get(paymentRef);
            if (freshPaymentSnap.exists && freshPaymentSnap.data().creditsAdded) {
                return; // Already processed
            }

            // 1. Update user document with status and credits (creates fields if missing)
            t.set(userRef, userUpdate, { merge: true });

            // 2. Mark payment as processed so we don't add again (only if it was a success case that added credits)
            if (isSuccess) {
                t.set(paymentRef, { creditsAdded: true }, { merge: true });
            }
        });
        
        console.log(`Processed payment ${paymentId} for user ${userId}. Status: ${status}`);
    } catch (error) {
        console.error('Transaction failed:', error);
    }
    
    return null;
  });
