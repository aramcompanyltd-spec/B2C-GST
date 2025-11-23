const functions = require("firebase-functions");
const admin = require("firebase-admin");

if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

// ⚠️ 반드시 artifacts 컬렉션 구조에 맞게 설정하세요
const APP_ID = "default-app-id";  // ← 당신의 프론트 코드에서 사용하는 appId

/**
 * ============================================================================
 *  MAIN FUNCTION: Add credits when Stripe Payment succeeds
 * ============================================================================
 *
 * Trigger: Firestore → customers/{userId}/payments/{paymentId}
 * Stripe Extension writes a payment document here AFTER real Stripe payment.
 *
 * Advantage:
 *  - PaymentIntent.metadata is ALWAYS present (Checkout Session metadata isn't)
 *  - status=succeeded is the most reliable completion signal
 *  - Stripe Extension guarantees this doc is written AFTER payment clears
 * ============================================================================
 */

exports.addCreditsOnPayment = functions.firestore
  .document("customers/{userId}/payments/{paymentId}")
  .onWrite(async (change, context) => {
    const { userId, paymentId } = context.params;

    // Document deleted → nothing to do
    if (!change.after.exists) return null;

    const payment = change.after.data();
    const status = payment.status;

    functions.logger.info(
      `[addCreditsOnPayment] Triggered for payment ${paymentId} | Status: ${status}`
    );

    // Avoid duplicate processing
    if (payment.creditsAdded === true) {
      functions.logger.warn(
        `[addCreditsOnPayment] Payment ${paymentId} already processed. Skipping.`
      );
      return null;
    }

    // Only process successful payments
    const isSuccess =
      status === "succeeded" || status === "complete" || status === "paid";

    if (!isSuccess) {
      functions.logger.warn(
        `[addCreditsOnPayment] Payment not successful → status = ${status}`
      );
      return null;
    }

    // Read metadata
    const metadata = payment.metadata || {};

    const creditsToAdd = Number(metadata.creditsToAdd || 0);
    const targetUserId =
      metadata.userId || metadata.firebase_uid || userId;

    functions.logger.info(
      `[addCreditsOnPayment] Metadata: User=${targetUserId}, credits=${creditsToAdd}`
    );

    if (!targetUserId) {
      functions.logger.error(
        `[addCreditsOnPayment] No userId provided in metadata. Cannot continue.`
      );
      return null;
    }

    if (creditsToAdd <= 0) {
      functions.logger.error(
        `[addCreditsOnPayment] creditsToAdd is invalid: ${creditsToAdd}`
      );
      return null;
    }

    const userRef = db
      .collection("artifacts")
      .doc(APP_ID)
      .collection("users")
      .doc(targetUserId);

    const paymentRef = change.after.ref;

    // Perform atomic update using Firestore transaction
    try {
      await db.runTransaction(async (t) => {
        const freshPayment = await t.get(paymentRef);

        // Double-check for idempotency AGAIN inside transaction
        if (freshPayment.data().creditsAdded) {
          functions.logger.warn(
            `[addCreditsOnPayment] Transaction skip → Already processed.`
          );
          return;
        }

        const userDoc = await t.get(userRef);

        if (!userDoc.exists) {
          throw new Error(
            `User document not found at ${userRef.path}. Cannot credit user.`
          );
        }

        const currentCredits = Number(userDoc.data().credits || 0);
        const newCredits = currentCredits + creditsToAdd;

        functions.logger.info(
          `[addCreditsOnPayment] Updating credits: ${currentCredits} → ${newCredits}`
        );

        // Update user credits
        t.update(userRef, {
          credits: newCredits,
          lastPaymentId: paymentId,
          lastPaymentSource: "stripe_payment",
          lastPaymentDate: admin.firestore.FieldValue.serverTimestamp(),
          paymentStatus: status,
        });

        // Mark payment doc as processed
        t.update(paymentRef, { creditsAdded: true });
      });

      functions.logger.info(
        `[addCreditsOnPayment] SUCCESS → Credits added to user ${targetUserId}`
      );
    } catch (err) {
      functions.logger.error(
        `[addCreditsOnPayment] ERROR during transaction: ${err.message}`
      );
    }

    return null;
  });
