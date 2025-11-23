const functions = require('firebase-functions');
const admin = require('firebase-admin');

if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();
const APP_ID = 'default-app-id'; // 반드시 Firestore 구조와 동일해야 함

/**
 * Listener 1: Monitor Checkout Sessions
 * Triggered when Stripe updates a checkout session
 * (PDF Page 1-2 Logic)
 */
exports.monitorCheckoutSession = functions.firestore
  .document('customers/{stripeCustomerId}/checkout_sessions/{sessionId}')
  .onWrite(async (change, context) => {
    const { stripeCustomerId, sessionId } = context.params;

    if (!change.after.exists) {
      console.log(`[monitorCheckoutSession] Deleted session: ${sessionId}`);
      return null;
    }

    const sessionData = change.after.data();

    // prevent double processing
    if (sessionData.creditsAdded) return null;

    const status = sessionData.status;
    const paymentStatus = sessionData.payment_status;

    const isPaid =
      status === 'complete' ||
      status === 'succeeded' ||
      paymentStatus === 'paid' ||
      paymentStatus === 'succeeded';

    console.log(`[monitorCheckoutSession] Session ${sessionId} | Paid: ${isPaid}`);

    if (!isPaid) return null;

    const metadata = sessionData.metadata || {};
    const creditsToAdd = Number(metadata.creditsToAdd || 0);

    // ------- ★ 가장 중요한 부분: Firebase UID 매핑 --------
    const firebaseUid =
      metadata.firebase_uid ||
      metadata.userId || // ← 당신이 넣은 key
      stripeCustomerId; // fallback (거의 쓰지 않음)

    console.log(`[monitorCheckoutSession] creditsToAdd=${creditsToAdd}, targetUid=${firebaseUid}`);

    if (creditsToAdd <= 0) {
      console.warn(`[monitorCheckoutSession] Invalid creditsToAdd`);
      return null;
    }

    const userRef = db
      .collection('artifacts')
      .doc(APP_ID)
      .collection('users')
      .doc(firebaseUid);

    const sessionRef = change.after.ref;

    console.log(`[monitorCheckoutSession] Updating User Path: ${userRef.path}`);

    try {
      await db.runTransaction(async (t) => {
        const freshSession = await t.get(sessionRef);
        if (freshSession.data().creditsAdded) return;

        const userDoc = await t.get(userRef);
        if (!userDoc.exists) {
          throw new Error(`User document NOT FOUND: ${userRef.path}`);
        }

        const userData = userDoc.data();
        const currentCredits =
          typeof userData.credits === 'number' ? userData.credits : 0;
        
        const newCredits = currentCredits + creditsToAdd;

        console.log(`[monitorCheckoutSession] Credits: ${currentCredits} → ${newCredits}`);

        t.update(userRef, {
          credits: newCredits,
          lastPaymentId: sessionId,
          lastPaymentSource: 'checkout_session',
          paymentStatus: 'paid',
          lastPaymentDate: admin.firestore.FieldValue.serverTimestamp(),
        });

        t.update(sessionRef, { creditsAdded: true });
      });

      console.log(`[monitorCheckoutSession] SUCCESS`);
    } catch (err) {
      console.error(`[monitorCheckoutSession] ERROR: ${err.message}`);
    }

    return null;
  });

/**
 * Listener 2: Backup — payments collection (Stripe extension)
 * Triggered when a payment document is written
 * (PDF Page 3-4 Logic with User's specific fix for 'price.status')
 */
exports.addCreditsOnPayment = functions.firestore
  .document('customers/{stripeCustomerId}/payments/{paymentId}')
  .onWrite(async (change, context) => {
    const { stripeCustomerId, paymentId } = context.params;

    if (!change.after.exists) return null;

    const payment = change.after.data();

    if (payment.creditsAdded) return null;

    // FIX: User requested to check status under 'price' object in Firestore
    // payment.price.status 값을 우선 확인하고, 없으면 payment.status 확인
    const status = (payment.price && payment.price.status) ? payment.price.status : payment.status;

    const isSuccess =
      status === 'succeeded' ||
      status === 'paid' ||
      status === 'complete';

    if (!isSuccess) return null;

    const metadata = payment.metadata || {};
    const creditsToAdd = Number(metadata.creditsToAdd || 0);

    const firebaseUid =
      metadata.firebase_uid ||
      metadata.userId ||
      stripeCustomerId;

    console.log(`[addCreditsOnPayment] Payment ${paymentId}, credits=${creditsToAdd}, uid=${firebaseUid}`);

    if (creditsToAdd <= 0) return null;

    const userRef = db
      .collection('artifacts')
      .doc(APP_ID)
      .collection('users')
      .doc(firebaseUid);

    const paymentRef = change.after.ref;

    try {
      await db.runTransaction(async (t) => {
        const freshPayment = await t.get(paymentRef);
        if (freshPayment.data().creditsAdded) return;

        const userDoc = await t.get(userRef);
        if (!userDoc.exists) {
          console.error(`[addCreditsOnPayment] User not found at ${userRef.path}`);
          return;
        }

        const userData = userDoc.data();
        const currentCredits = userData.credits || 0;

        t.update(userRef, {
          credits: currentCredits + creditsToAdd,
          paymentStatus: status,
          lastPaymentId: paymentId,
          lastPaymentSource: 'payment_doc',
          lastPaymentDate: admin.firestore.FieldValue.serverTimestamp(),
        });

        t.update(paymentRef, { creditsAdded: true });
      });
      console.log(`[addCreditsOnPayment] SUCCESS`);
    } catch (err) {
      console.error(`[addCreditsOnPayment] ERROR: ${err.message}`);
    }

    return null;
  });