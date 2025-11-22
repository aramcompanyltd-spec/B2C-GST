
const functions = require('firebase-functions');
const admin = require('firebase-admin');

admin.initializeApp();

const db = admin.firestore();
const APP_ID = 'default-app-id'; // Identifier used in Firestore path

/**
 * Listener 1: Monitor Checkout Sessions
 * This triggers when the Stripe Extension updates the checkout_sessions document (e.g., status changes to 'paid').
 * This is the primary method as it relies on metadata set directly by the client.
 */
exports.monitorCheckoutSession = functions.firestore
  .document('customers/{userId}/checkout_sessions/{sessionId}')
  .onWrite(async (change, context) => {
    // Exit if document is deleted
    if (!change.after.exists) return null;

    const sessionData = change.after.data();
    const userId = context.params.userId;
    const sessionId = context.params.sessionId;

    // Check if payment is successful and not already processed
    if (sessionData.payment_status === 'paid' && !sessionData.creditsAdded) {
      const metadata = sessionData.metadata || {};

      // Verify this transaction is for a credit top-up
      if (metadata.type === 'credit_topup') {
        const creditsToAdd = parseInt(metadata.creditsToAdd || '0', 10);

        if (creditsToAdd > 0) {
          try {
            // 1. Mark session as processed immediately to prevent double-counting
            await change.after.ref.set({ creditsAdded: true }, { merge: true });

            // 2. Update the user's credits and payment status
            const userRef = db.collection('artifacts').doc(APP_ID).collection('users').doc(userId);
            
            await userRef.set({
              credits: admin.firestore.FieldValue.increment(creditsToAdd),
              paymentStatus: 'paid',
              lastPaymentId: sessionId,
              lastPaymentSource: 'checkout_session',
              lastPaymentDate: admin.firestore.FieldValue.serverTimestamp()
            }, { merge: true });

            console.log(`[CheckoutSession] Successfully added ${creditsToAdd} credits to user ${userId}.`);
          } catch (error) {
            console.error('[CheckoutSession] Error updating user credits:', error);
          }
        }
      }
    }
    return null;
  });

/**
 * Listener 2: Monitor Payments Collection
 * This triggers if the Stripe Extension writes to the 'payments' collection.
 * Serves as a backup or for alternative payment flows.
 */
exports.addCreditsOnPayment = functions.firestore
  .document('customers/{userId}/payments/{paymentId}')
  .onWrite(async (change, context) => {
    if (!change.after.exists) return null;

    const paymentData = change.after.data();
    const userId = context.params.userId;
    const paymentId = context.params.paymentId;

    // Avoid double processing if this document was already handled
    if (paymentData.creditsAdded) return null;

    // Check valid statuses
    const status = paymentData.status || paymentData.payment_status;
    const isSuccess = ['succeeded', 'paid'].includes(status);
    const metadata = paymentData.metadata || {};

    // Check if this is a credit top-up
    if (isSuccess && metadata.type === 'credit_topup') {
       const creditsToAdd = parseInt(metadata.creditsToAdd || '0', 10);

       if (creditsToAdd > 0) {
         try {
            // Check if this payment was already handled via checkout_session listener
            // (Optional: You could check lastPaymentId on user, but for now we rely on the flag)
            
            await change.after.ref.set({ creditsAdded: true }, { merge: true });

            const userRef = db.collection('artifacts').doc(APP_ID).collection('users').doc(userId);

            await userRef.set({
              credits: admin.firestore.FieldValue.increment(creditsToAdd),
              paymentStatus: status,
              lastPaymentId: paymentId,
              lastPaymentSource: 'payment_document',
              lastPaymentDate: admin.firestore.FieldValue.serverTimestamp()
            }, { merge: true });

            console.log(`[PaymentDoc] Successfully added ${creditsToAdd} credits to user ${userId}.`);
         } catch (error) {
           console.error('[PaymentDoc] Error updating user credits:', error);
         }
       }
    }
    
    return null;
  });
