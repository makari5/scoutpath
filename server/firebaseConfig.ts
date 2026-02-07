import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { readFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

// Firebase Admin SDK configuration
export function initializeFirebaseAdmin() {
  // Check if Firebase Admin is already initialized
  if (getApps().length > 0) {
    return getApps()[0];
  }

  try {
    // Check for Firebase service account from environment variable (for Render)
    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
      console.log('ðŸ”‘ Using Service Account from Environment Variable (Production)');

      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);

      const app = initializeApp({
        credential: cert(serviceAccount),
        projectId: serviceAccount.project_id,
      });

      console.log('ðŸ”¥ Firebase Admin SDK initialized with Environment Variable Service Account');
      return app;
    }

    // Check for service account key file (for local development)
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = dirname(__filename);
    const serviceAccountPath = resolve(__dirname, 'serviceAccountKey.json');
    const serviceAccountFallback = resolve(process.cwd(), 'server', 'serviceAccountKey.json');

    if (existsSync(serviceAccountPath) || existsSync(serviceAccountFallback)) {
      console.log('ðŸ”‘ Using Service Account Key File (Local Development)');

      const fileToRead = existsSync(serviceAccountPath) ? serviceAccountPath : serviceAccountFallback;
      const serviceAccount = JSON.parse(readFileSync(fileToRead, 'utf8'));

      const app = initializeApp({
        credential: cert(serviceAccount),
        projectId: serviceAccount.project_id,
      });

      console.log('ðŸ”¥ Firebase Admin SDK initialized with Service Account Key File');
      return app;
    }

    // Fallback to project ID only
    console.log('âš ï¸ No Service Account found, using Project ID only');

    const projectId =
      process.env.FIREBASE_PROJECT_ID ||
      process.env.VITE_FIREBASE_PROJECT_ID ||
      'bibleverseapp-d43ac';

    const app = initializeApp({
      projectId: projectId,
    });

    console.log(`ðŸ”¥ Firebase Admin SDK initialized with Project ID: ${projectId}`);
    return app;
  } catch (error) {
    console.error('âŒ Error initializing Firebase Admin SDK:', error);
    throw error;
  }
}
