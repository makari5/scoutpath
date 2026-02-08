import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);

// Firebase Admin SDK configuration
export function initializeFirebaseAdmin() {
  // Check if Firebase Admin is already initialized
  if (getApps().length > 0) {
    return getApps()[0];
  }

  try {
    // 1. Try to load serviceAccountKey.json directly (Priority)
    try {
      console.log('🔍 Attempting to load serviceAccountKey.json...');
      const serviceAccount = require('./serviceAccountKey.json');
      
      const app = initializeApp({
        credential: cert(serviceAccount),
        projectId: serviceAccount.project_id,
      });

      console.log('✅ Firebase Admin SDK initialized with serviceAccountKey.json');
      return app;
    } catch (err) {
      console.log('⚠️ serviceAccountKey.json not found or invalid, trying environment variable...');
    }

    // 2. Check for Firebase service account from environment variable (Fallback)
    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
      console.log('🔑 Using Service Account from Environment Variable');

      let serviceAccount;
      try {
        serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
      } catch (e) {
        console.error('❌ Failed to parse FIREBASE_SERVICE_ACCOUNT.');
        // Return null instead of throwing to prevent cold start crash
        return null; 
      }

      const app = initializeApp({
        credential: cert(serviceAccount),
        projectId: serviceAccount.project_id,
      });

      console.log('✅ Firebase Admin SDK initialized with Environment Variable');
      return app;
    }

    // 3. Fallback to project ID only (Development/Test)
    console.log('⚠️ No Service Account found, using Project ID only');

    const projectId =
      process.env.FIREBASE_PROJECT_ID ||
      process.env.VITE_FIREBASE_PROJECT_ID ||
      'bibleverseapp-d43ac';

    const app = initializeApp({
      projectId: projectId,
    });

    console.log(`✅ Firebase Admin SDK initialized with Project ID: ${projectId}`);
    return app;
  } catch (error) {
    console.error('❌ Error initializing Firebase Admin SDK:', error);
    return null;
  }
}
