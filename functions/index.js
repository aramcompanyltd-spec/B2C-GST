
const functions = require('firebase-functions');
const admin = require('firebase-admin');

admin.initializeApp();

const db = admin.firestore();
const APP_ID = 'default-app-id'; // Identifier used in Firestore path

/**
 * Helper function to update user credits and log status
 */
const updateUserCredits = async (userId, creditsToAdd, source, docId, rawData) => {
  const userRef = db.collection('artifacts').doc(APP_ID).collection('users').doc(userId);
  
  try {
    const updateData = {
      // Always update debug info so we know the function ran
      debug_lastPaymentData: JSON.stringify(rawData), 
      debug_lastPaymentSource: source,
      debug_lastPaymentId: docId,
      debug_timestamp: admin.firestore.FieldValue.serverTimestamp()
    };

    // Only increment credits if valid amount
    if (creditsToAdd > 0) {
      updateData.credits = admin.firestore.FieldValue.increment(creditsToAdd);
      updateData.paymentStatus = 'paid';
      updateData.lastPaymentDate = admin.firestore.FieldValue.serverTimestamp();
      updateData.lastPaymentId = docId;
    }

    await userRef.set(updateData, { merge: true });
    console.log(`[${source}] Processed payment for User ${userId}. Credits: ${creditsToAdd}`);
  } catch (error) {
    console.error(`[${source}] Failed to update user ${userId}:`, error);
  }
};

/**
 * Listener 1: Monitor Checkout Sessions
 * Triggers when Stripe Extension updates checkout_sessions (e.g. status -> 'paid')
 */
exports.monitorCheckoutSession = functions.firestore
  .document('customers/{userId}/checkout_sessions/{sessionId}')
  .onWrite(async (change, context) => {
    if (!change.after.exists) return null;

    const data = change.after.data();
    const userId = context.params.userId;
    const sessionId = context.params.sessionId;

    // Log that we saw a change
    console.log(`[CheckoutSession] Detected change for ${sessionId} status: ${data.payment_status}`);

    // If already processed, skip credit addition but allow debug update
    if (data.creditsAdded) return null;

    if (data.payment_status === 'paid') {
      const metadata = data.metadata || {};
      const creditsToAdd = parseInt(metadata.creditsToAdd || '0', 10);

      // Mark as processed immediately
      await change.after.ref.set({ creditsAdded: true }, { merge: true });

      await updateUserCredits(userId, creditsToAdd, 'checkout_session', sessionId, data);
    }
    return null;
  });

/**
 * Listener 2: Monitor Payments Collection
 * Triggers when Stripe Extension creates a payment document (usually via Webhook)
 */
exports.addCreditsOnPayment = functions.firestore
  .document('customers/{userId}/payments/{paymentId}')
  .onWrite(async (change, context) => {
    if (!change.after.exists) return null;

    const data = change.after.data();
    const userId = context.params.userId;
    const paymentId = context.params.paymentId;

    console.log(`[Payment] Detected payment doc ${paymentId} status: ${data.status}`);

    if (data.creditsAdded) return null;

    // Support both 'succeeded' and 'paid' statuses
    const status = data.status || data.payment_status;
    const isSuccess = ['succeeded', 'paid'].includes(status);
    
    if (isSuccess) {
       const metadata = data.metadata || {};
       // Try to find credits in metadata, default to 0 to just log the event
       const creditsToAdd = parseInt(metadata.creditsToAdd || '0', 10);

       // Mark as processed
       await change.after.ref.set({ creditsAdded: true }, { merge: true });

       await updateUserCredits(userId, creditsToAdd, 'payment_document', paymentId, data);
    }
    return null;
  });
