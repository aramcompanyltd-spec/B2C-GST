const functions = require('firebase-functions');
const admin = require('firebase-admin');

// Initialize Admin SDK
if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();
const APP_ID = 'default-app-id';

/**
 * Triggered when a document is written to the 'payments' subcollection 
 * created by the "Run Payments with Stripe" Firebase Extension.
 */
exports.addCreditsOnPayment = functions.firestore
  .document('customers/{uid}/payments/{paymentId}')
  .onWrite(async (change, context) => {
    const payment = change.after.data();
    const paymentId = context.params.paymentId;
    const uid = context.params.uid;

    // 1. Check if document exists (it might have been deleted)
    if (!payment) {
      return null;
    }

    // 2. Check for success status. 
    // The Stripe extension typically writes 'succeeded' or 'paid' to the status field.
    const status = payment.status;
    if (status !== 'succeeded' && status !== 'paid') {
      console.log(`[Payment ${paymentId}] Status is '${status}'. Waiting for success.`);
      return null;
    }

    // 3. Idempotency Check: Prevent double-counting credits
    // We check a custom field 'credits_processed' that we write to the document.
    if (payment.credits_processed) {
      console.log(`[Payment ${paymentId}] Already processed.`);
      return null;
    }

    // 4. Extract credits from metadata
    // We passed 'creditsToAdd' in the 'payment_intent_data.metadata' from the frontend.
    const metadata = payment.metadata || {};
    const creditsToAdd = parseInt(metadata.creditsToAdd || '0', 10);

    if (creditsToAdd <= 0) {
      console.log(`[Payment ${paymentId}] No credits to add found in metadata.`);
      return null;
    }

    console.log(`[Payment ${paymentId}] Processing top-up for User ${uid}. Adding ${creditsToAdd} credits.`);

    const userRef = db.collection('artifacts').doc(APP_ID).collection('users').doc(uid);
    const paymentRef = change.after.ref;

    try {
      // Run as a transaction to ensure atomic updates
      await db.runTransaction(async (transaction) => {
        const userDoc = await transaction.get(userRef);
        
        if (!userDoc.exists) {
          throw new Error(`User document for ${uid} not found.`);
        }

        const userData = userDoc.data();
        const currentCredits = userData.credits || 0;
        const newBalance = currentCredits + creditsToAdd;

        // Update User Credits
        transaction.update(userRef, {
          credits: newBalance,
          lastPaymentId: paymentId,
          lastPaymentDate: admin.firestore.FieldValue.serverTimestamp(),
          paymentStatus: 'paid'
        });

        // Mark payment as processed in the payments collection
        transaction.update(paymentRef, {
          credits_processed: true,
          processed_at: admin.firestore.FieldValue.serverTimestamp()
        });
      });

      console.log(`[Payment ${paymentId}] SUCCESS. Added ${creditsToAdd} credits to user ${uid}.`);

    } catch (error) {
      console.error(`[Payment ${paymentId}] Transaction failed:`, error);
      // We do not re-throw error to avoid infinite retry loops if it's a logic error
    }
    
    return null;
});