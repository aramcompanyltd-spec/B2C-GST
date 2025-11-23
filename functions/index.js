
const functions = require('firebase-functions');
const admin = require('firebase-admin');

if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();
// Ensure this APP_ID matches the 'appId' in services/firebase.ts exactly.
const APP_ID = 'default-app-id'; 

/**
 * Listener 1: Monitor Checkout Sessions
 * Triggers when Stripe updates the session status (e.g. to 'complete').
 */
exports.monitorCheckoutSession = functions.firestore
  .document('customers/{userId}/checkout_sessions/{sessionId}')
  .onWrite(async (change, context) => {
    const { userId, sessionId } = context.params;

    // Exit if document is deleted
    if (!change.after.exists) {
        console.log(`[monitorCheckoutSession] Document deleted: ${sessionId}`);
        return null;
    }

    const sessionData = change.after.data();
    
    // Check if already processed to prevent duplicate credits
    if (sessionData.creditsAdded) {
        return null;
    }

    const status = sessionData.status;
    const paymentStatus = sessionData.payment_status;
    
    const isPaid = 
        status === 'complete' || 
        status === 'succeeded' || 
        paymentStatus === 'paid' || 
        paymentStatus === 'succeeded';

    // Log trigger details
    console.log(`[monitorCheckoutSession] Processing Session: ${sessionId} | User: ${userId}`);
    console.log(`[monitorCheckoutSession] Status: ${status} | PaymentStatus: ${paymentStatus} | Paid Detected: ${isPaid}`);

    if (isPaid) {
      const metadata = sessionData.metadata || {};
      const creditsToAdd = Number(metadata.creditsToAdd || 0);

      console.log(`[monitorCheckoutSession] Metadata Credits: ${metadata.creditsToAdd} | Parsed: ${creditsToAdd}`);

      if (creditsToAdd > 0) {
        const userRef = db.collection('artifacts').doc(APP_ID).collection('users').doc(userId);
        const sessionRef = change.after.ref;

        console.log(`[monitorCheckoutSession] Target User Path: ${userRef.path}`);

        try {
          await db.runTransaction(async (t) => {
              // 1. Check session idempotency again inside transaction
              const freshSession = await t.get(sessionRef);
              if (freshSession.data().creditsAdded) {
                  console.log('[monitorCheckoutSession] Transaction aborted: Already processed.');
                  return;
              }

              // 2. Read User Document explicitly to ensure it exists
              const userDoc = await t.get(userRef);
              if (!userDoc.exists) {
                  // CRITICAL DEBUG: If this throws, the path is wrong or user wasn't created properly.
                  throw new Error(`User document NOT FOUND at: ${userRef.path}. Cannot add credits.`);
              }

              const userData = userDoc.data();
              const currentCredits = typeof userData.credits === 'number' ? userData.credits : 0;
              const newCredits = currentCredits + creditsToAdd;

              console.log(`[monitorCheckoutSession] User Found. Current: ${currentCredits} -> New: ${newCredits}`);

              // 3. Update User Credits
              t.update(userRef, {
                  credits: newCredits,
                  paymentStatus: 'paid',
                  lastPaymentId: sessionId,
                  lastPaymentSource: 'checkout_session',
                  lastPaymentDate: admin.firestore.FieldValue.serverTimestamp()
              });

              // 4. Mark session as processed
              t.update(sessionRef, { creditsAdded: true });
          });

          console.log(`[monitorCheckoutSession] SUCCESS: Transaction committed. Credits updated.`);
        } catch (error) {
          console.error('[monitorCheckoutSession] TRANSACTION FAILED:', error.message);
          // We do not throw here to prevent infinite retry loops if it's a logic error (like missing doc)
        }
      } else {
          console.warn(`[monitorCheckoutSession] Paid session found but creditsToAdd is invalid: ${creditsToAdd}`);
      }
    }
    return null;
  });

/**
 * Listener 2: Backup for 'payments' collection updates
 */
exports.addCreditsOnPayment = functions.firestore
  .document('customers/{userId}/payments/{paymentId}')
  .onWrite(async (change, context) => {
    const { userId, paymentId } = context.params;

    if (!change.after.exists) return null;

    const paymentData = change.after.data();
    const status = paymentData.status;
    
    if (paymentData.creditsAdded) return null;

    const isSuccess = status === 'succeeded' || status === 'paid' || status === 'complete';
        
    if (isSuccess) {
        const creditsToAdd = Number(paymentData.metadata?.creditsToAdd || 0);
        if (creditsToAdd > 0) {
            console.log(`[addCreditsOnPayment] Processing Payment: ${paymentId} | User: ${userId} | Credits: ${creditsToAdd}`);
            const userRef = db.collection('artifacts').doc(APP_ID).collection('users').doc(userId);
            const paymentRef = change.after.ref;

            try {
                await db.runTransaction(async (t) => {
                    const currentPayment = await t.get(paymentRef);
                    if (currentPayment.data().creditsAdded) return;

                    const userDoc = await t.get(userRef);
                    if (!userDoc.exists) {
                         console.error(`[addCreditsOnPayment] User doc missing at ${userRef.path}`);
                         return;
                    }

                    const currentCredits = userDoc.data().credits || 0;
                    
                    t.update(userRef, {
                        credits: currentCredits + creditsToAdd,
                        paymentStatus: status,
                        lastPaymentId: paymentId,
                        lastPaymentSource: 'payment_doc',
                        lastPaymentDate: admin.firestore.FieldValue.serverTimestamp()
                    });
                    t.update(paymentRef, { creditsAdded: true });
                });
                console.log(`[addCreditsOnPayment] Success.`);
            } catch (error) {
                console.error('[addCreditsOnPayment] Error:', error);
            }
        }
    }
    return null;
  });
