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
 * 
 * IMPORTANT: Must be deployed to australia-southeast1 region 
 * to match Firestore location
 */
exports.addCreditsOnPayment = functions
  .region('australia-southeast1')  // ← 리전 명시!
  .firestore
  .document('customers/{uid}/payments/{paymentId}')
  .onWrite(async (change, context) => {
    const payment = change.after.data();
    const paymentId = context.params.paymentId;
    const uid = context.params.uid;

    // 1. Check if document exists (it might have been deleted)
    if (!payment) {
      console.log(`[Payment ${paymentId}] Document deleted or doesn't exist.`);
      return null;
    }

    // 디버깅: 전체 payment 객체 로깅
    console.log(`[Payment ${paymentId}] Full payment data:`, JSON.stringify(payment, null, 2));

    // 2. Check for success status
    const status = payment.status;
    
    console.log(`[Payment ${paymentId}] Status field value: '${status}'`);
    
    if (status !== 'succeeded' && status !== 'paid') {
      console.log(`[Payment ${paymentId}] Status is '${status}'. Not a successful payment. Waiting for success.`);
      return null;
    }

    // 3. Idempotency Check: Prevent double-counting credits
    if (payment.credits_processed) {
      console.log(`[Payment ${paymentId}] Already processed at ${payment.processed_at}.`);
      return null;
    }

    // 4. Extract credits from metadata
    const metadata = payment.metadata || {};
    
    console.log(`[Payment ${paymentId}] Metadata:`, JSON.stringify(metadata, null, 2));
    
    const creditsToAdd = parseInt(metadata.creditsToAdd || '0', 10);

    if (creditsToAdd <= 0) {
      console.log(`[Payment ${paymentId}] No valid credits to add found in metadata. Value: ${metadata.creditsToAdd}`);
      return null;
    }

    console.log(`[Payment ${paymentId}] Processing top-up for User ${uid}. Adding ${creditsToAdd} credits.`);

    // 사용자 문서 경로 확인
    const userRef = db.collection('artifacts').doc(APP_ID).collection('users').doc(uid);
    const paymentRef = change.after.ref;

    console.log(`[Payment ${paymentId}] User document path: ${userRef.path}`);

    try {
      // Run as a transaction to ensure atomic updates
      await db.runTransaction(async (transaction) => {
        const userDoc = await transaction.get(userRef);
        
        if (!userDoc.exists) {
          console.error(`[Payment ${paymentId}] User document for ${uid} not found at path: ${userRef.path}`);
          throw new Error(`User document for ${uid} not found.`);
        }

        const userData = userDoc.data();
        const currentCredits = userData.credits || 0;
        const newBalance = currentCredits + creditsToAdd;

        console.log(`[Payment ${paymentId}] Current credits: ${currentCredits}, Adding: ${creditsToAdd}, New balance: ${newBalance}`);

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

      console.log(`[Payment ${paymentId}] ✅ SUCCESS! Added ${creditsToAdd} credits to user ${uid}. Transaction completed.`);

    } catch (error) {
      console.error(`[Payment ${paymentId}] ❌ Transaction failed:`, error);
      console.error(`[Payment ${paymentId}] Error stack:`, error.stack);
    }
    
    return null;
  });