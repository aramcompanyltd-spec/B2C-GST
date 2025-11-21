
const functions = require('firebase-functions');
const admin = require('firebase-admin');

admin.initializeApp();

// Listens for payment documents created or updated by the "Run Payments with Stripe" extension
// using onWrite instead of onCreate to capture status changes (e.g., from 'processing' to 'succeeded').
exports.addCreditsOnPayment = functions.firestore
  .document('customers/{userId}/payments/{paymentId}')
  .onWrite(async (change, context) => {
    // If the document does not exist, it was deleted.
    if (!change.after.exists) return null;

    const paymentData = change.after.data();
    const userId = context.params.userId;

    // Idempotency Check: Prevent infinite loops or double counting
    if (paymentData.creditsAdded) {
        return null;
    }

    // Determine success status.
    // The 'Run Payments with Stripe' extension typically writes 'status' (e.g. 'succeeded').
    // However, some configurations or webhook events (like checkout.session.completed) might use 'payment_status' ('paid').
    // In some cases reported by users, the status field might be missing entirely if the webhook mapping is limited.
    const status = paymentData.status || paymentData.payment_status;
    const metadata = paymentData.metadata || {};

    // We consider the payment successful if:
    // 1. Status is explicitly 'succeeded' or 'paid'.
    // 2. OR Status is missing/undefined, but the document contains our specific 'credit_topup' metadata.
    //    (Assuming the extension is configured to only write these documents on success events like payment_intent.succeeded).
    const isSuccess = 
        status === 'succeeded' || 
        status === 'paid' || 
        (!status && metadata.type === 'credit_topup');

    if (isSuccess) {
      if (metadata.type === 'credit_topup' && metadata.creditsToAdd) {
        const creditsToAdd = parseInt(metadata.creditsToAdd, 10);
        
        if (!isNaN(creditsToAdd) && creditsToAdd > 0) {
            const db = admin.firestore();
            // NOTE: The appId here ('default-app-id') must match what is used in services/firebase.ts
            const userRef = db.collection('artifacts').doc('default-app-id').collection('users').doc(userId);
            const paymentRef = change.after.ref;

            try {
                // Use a transaction to verify the flag and add credits atomically
                await db.runTransaction(async (t) => {
                    // Double check the payment document inside the transaction
                    const freshPaymentSnap = await t.get(paymentRef);
                    if (freshPaymentSnap.exists && freshPaymentSnap.data().creditsAdded) {
                        return; // Already processed
                    }

                    // 1. Add credits to user
                    t.set(userRef, {
                        credits: admin.firestore.FieldValue.increment(creditsToAdd)
                    }, { merge: true });

                    // 2. Mark payment as processed so we don't add again
                    t.set(paymentRef, { creditsAdded: true }, { merge: true });
                });
                
                console.log(`Successfully added ${creditsToAdd} credits to user ${userId} from payment ${context.params.paymentId}`);
            } catch (error) {
                console.error('Transaction failed:', error);
            }
        } else {
            console.warn(`Invalid credit amount in metadata for user ${userId}`);
        }
      }
    } else {
        // Debugging log for missing status
        console.log(`Payment ${context.params.paymentId} skipped. Status: ${status}, Metadata: ${JSON.stringify(metadata)}`);
    }
    return null;
  });
