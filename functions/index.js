
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
        return null;
    }

    const sessionData = change.after.data();
    
    // Check strictly for processed flag to ensure idempotency
    if (sessionData.creditsAdded) {
        return null;
    }

    console.log(`[monitorCheckoutSession] Session ID: ${sessionId}, Status: ${sessionData.status}, PaymentStatus: ${sessionData.payment_status}`);

    // Broad success check
    const status = sessionData.status;
    const paymentStatus = sessionData.payment_status;
    
    const isPaid = 
        status === 'complete' || 
        status === 'succeeded' || 
        paymentStatus === 'paid' || 
        paymentStatus === 'succeeded';

    if (isPaid) {
      const metadata = sessionData.metadata || {};
      const creditsToAdd = parseInt(String(metadata.creditsToAdd || '0'), 10);
      const type = metadata.type;
      
      console.log(`[monitorCheckoutSession] Payment confirmed. Processing ${creditsToAdd} credits for user ${userId}.`);

      if (type === 'credit_topup' && creditsToAdd > 0) {
        try {
          // Atomic update: Mark processed AND add credits
          await db.runTransaction(async (t) => {
              const sessionRef = change.after.ref;
              const userRef = db.collection('artifacts').doc(APP_ID).collection('users').doc(userId);
              
              // Double check inside transaction
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
      }
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
    
    // Avoid double processing
    if (paymentData.creditsAdded) return null;

    console.log(`[addCreditsOnPayment] Payment ID: ${paymentId}, Status: ${paymentData.status}, PaymentStatus: ${paymentData.payment_status}`);

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
       const type = metadata.type;

       if (type === 'credit_topup' && creditsToAdd > 0) {
         console.log(`[addCreditsOnPayment] Success payment found for ${paymentId}. Credits: ${creditsToAdd}`);
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
       }
    }
    
    return null;
  });
