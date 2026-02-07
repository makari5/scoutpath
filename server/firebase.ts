import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import type { User } from '@shared/schema';
import { initializeFirebaseAdmin } from './firebaseConfig';

// Initialize Firebase Admin SDK
const app = initializeFirebaseAdmin();
export const db = getFirestore(app);

// Firestore service functions
export class FirestoreUserService {
  private static collection = db.collection('users');

  // Find user by serial number (barcode)
  static async findBySerial(serial: string): Promise<User | null> {
    try {
      console.log(`🔍 Searching for user with serial: ${serial}`);
      
      const querySnapshot = await this.collection.where('serial', '==', serial).get();
      
      if (querySnapshot.empty) {
        console.log(`❌ No user found with serial: ${serial}`);
        return null;
      }

      // Log all found users to check for duplicates
      console.log(`📋 Found ${querySnapshot.docs.length} user(s) with serial ${serial}:`);
      querySnapshot.docs.forEach((doc, index) => {
        const data = doc.data();
        console.log(`  ${index + 1}. ID: ${doc.id}, Name: ${data.name}, Stage: ${data.currentStage}`);
      });

      const docs = querySnapshot.docs;
      const bestDoc = docs
        .map((d) => {
          const data = d.data() as any;
          const completedLen = Array.isArray(data?.progress?.completedExams) ? data.progress.completedExams.length : 0;
          const stage = typeof data?.currentStage === 'number' ? data.currentStage : 0;
          return { d, stage, completedLen };
        })
        .sort((a, b) => {
          if (b.stage !== a.stage) return b.stage - a.stage;
          return b.completedLen - a.completedLen;
        })[0]?.d;

      const doc = bestDoc ?? docs[0];
      const userData = doc.data();
      
      const user = {
        id: doc.id,
        name: userData.name,
        serial: userData.serial,
        currentStage: userData.currentStage,
        progress: userData.progress || {
          openedCourses: [],
          completedExams: [],
          scores: [],
        },
        trainingProgress: userData.trainingProgress || {
          courses: {},
          completedCourses: [],
        },
      };

      console.log(`✅ Returning user: ${user.name} (Stage: ${user.currentStage})`);
      return user;
    } catch (error) {
      console.error('Error finding user by serial:', error);
      throw error;
    }
  }

  // Find user by ID
  static async findById(id: string): Promise<User | null> {
    try {
      const doc = await this.collection.doc(id).get();
      
      if (!doc.exists) {
        return null;
      }

      const userData = doc.data()!;
      
      return {
        id: doc.id,
        name: userData.name,
        serial: userData.serial,
        currentStage: userData.currentStage,
        progress: userData.progress || {
          openedCourses: [],
          completedExams: [],
          scores: [],
        },
        trainingProgress: userData.trainingProgress || {
          courses: {},
          completedCourses: [],
        },
      };
    } catch (error) {
      console.error('Error finding user by ID:', error);
      throw error;
    }
  }

  // Update user progress
  static async updateProgress(
    id: string, 
    updates: {
      openedCourses?: number[];
      completedExams?: number[];
      scores?: number[];
    }
  ): Promise<User | null> {
    try {
      const userRef = this.collection.doc(id);
      const doc = await userRef.get();
      
      if (!doc.exists) {
        return null;
      }

      const userData = doc.data() as any;
      const existingProgress = userData?.progress ?? {
        openedCourses: [],
        completedExams: [],
        scores: [],
      };

      const normalizeNumberArray = (arr: unknown): number[] =>
        Array.from(new Set((Array.isArray(arr) ? arr : []).filter((n) => typeof n === 'number'))).sort((a, b) => a - b);

      const mergedOpenedCourses = normalizeNumberArray([
        ...normalizeNumberArray(existingProgress?.openedCourses),
        ...normalizeNumberArray(updates.openedCourses),
      ]);

      const mergedCompletedExams = normalizeNumberArray([
        ...normalizeNumberArray(existingProgress?.completedExams),
        ...normalizeNumberArray(updates.completedExams),
      ]);

      const computeCurrentStage = (completed: number[]): number => {
        const set = new Set(completed);
        let k = 0;
        while (set.has(k + 1)) k++;
        if (k >= 8) return 8;
        if (k === 7) return 7.5;
        return k === 0 ? 1 : k + 1;
      };

      const proposedStage = computeCurrentStage(mergedCompletedExams);
      const existingStage = typeof userData?.currentStage === 'number' ? userData.currentStage : 1;
      const safeStage = Math.max(existingStage, proposedStage);

      const updateData: any = {
        'progress.openedCourses': mergedOpenedCourses,
        'progress.completedExams': mergedCompletedExams,
        currentStage: safeStage,
      };

      if (updates.scores) {
        const existingScores = Array.isArray(existingProgress?.scores) ? existingProgress.scores : [];
        const incomingScores = Array.isArray(updates.scores) ? updates.scores : [];
        updateData['progress.scores'] = incomingScores.length >= existingScores.length ? incomingScores : existingScores;
      }

      await userRef.update(updateData);
      
      // Return updated user
      return await this.findById(id);
    } catch (error) {
      console.error('Error updating user progress:', error);
      throw error;
    }
  }

  // Clear legacy progress fields (used by the old system)
  static async clearLegacyProgress(id: string): Promise<User | null> {
    try {
      const userRef = this.collection.doc(id);
      const doc = await userRef.get();
      if (!doc.exists) return null;

      await userRef.update({
        progress: FieldValue.delete(),
      });

      return await this.findById(id);
    } catch (error) {
      console.error('Error clearing legacy progress:', error);
      throw error;
    }
  }

  // Update new training progress (parts-based)
  static async updateTrainingProgress(
    id: string,
    updates: {
      courseId: number;
      startedAt?: number;
      readParts?: number[];
      passedParts?: number[];
      completedAt?: number;
    }
  ): Promise<User | null> {
    try {
      const userRef = this.collection.doc(id);
      const doc = await userRef.get();

      if (!doc.exists) {
        return null;
      }

      const userData = doc.data() as any;
      const courseKey = String(updates.courseId);
      const existingTraining = userData?.trainingProgress ?? { courses: {}, completedCourses: [] };
      const existingCourse = existingTraining?.courses?.[courseKey] ?? {};

      const normalize = (arr: unknown): number[] =>
        Array.from(new Set((Array.isArray(arr) ? arr : []).filter((n) => typeof n === 'number'))).sort(
          (a, b) => a - b
        );

      const mergedRead = updates.readParts
        ? normalize([...(existingCourse.readParts ?? []), ...updates.readParts])
        : normalize(existingCourse.readParts ?? []);

      const mergedPassed = updates.passedParts
        ? normalize([...(existingCourse.passedParts ?? []), ...updates.passedParts])
        : normalize(existingCourse.passedParts ?? []);

      const startedAt = typeof updates.startedAt === 'number' ? updates.startedAt : existingCourse.startedAt;
      const completedAt = typeof updates.completedAt === 'number' ? updates.completedAt : existingCourse.completedAt;

      const completedCourses = normalize(existingTraining.completedCourses ?? []);
      if (typeof completedAt === 'number' && !completedCourses.includes(updates.courseId)) {
        completedCourses.push(updates.courseId);
        completedCourses.sort((a, b) => a - b);
      }

      const existingStage = typeof userData?.currentStage === 'number' ? userData.currentStage : 1;
      const nextStage = completedCourses.includes(updates.courseId)
        ? Math.min(updates.courseId + 1, 8)
        : existingStage;
      const safeStage = Math.max(existingStage, nextStage);

      const updateData: any = {
        [`trainingProgress.courses.${courseKey}`]: {
          startedAt,
          readParts: mergedRead,
          passedParts: mergedPassed,
          ...(typeof completedAt === 'number' ? { completedAt } : {}),
        },
        'trainingProgress.completedCourses': completedCourses,
        currentStage: safeStage,
      };

      await userRef.update(updateData);
      return await this.findById(id);
    } catch (error) {
      console.error('Error updating training progress:', error);
      throw error;
    }
  }

  // Utility function to clean up duplicate users (use with caution)
  static async cleanupDuplicateUsers(): Promise<void> {
    try {
      console.log('🧹 Starting cleanup of duplicate users...');
      
      const querySnapshot = await this.collection.get();
      const usersBySerial = new Map<string, any[]>();
      
      // Group users by serial number
      querySnapshot.docs.forEach(doc => {
        const data = doc.data();
        const serial = data.serial;
        
        if (!usersBySerial.has(serial)) {
          usersBySerial.set(serial, []);
        }
        
        usersBySerial.get(serial)!.push({
          id: doc.id,
          data: data,
          ref: doc.ref
        });
      });
      
      // Find and log duplicates
      for (const [serial, users] of Array.from(usersBySerial.entries())) {
        if (users.length > 1) {
          console.log(`🔍 Found ${users.length} users with serial ${serial}:`);
          users.forEach((user: any, index: number) => {
            console.log(`  ${index + 1}. ID: ${user.id}, Name: ${user.data.name}, Stage: ${user.data.currentStage}`);
          });
          
          // Keep the first user, delete the rest
          for (let i = 1; i < users.length; i++) {
            console.log(`🗑️ Deleting duplicate user: ${users[i].data.name} (${users[i].id})`);
            await users[i].ref.delete();
          }
        }
      }
      
      console.log('✅ Cleanup completed');
    } catch (error) {
      console.error('Error cleaning up duplicate users:', error);
      throw error;
    }
  }

  // Fix demo user IDs by recreating them with proper Firestore IDs
  static async fixDemoUserIds(): Promise<void> {
    try {
      console.log('🔧 Starting to fix demo user IDs...');
      
      // Get all users with demo IDs
      const querySnapshot = await this.collection.get();
      const usersToFix: any[] = [];
      
      querySnapshot.docs.forEach(doc => {
        if (doc.id.startsWith('demo-user')) {
          const data = doc.data();
          usersToFix.push({
            oldId: doc.id,
            data: data,
            ref: doc.ref
          });
          console.log(`🔍 Found demo user: ${doc.id} - ${data.name} (${data.serial})`);
        }
      });
      
      if (usersToFix.length === 0) {
        console.log('✅ No demo users found to fix');
        return;
      }
      
      // Recreate users with proper IDs
      for (const user of usersToFix) {
        console.log(`🔄 Recreating user: ${user.data.name} (${user.data.serial})`);
        
        // Add new document (Firestore will generate proper ID)
        const newDoc = await this.collection.add({
          name: user.data.name,
          serial: user.data.serial,
          currentStage: user.data.currentStage,
          progress: user.data.progress || {
            openedCourses: [],
            completedExams: [],
            scores: [],
          }
        });
        
        console.log(`✅ Created new user with ID: ${newDoc.id}`);
        
        // Delete old demo user
        await user.ref.delete();
        console.log(`🗑️ Deleted old demo user: ${user.oldId}`);
      }
      
      console.log('🎉 All demo user IDs fixed successfully!');
    } catch (error) {
      console.error('Error fixing demo user IDs:', error);
      throw error;
    }
  }

  // Update user progress and achievements
  static async updateUserAchievements(userId: string, completedCourses: number[]): Promise<User | null> {
    try {
      console.log(`🎯 Updating achievements for user: ${userId}`);
      
      const userRef = this.collection.doc(userId);
      const doc = await userRef.get();
      
      if (!doc.exists) {
        return null;
      }

      // Calculate achievements based on completed courses
      const completedExams = completedCourses;
      const scores = completedCourses.map(() => Math.floor(Math.random() * 30) + 70); // Random scores between 70-100
      const certificates = completedCourses.length; // Same as completed courses
      
      // Update current stage based on completed courses
      const completedCount = completedCourses.length;
      const currentStage =
        completedCount >= 8
          ? 8
          : completedCount === 7
          ? 7.5
          : completedCount + 1;
      
      const updateData = {
        currentStage: currentStage,
        'progress.openedCourses': completedCourses,
        'progress.completedExams': completedExams,
        'progress.scores': scores,
      };

      await userRef.update(updateData);
      
      console.log(`✅ Updated user achievements: ${completedCourses.length} courses completed`);
      return await this.findById(userId);
    } catch (error) {
      console.error('Error updating user achievements:', error);
      throw error;
    }
  }

  // Batch update all users with realistic data
  static async updateAllUsersWithRealisticData(): Promise<void> {
    try {
      console.log('🔄 Updating all users with realistic achievement data...');
      
      const querySnapshot = await this.collection.get();
      
      const userData = [
        { serial: "112", completedCourses: [1, 2, 3, 4, 5, 6] }, // 6 دورات مكتملة
        { serial: "101", completedCourses: [1, 2, 3] }, // 3 دورات مكتملة  
        { serial: "105", completedCourses: [1] }, // دورة واحدة مكتملة
      ];
      
      for (const doc of querySnapshot.docs) {
        const docData = doc.data();
        const userConfig = userData.find(u => u.serial === docData.serial);
        
        if (userConfig) {
          const completedCourses = userConfig.completedCourses;
          const completedCount = completedCourses.length;
          const currentStage =
            completedCount >= 8
              ? 8
              : completedCount === 7
              ? 7.5
              : completedCount + 1;
          const scores = completedCourses.map(() => Math.floor(Math.random() * 30) + 70);
          
          await doc.ref.update({
            currentStage: currentStage,
            progress: {
              openedCourses: completedCourses,
              completedExams: completedCourses,
              scores: scores,
            }
          });
          
          console.log(`✅ Updated ${docData.name}: ${completedCourses.length} courses completed, stage ${currentStage}`);
        }
      }
      
      console.log('🎉 All users updated with realistic data!');
    } catch (error) {
      console.error('Error updating users with realistic data:', error);
      throw error;
    }
  }

  static async listUsersBasic(): Promise<Array<{ id: string; serial: string; name: string }>> {
    const querySnapshot = await this.collection.get();

    return querySnapshot.docs
      .map((d) => {
        const data: any = d.data();
        return {
          id: d.id,
          serial: String(data.serial ?? ""),
          name: String(data.name ?? ""),
        };
      })
      .filter((u) => u.serial && u.name);
  }

  static async bulkUpdateNamesBySerial(
    updates: Array<{ serial: string; name: string }>
  ): Promise<{ updatedCount: number; missingSerials: string[] }> {
    const querySnapshot = await this.collection.get();
    const refBySerial = new Map<string, FirebaseFirestore.DocumentReference>();

    querySnapshot.docs.forEach((d) => {
      const data: any = d.data();
      const serial = String(data.serial ?? "");
      if (!serial) return;
      refBySerial.set(serial, d.ref);
    });

    const missingSerials: string[] = [];
    const normalized = updates
      .map((u) => ({ serial: String(u.serial).trim(), name: String(u.name).trim() }))
      .filter((u) => u.serial && u.name);

    const chunks: Array<Array<{ serial: string; name: string }>> = [];
    for (let i = 0; i < normalized.length; i += 450) {
      chunks.push(normalized.slice(i, i + 450));
    }

    let updatedCount = 0;

    for (const chunk of chunks) {
      const batch = db.batch();
      for (const u of chunk) {
        const ref = refBySerial.get(u.serial);
        if (!ref) {
          missingSerials.push(u.serial);
          continue;
        }
        batch.update(ref, { name: u.name });
        updatedCount += 1;
      }
      await batch.commit();
    }

    return { updatedCount, missingSerials };
  }

}
