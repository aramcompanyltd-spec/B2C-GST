
const functions = require('firebase-functions');
const admin = require('firebase-admin');

admin.initializeApp();

// Listens for new payment documents created by the "Run Payments with Stripe" extension
// and increments the user's credit balance based on the metadata.
exports.addCreditsOnPayment = functions.firestore
  .document('customers/{userId}/payments/{paymentId}')
  .onCreate(async (snapshot, context) => {
    const userId = context.params.userId;
    const paymentData = snapshot.data();

    // Check if payment status is succeeded
    if (paymentData.status === 'succeeded' || paymentData.status === 'paid') {
      // The extension creates the payment document from the Payment Intent.
      // We must ensure the frontend sends the creditsToAdd metadata in 'payment_intent_data'.
      const metadata = paymentData.metadata || {};
      
      if (metadata.type === 'credit_topup' && metadata.creditsToAdd) {
        const creditsToAdd = parseInt(metadata.creditsToAdd, 10);
        
        if (!isNaN(creditsToAdd) && creditsToAdd > 0) {
            // Update user credits in the artifacts collection
            // NOTE: The appId here ('default-app-id') must match what is used in services/firebase.ts
            const userRef = admin.firestore()
                .collection('artifacts')
                .doc('default-app-id')
                .collection('users')
                .doc(userId);

            await userRef.set({
                credits: admin.firestore.FieldValue.increment(creditsToAdd)
            }, { merge: true });
            
            console.log(`Added ${creditsToAdd} credits to user ${userId} from payment ${context.params.paymentId}`);
        } else {
            console.warn(`Invalid credit amount in metadata for user ${userId}`);
        }
      }
    }
  });
