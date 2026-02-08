import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { createRequire } from 'module';
import { readFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

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
      console.log('⚠️ serviceAccountKey.json not found, checking for encoded secret...');
    }

    // 1.5 Try to load firebase-secret.b64 (Base64 Encoded Fallback for GitHub)
    try {
      console.log('🔍 Checking for firebase-secret.b64...');
      console.log('📂 Current Working Directory:', process.cwd());
      
      const potentialPaths = [
        resolve(dirname(fileURLToPath(import.meta.url)), 'firebase-secret.b64'), // Relative to this file
        resolve(process.cwd(), 'server', 'firebase-secret.b64'),             // Relative to project root
        resolve(process.cwd(), 'firebase-secret.b64'),                       // If flattened
      ];

      let foundPath = null;
      for (const p of potentialPaths) {
        if (existsSync(p)) {
          foundPath = p;
          break;
        }
      }

      if (foundPath) {
        console.log(`✅ Found secret file at: ${foundPath}`);
        const b64Content = readFileSync(foundPath, 'utf-8');
        const jsonContent = Buffer.from(b64Content, 'base64').toString('utf-8');
        const serviceAccount = JSON.parse(jsonContent);

        const app = initializeApp({
          credential: cert(serviceAccount),
          projectId: serviceAccount.project_id,
        });

        console.log('✅ Firebase Admin SDK initialized with Decoded Secret');
        return app;
      } else {
        console.warn('⚠️ firebase-secret.b64 not found in any expected location:', potentialPaths);
      }
    } catch (err) {
      console.error('⚠️ Failed to load/decode firebase-secret.b64:', err);
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
