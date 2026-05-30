import * as admin from 'firebase-admin';

if (!admin.apps.length) {
  if (process.env.FIREBASE_PRIVATE_KEY) {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      }),
      storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
    });
  } else {
    console.warn("FIREBASE_PRIVATE_KEY is missing, admin functionality might be degraded");
    // Fallback if needed or initialize default
    admin.initializeApp();
  }
}

export const adminDb = admin.firestore();
export const adminAuth = admin.auth();
export const adminStorage = admin.storage();
