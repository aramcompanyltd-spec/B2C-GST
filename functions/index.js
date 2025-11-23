
const functions = require('firebase-functions');
const admin = require('firebase-admin');

admin.initializeApp();

const db = admin.firestore();
const APP_ID = 'default-app-id'; // Identifier used in Firestore path

/**
 * Listener 1: Monitor Checkout Sessions
 * This triggers when the Stripe Extension updates the checkout_sessions document.
 * We specifically listen for 'payment_status' becoming 'paid' or status becoming 'complete'.
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
    
    // Detailed logging for debugging
    console.log(`[monitorCheckoutSession] Processing ${sessionId} for user ${userId}. Status: ${sessionData.status}, PaymentStatus: ${sessionData.payment_status}`);

    // Check strictly for processed flag to ensure idempotency
    if (sessionData.creditsAdded) {
        console.log(`[monitorCheckoutSession] Session ${sessionId} already processed. Skipping.`);
        return null;
    }

    const status = sessionData.status;
    const paymentStatus = sessionData.payment_status;
    
    const isPaid = 
        status === 'complete' || 
        status === 'succeeded' || 
        paymentStatus === 'paid' || 
        paymentStatus === 'succeeded';

    if (isPaid) {
      const metadata = sessionData.metadata || {};
      // Parse credits, defaulting to 0. Handle potential string/number types.
      const creditsToAdd = parseInt(String(metadata.creditsToAdd || '0'), 10);
      
      console.log(`[monitorCheckoutSession] Paid session detected. Credits to add: ${creditsToAdd}. Metadata:`, metadata);

      // Removed strict check for metadata.type to improve reliability.
      // If creditsToAdd exists and is positive, we proceed.
      if (creditsToAdd > 0) {
        console.log(`[monitorCheckoutSession] Processing ${creditsToAdd} credits for user ${userId}.`);
        try {
          // Atomic update: Mark processed AND add credits
          await db.runTransaction(async (t) => {
              const sessionRef = change.after.ref;
              const userRef = db.collection('artifacts').doc(APP_ID).collection('users').doc(userId);
              
              // Double check inside transaction to prevent race conditions
              const currentSession = await t.get(sessionRef);
              if (currentSession.data().creditsAdded) return;

              t.set(sessionRef, { creditsAdded: true }, { merge: true });
              t.set(userRef, {
                  credits: admin.firestore.FieldValue.increment(creditsToAdd),
                  paymentStatus: 'paid',
                  lastPaymentId: sessionId,
                  lastPaymentSource: 'checkout_session',
                  lastPaymentDate: admin.firestore.FieldValue.serverTimestamp()
              }, { merge: true });
          });

          console.log(`[monitorCheckoutSession] SUCCESS: Added ${creditsToAdd} credits to user ${userId}.`);
        } catch (error) {
          console.error('[monitorCheckoutSession] ERROR updating user credits:', error);
        }
      } else {
          console.warn(`[monitorCheckoutSession] Paid session found but creditsToAdd is 0 or invalid. Metadata:`, metadata);
      }
    } else {
        console.log(`[monitorCheckoutSession] Session ${sessionId} is not in a paid state yet.`);
    }
    return null;
  });

/**
 * Listener 2: Monitor Payments Collection
 * This triggers if the Stripe Extension writes to the 'payments' collection (PaymentIntents).
 * This serves as a backup or primary listener depending on extension configuration.
 */
exports.addCreditsOnPayment = functions.firestore
  .document('customers/{userId}/payments/{paymentId}')
  .onWrite(async (change, context) => {
    const userId = context.params.userId;
    const paymentId = context.params.paymentId;

    if (!change.after.exists) return null;

    const paymentData = change.after.data();
    
    // Detailed logging
    console.log(`[addCreditsOnPayment] Processing payment ${paymentId} for user ${userId}. Status: ${paymentData.status}`);

    // Avoid double processing immediately
    if (paymentData.creditsAdded) return null;

    const status = paymentData.status;
    const paymentStatus = paymentData.payment_status;
    
    // Check broadly for success statuses including 'succeeded'
    const isSuccess = 
        status === 'succeeded' || 
        status === 'paid' || 
        status === 'complete' || 
        paymentStatus === 'succeeded' || 
        paymentStatus === 'paid' || 
        paymentStatus === 'complete';
    
    if (isSuccess) {
       const metadata = paymentData.metadata || {};
       const creditsToAdd = parseInt(String(metadata.creditsToAdd || '0'), 10);

       console.log(`[addCreditsOnPayment] Successful payment detected. Credits to add: ${creditsToAdd}.`);

       // Removed strict check for metadata.type. 
       // If we have creditsToAdd in metadata, we should process it.
       if (creditsToAdd > 0) {
         try {
            await db.runTransaction(async (t) => {
                const paymentRef = change.after.ref;
                const userRef = db.collection('artifacts').doc(APP_ID).collection('users').doc(userId);
                
                const currentPayment = await t.get(paymentRef);
                if (currentPayment.data().creditsAdded) return;

                t.set(paymentRef, { creditsAdded: true }, { merge: true });
                t.set(userRef, {
                    credits: admin.firestore.FieldValue.increment(creditsToAdd),
                    paymentStatus: status || 'succeeded',
                    lastPaymentId: paymentId,
                    lastPaymentSource: 'payment_document',
                    lastPaymentDate: admin.firestore.FieldValue.serverTimestamp()
                }, { merge: true });
            });

            console.log(`[addCreditsOnPayment] SUCCESS: Added ${creditsToAdd} credits to user ${userId}.`);
         } catch (error) {
           console.error('[addCreditsOnPayment] ERROR updating user credits:', error);
         }
       } else {
           // Log if payment succeeded but no credits found (useful for debugging)
           console.log(`[addCreditsOnPayment] Payment succeeded but no creditsToAdd in metadata. ID: ${paymentId}, Metadata:`, metadata);
       }
    }
    
    return null;
  });
