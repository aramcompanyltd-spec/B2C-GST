const { onDocumentWritten } = require("firebase-functions/v2/firestore");
const { logger } = require("firebase-functions");
const admin = require("firebase-admin");

admin.initializeApp();
const db = admin.firestore();
const APP_ID = "default-app-id";

/**
 * Triggered when a document is written to the 'payments' subcollection
 * created by the "Run Payments with Stripe" Firebase Extension.
 */
exports.addCreditsOnPayment = onDocumentWritten(
  {
    document: "customers/{uid}/payments/{paymentId}",
    region: "australia-southeast1", // Ensure this matches your Firestore location
  },
  async (event) => {
    // Check if document was deleted
    if (!event.data.after.exists) {
      return null;
    }

    const { uid, paymentId } = event.params;
    const payment = event.data.after.data();

    // 1. Check payment status
    const status = payment.status;
    if (status !== "succeeded" && status !== "paid") {
      logger.info(`[Payment ${paymentId}] Status is '${status}'. Waiting for success.`);
      return null;
    }

    // 2. Idempotency Check: Prevent double-counting
    if (payment.credits_processed) {
      logger.info(`[Payment ${paymentId}] Already processed.`);
      return null;
    }

    // 3. Extract credit amount from metadata
    const metadata = payment.metadata || {};
    const creditsToAdd = parseInt(metadata.creditsToAdd || "0", 10);

    if (creditsToAdd <= 0) {
      logger.warn(`[Payment ${paymentId}] No valid creditsToAdd found in metadata.`);
      return null;
    }

    logger.info(`[Payment ${paymentId}] Adding ${creditsToAdd} credits to user ${uid}.`);

    const userRef = db.collection("artifacts").doc(APP_ID).collection("users").doc(uid);
    const paymentRef = event.data.after.ref;

    try {
      await db.runTransaction(async (transaction) => {
        const userDoc = await transaction.get(userRef);
        
        if (!userDoc.exists) {
          throw new Error(`User document for ${uid} not found.`);
        }

        const userData = userDoc.data();
        const currentCredits = userData.credits || 0;
        const newBalance = currentCredits + creditsToAdd;

        // Update user credits
        transaction.update(userRef, {
          credits: newBalance,
          lastPaymentId: paymentId,
          lastPaymentDate: admin.firestore.FieldValue.serverTimestamp(),
          paymentStatus: "paid",
        });

        // Mark payment as processed
        transaction.update(paymentRef, {
          credits_processed: true,
          processed_at: admin.firestore.FieldValue.serverTimestamp(),
        });
      });

      logger.info(`[Payment ${paymentId}] SUCCESS: Added ${creditsToAdd} credits.`);
    } catch (error) {
      logger.error(`[Payment ${paymentId}] Transaction failed:`, error);
    }

    return null;
  }
);