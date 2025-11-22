
const functions = require('firebase-functions');
const admin = require('firebase-admin');

admin.initializeApp();

const db = admin.firestore();
const APP_ID = 'default-app-id'; // Identifier used in Firestore path

/**
 * Listener 1: Monitor Checkout Sessions
 * This triggers when the Stripe Extension updates the checkout_sessions document (e.g., status changes to 'paid').
 */
exports.monitorCheckoutSession = functions.firestore
  .document('customers/{userId}/checkout_sessions/{sessionId}')
  .onWrite(async (change, context) => {
    const userId = context.params.userId;
    const sessionId = context.params.sessionId;

    // Exit if document is deleted
    if (!change.after.exists) {
        console.log(`[monitorCheckoutSession] Document deleted: ${sessionId}`);
        return null;
    }

    const sessionData = change.after.data();
    console.log(`[monitorCheckoutSession] Doc Update: ${sessionId}`, JSON.stringify(sessionData));

    // Check both potential status fields
    const status = sessionData.payment_status || sessionData.status; 
    
    // Check if payment is successful and not already processed
    // Stripe status is usually 'paid', but 'succeeded' is also possible in some contexts
    if (['paid', 'succeeded'].includes(status) && !sessionData.creditsAdded) {
      const metadata = sessionData.metadata || {};
      const creditsToAdd = parseInt(metadata.creditsToAdd || '0', 10);
      
      console.log(`[monitorCheckoutSession] Payment detected. Status: ${status}, CreditsToAdd: ${creditsToAdd}, Type: ${metadata.type}`);

      // Verify this transaction is for a credit top-up
      if (metadata.type === 'credit_topup' && creditsToAdd > 0) {
        try {
          // 1. Mark session as processed immediately
          await change.after.ref.set({ creditsAdded: true }, { merge: true });

          // 2. Update the user's credits
          const userRef = db.collection('artifacts').doc(APP_ID).collection('users').doc(userId);
          
          await userRef.set({
            credits: admin.firestore.FieldValue.increment(creditsToAdd),
            paymentStatus: 'paid',
            lastPaymentId: sessionId,
            lastPaymentSource: 'checkout_session',
            lastPaymentDate: admin.firestore.FieldValue.serverTimestamp()
          }, { merge: true });

          console.log(`[monitorCheckoutSession] SUCCESS: Added ${creditsToAdd} credits to user ${userId}.`);
        } catch (error) {
          console.error('[monitorCheckoutSession] ERROR updating user credits:', error);
        }
      } else {
          console.log(`[monitorCheckoutSession] SKIPPED. Condition met? Type=${metadata.type}, Credits>0=${creditsToAdd > 0}`);
      }
    }
    return null;
  });

/**
 * Listener 2: Monitor Payments Collection
 * This triggers if the Stripe Extension writes to the 'payments' collection.
 * This is often where the 'checkout.session.completed' or 'invoice.payment_succeeded' data lands.
 */
exports.addCreditsOnPayment = functions.firestore
  .document('customers/{userId}/payments/{paymentId}')
  .onWrite(async (change, context) => {
    const userId = context.params.userId;
    const paymentId = context.params.paymentId;

    if (!change.after.exists) return null;

    const paymentData = change.after.data();
    console.log(`[addCreditsOnPayment] Doc Update: ${paymentId}`, JSON.stringify(paymentData));

    // Avoid double processing
    if (paymentData.creditsAdded) return null;

    const status = paymentData.status || paymentData.payment_status;
    const isSuccess = ['succeeded', 'paid'].includes(status);
    
    if (isSuccess) {
       const metadata = paymentData.metadata || {};
       const creditsToAdd = parseInt(metadata.creditsToAdd || '0', 10);

       console.log(`[addCreditsOnPayment] Success payment found. CreditsToAdd: ${creditsToAdd}`);

       if (metadata.type === 'credit_topup' && creditsToAdd > 0) {
         try {
            await change.after.ref.set({ creditsAdded: true }, { merge: true });

            const userRef = db.collection('artifacts').doc(APP_ID).collection('users').doc(userId);

            await userRef.set({
              credits: admin.firestore.FieldValue.increment(creditsToAdd),
              paymentStatus: status,
              lastPaymentId: paymentId,
              lastPaymentSource: 'payment_document',
              lastPaymentDate: admin.firestore.FieldValue.serverTimestamp()
            }, { merge: true });

            console.log(`[addCreditsOnPayment] SUCCESS: Added ${creditsToAdd} credits to user ${userId}.`);
         } catch (error) {
           console.error('[addCreditsOnPayment] ERROR updating user credits:', error);
         }
       }
    }
    
    return null;
  });
