
const functions = require('firebase-functions');
const admin = require('firebase-admin');

admin.initializeApp();

const db = admin.firestore();
const APP_ID = 'default-app-id'; // Identifier used in Firestore path

/**
 * Listener 1: Monitor Checkout Sessions
 * This triggers when the Stripe Extension updates the checkout_sessions document.
 * We specifically listen for 'payment_status' becoming 'paid', which matches the checkout.session.completed webhook.
 */
exports.monitorCheckoutSession = functions.firestore
  .document('customers/{userId}/checkout_sessions/{sessionId}')
  .onWrite(async (change, context) => {
    const userId = context.params.userId;
    const sessionId = context.params.sessionId;

    // Exit if document is deleted
    if (!change.after.exists) {
        return null;
    }

    const sessionData = change.after.data();
    
    console.log(`[monitorCheckoutSession] Session ID: ${sessionId}, Status: ${sessionData.status}, PaymentStatus: ${sessionData.payment_status}`);

    // CHECK: Broaden the success check. 
    // Standard Stripe Checkout: status='complete', payment_status='paid'.
    // User Request: Check for 'succeeded' in payment_status as well.
    const status = sessionData.status;
    const paymentStatus = sessionData.payment_status;
    
    const isPaid = 
        status === 'complete' || 
        status === 'succeeded' || 
        paymentStatus === 'paid' || 
        paymentStatus === 'succeeded';

    const alreadyProcessed = sessionData.creditsAdded === true;

    if (isPaid && !alreadyProcessed) {
      const metadata = sessionData.metadata || {};
      // Ensure robust parsing of creditsToAdd
      const creditsToAdd = parseInt(String(metadata.creditsToAdd || '0'), 10);
      const type = metadata.type;
      
      console.log(`[monitorCheckoutSession] Payment confirmed (Status: ${status}, PaymentStatus: ${paymentStatus}). Processing ${creditsToAdd} credits for user ${userId}.`);

      // Verify this transaction is for a credit top-up and has valid credits
      if (type === 'credit_topup' && creditsToAdd > 0) {
        try {
          // 1. Mark session as processed immediately to prevent duplicate credits (Idempotency)
          await change.after.ref.set({ creditsAdded: true }, { merge: true });

          // 2. Update the user's credits atomically
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
          console.log(`[monitorCheckoutSession] SKIPPED. Valid payment but metadata mismatch or zero credits. Type: ${type}, Credits: ${creditsToAdd}`);
      }
    }
    return null;
  });

/**
 * Listener 2: Monitor Payments Collection
 * This triggers if the Stripe Extension writes to the 'payments' collection.
 * This serves as a backup if checkout_sessions isn't updated or for different payment flows.
 */
exports.addCreditsOnPayment = functions.firestore
  .document('customers/{userId}/payments/{paymentId}')
  .onWrite(async (change, context) => {
    const userId = context.params.userId;
    const paymentId = context.params.paymentId;

    if (!change.after.exists) return null;

    const paymentData = change.after.data();
    
    // Avoid double processing
    if (paymentData.creditsAdded) return null;

    const status = paymentData.status || paymentData.payment_status;
    // Stripe PaymentIntents use 'succeeded'.
    const isSuccess = ['succeeded', 'paid', 'complete'].includes(status);
    
    if (isSuccess) {
       const metadata = paymentData.metadata || {};
       // Ensure robust parsing of creditsToAdd
       const creditsToAdd = parseInt(String(metadata.creditsToAdd || '0'), 10);

       if (metadata.type === 'credit_topup' && creditsToAdd > 0) {
         console.log(`[addCreditsOnPayment] Success payment found for ${paymentId}. Credits: ${creditsToAdd}`);
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
