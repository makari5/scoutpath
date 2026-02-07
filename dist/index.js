// server/index.ts
import express2 from "express";

// server/routes.ts
import { createServer } from "http";
import { z as z2 } from "zod";

// shared/schema.ts
import { z } from "zod";
var userSchema = z.object({
  id: z.string(),
  name: z.string(),
  serial: z.string(),
  // Changed from serialNumber to match Firestore
  currentStage: z.number().min(1).max(8).refine((v) => Number.isInteger(v) || v === 7.5),
  // Changed from stage to match Firestore
  progress: z.object({
    openedCourses: z.array(z.number()).default([]),
    completedExams: z.array(z.number()).default([]),
    scores: z.array(z.number()).default([])
  }).optional().default({
    openedCourses: [],
    completedExams: [],
    scores: []
  }),
  trainingProgress: z.object({
    courses: z.record(
      z.string(),
      z.object({
        startedAt: z.number().optional(),
        readParts: z.array(z.number()).optional().default([]),
        passedParts: z.array(z.number()).optional().default([]),
        completedAt: z.number().optional()
      })
    ).default({}),
    completedCourses: z.array(z.number()).default([])
  }).optional().default({
    courses: {},
    completedCourses: []
  })
});
var coursePartSchema = z.object({
  id: z.number(),
  title: z.string(),
  pdfPath: z.string()
});
var courseSchema = z.object({
  id: z.number(),
  title: z.string(),
  parts: z.array(coursePartSchema)
});
var barcodeLoginSchema = z.object({
  barcodeNumber: z.string()
});
var part = (courseId, id, title) => ({
  id,
  title,
  pdfPath: `/pdfs/${courseId}/part-${String(id).padStart(2, "0")}.pdf`
});
var courses = [
  {
    id: 1,
    title: "\u062F\u0648\u0631\u0629 \u062A\u062F\u0631\u064A\u0628 \u0627\u0644\u062C\u0648\u0627\u0644\u0629 \u0627\u0644\u062C\u062F\u062F",
    parts: [
      part(1, 1, "\u0627\u0644\u0628\u0627\u0628 \u0627\u0644\u0623\u0648\u0644"),
      part(1, 2, "\u0627\u0644\u0628\u0627\u0628 \u0627\u0644\u062B\u0627\u0646\u064A"),
      part(1, 3, "\u0627\u0644\u0628\u0627\u0628 \u0627\u0644\u062B\u0627\u0644\u062B"),
      part(1, 4, "\u0627\u0644\u0628\u0627\u0628 \u0627\u0644\u0631\u0627\u0628\u0639")
    ]
  },
  {
    id: 2,
    title: "\u062F\u0648\u0631\u0629 \u0631\u0648\u0627\u062F \u0627\u0644\u0631\u0647\u0648\u0637",
    parts: [
      part(2, 1, "\u0627\u0644\u0628\u0627\u0628 \u0627\u0644\u0623\u0648\u0644"),
      part(2, 2, "\u0627\u0644\u0628\u0627\u0628 \u0627\u0644\u062B\u0627\u0646\u064A"),
      part(2, 3, "\u0627\u0644\u0628\u0627\u0628 \u0627\u0644\u062B\u0627\u0644\u062B"),
      part(2, 4, "\u0627\u0644\u0628\u0627\u0628 \u0627\u0644\u0631\u0627\u0628\u0639"),
      part(2, 5, "\u0627\u0644\u0628\u0627\u0628 \u0627\u0644\u062E\u0627\u0645\u0633"),
      part(2, 6, "\u0627\u0644\u0628\u0627\u0628 \u0627\u0644\u0633\u0627\u062F\u0633")
    ]
  },
  {
    id: 3,
    title: "\u062F\u0648\u0631\u0629 \u0627\u0644\u0642\u0627\u062F\u0629 \u0627\u0644\u0645\u0639\u0644\u0645\u064A\u0646",
    parts: [
      part(3, 1, "\u0627\u0644\u0628\u0627\u0628 \u0627\u0644\u0623\u0648\u0644"),
      part(3, 2, "\u0627\u0644\u0628\u0627\u0628 \u0627\u0644\u062B\u0627\u0646\u064A"),
      part(3, 3, "\u0627\u0644\u0628\u0627\u0628 \u0627\u0644\u062B\u0627\u0644\u062B"),
      part(3, 4, "\u0627\u0644\u0628\u0627\u0628 \u0627\u0644\u0631\u0627\u0628\u0639"),
      part(3, 5, "\u0627\u0644\u0628\u0627\u0628 \u0627\u0644\u062E\u0627\u0645\u0633")
    ]
  },
  {
    id: 4,
    title: "\u062F\u0648\u0631\u0629 \u062A\u062F\u0631\u064A\u0628 \u0645\u0633\u0627\u0639\u062F\u064A \u0627\u0644\u0642\u0627\u062F\u0629",
    parts: [
      part(4, 1, "\u0627\u0644\u0628\u0627\u0628 \u0627\u0644\u0623\u0648\u0644"),
      part(4, 2, "\u0627\u0644\u0628\u0627\u0628 \u0627\u0644\u062B\u0627\u0646\u064A"),
      part(4, 3, "\u0627\u0644\u0628\u0627\u0628 \u0627\u0644\u062B\u0627\u0644\u062B"),
      part(4, 4, "\u0627\u0644\u0628\u0627\u0628 \u0627\u0644\u0631\u0627\u0628\u0639"),
      part(4, 5, "\u0627\u0644\u0628\u0627\u0628 \u0627\u0644\u062E\u0627\u0645\u0633")
    ]
  },
  {
    id: 5,
    title: "\u062F\u0648\u0631\u0629 \u062A\u062F\u0631\u064A\u0628 \u0642\u0627\u062F\u0629 \u0627\u0644\u0641\u0631\u0642",
    parts: [
      part(5, 1, "\u0627\u0644\u0628\u0627\u0628 \u0627\u0644\u0623\u0648\u0644"),
      part(5, 2, "\u0627\u0644\u0628\u0627\u0628 \u0627\u0644\u062B\u0627\u0646\u064A"),
      part(5, 3, "\u0627\u0644\u0628\u0627\u0628 \u0627\u0644\u062B\u0627\u0644\u062B"),
      part(5, 4, "\u0627\u0644\u0628\u0627\u0628 \u0627\u0644\u0631\u0627\u0628\u0639")
    ]
  },
  {
    id: 6,
    title: "\u062F\u0648\u0631\u0629 \u062A\u062F\u0631\u064A\u0628 \u0645\u0639\u062F\u064A \u0627\u0644\u0628\u0631\u0627\u0645\u062C",
    parts: [
      part(6, 1, "\u0627\u0644\u0628\u0627\u0628 \u0627\u0644\u0623\u0648\u0644"),
      part(6, 2, "\u0627\u0644\u0628\u0627\u0628 \u0627\u0644\u062B\u0627\u0646\u064A"),
      part(6, 3, "\u0627\u0644\u0628\u0627\u0628 \u0627\u0644\u062B\u0627\u0644\u062B"),
      part(6, 4, "\u0627\u0644\u0628\u0627\u0628 \u0627\u0644\u0631\u0627\u0628\u0639"),
      part(6, 5, "\u0627\u0644\u0628\u0627\u0628 \u0627\u0644\u062E\u0627\u0645\u0633")
    ]
  },
  {
    id: 7,
    title: "\u062F\u0648\u0631\u0629 \u062A\u062F\u0631\u064A\u0628 \u0627\u0644\u0642\u0627\u062F\u0629 \u0627\u0644\u0639\u0645\u0648\u0645",
    parts: [
      part(7, 1, "\u0627\u0644\u0628\u0627\u0628 \u0627\u0644\u0623\u0648\u0644"),
      part(7, 2, "\u0627\u0644\u0628\u0627\u0628 \u0627\u0644\u062B\u0627\u0646\u064A"),
      part(7, 3, "\u0627\u0644\u0628\u0627\u0628 \u0627\u0644\u062B\u0627\u0644\u062B"),
      part(7, 4, "\u0627\u0644\u0628\u0627\u0628 \u0627\u0644\u0631\u0627\u0628\u0639"),
      part(7, 5, "\u0627\u0644\u0628\u0627\u0628 \u0627\u0644\u062E\u0627\u0645\u0633")
    ]
  },
  {
    id: 8,
    title: "\u062F\u0648\u0631\u0629 \u062A\u062F\u0631\u064A\u0628 \u0642\u0627\u0626\u062F \u0627\u0644\u0645\u062C\u0645\u0648\u0639\u0629",
    parts: [
      part(8, 1, "\u0627\u0644\u0628\u0627\u0628 \u0627\u0644\u0623\u0648\u0644"),
      part(8, 2, "\u0627\u0644\u0628\u0627\u0628 \u0627\u0644\u062B\u0627\u0646\u064A"),
      part(8, 3, "\u0627\u0644\u0628\u0627\u0628 \u0627\u0644\u062B\u0627\u0644\u062B"),
      part(8, 4, "\u0627\u0644\u0628\u0627\u0628 \u0627\u0644\u0631\u0627\u0628\u0639")
    ]
  }
];

// server/firebase.ts
import { getFirestore, FieldValue } from "firebase-admin/firestore";

// server/firebaseConfig.ts
import { initializeApp, cert, getApps } from "firebase-admin/app";
import { readFileSync, existsSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
function initializeFirebaseAdmin() {
  if (getApps().length > 0) {
    return getApps()[0];
  }
  try {
    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
      console.log("\xF0\u0178\u201D\u2018 Using Service Account from Environment Variable (Production)");
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
      const app4 = initializeApp({
        credential: cert(serviceAccount),
        projectId: serviceAccount.project_id
      });
      console.log("\xF0\u0178\u201D\xA5 Firebase Admin SDK initialized with Environment Variable Service Account");
      return app4;
    }
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = dirname(__filename);
    const serviceAccountPath = resolve(__dirname, "serviceAccountKey.json");
    const serviceAccountFallback = resolve(process.cwd(), "server", "serviceAccountKey.json");
    if (existsSync(serviceAccountPath) || existsSync(serviceAccountFallback)) {
      console.log("\xF0\u0178\u201D\u2018 Using Service Account Key File (Local Development)");
      const fileToRead = existsSync(serviceAccountPath) ? serviceAccountPath : serviceAccountFallback;
      const serviceAccount = JSON.parse(readFileSync(fileToRead, "utf8"));
      const app4 = initializeApp({
        credential: cert(serviceAccount),
        projectId: serviceAccount.project_id
      });
      console.log("\xF0\u0178\u201D\xA5 Firebase Admin SDK initialized with Service Account Key File");
      return app4;
    }
    console.log("\xE2\u0161\xA0\xEF\xB8\x8F No Service Account found, using Project ID only");
    const projectId = process.env.FIREBASE_PROJECT_ID || process.env.VITE_FIREBASE_PROJECT_ID || "bibleverseapp-d43ac";
    const app3 = initializeApp({
      projectId
    });
    console.log(`\xF0\u0178\u201D\xA5 Firebase Admin SDK initialized with Project ID: ${projectId}`);
    return app3;
  } catch (error) {
    console.error("\xE2\x9D\u0152 Error initializing Firebase Admin SDK:", error);
    throw error;
  }
}

// server/firebase.ts
var app = initializeFirebaseAdmin();
var db = getFirestore(app);
var FirestoreUserService = class {
  static collection = db.collection("users");
  // Find user by serial number (barcode)
  static async findBySerial(serial) {
    try {
      console.log(`\u{1F50D} Searching for user with serial: ${serial}`);
      const querySnapshot = await this.collection.where("serial", "==", serial).get();
      if (querySnapshot.empty) {
        console.log(`\u274C No user found with serial: ${serial}`);
        return null;
      }
      console.log(`\u{1F4CB} Found ${querySnapshot.docs.length} user(s) with serial ${serial}:`);
      querySnapshot.docs.forEach((doc2, index) => {
        const data = doc2.data();
        console.log(`  ${index + 1}. ID: ${doc2.id}, Name: ${data.name}, Stage: ${data.currentStage}`);
      });
      const docs = querySnapshot.docs;
      const bestDoc = docs.map((d) => {
        const data = d.data();
        const completedLen = Array.isArray(data?.progress?.completedExams) ? data.progress.completedExams.length : 0;
        const stage = typeof data?.currentStage === "number" ? data.currentStage : 0;
        return { d, stage, completedLen };
      }).sort((a, b) => {
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
          scores: []
        },
        trainingProgress: userData.trainingProgress || {
          courses: {},
          completedCourses: []
        }
      };
      console.log(`\u2705 Returning user: ${user.name} (Stage: ${user.currentStage})`);
      return user;
    } catch (error) {
      console.error("Error finding user by serial:", error);
      throw error;
    }
  }
  // Find user by ID
  static async findById(id) {
    try {
      const doc = await this.collection.doc(id).get();
      if (!doc.exists) {
        return null;
      }
      const userData = doc.data();
      return {
        id: doc.id,
        name: userData.name,
        serial: userData.serial,
        currentStage: userData.currentStage,
        progress: userData.progress || {
          openedCourses: [],
          completedExams: [],
          scores: []
        },
        trainingProgress: userData.trainingProgress || {
          courses: {},
          completedCourses: []
        }
      };
    } catch (error) {
      console.error("Error finding user by ID:", error);
      throw error;
    }
  }
  // Update user progress
  static async updateProgress(id, updates) {
    try {
      const userRef = this.collection.doc(id);
      const doc = await userRef.get();
      if (!doc.exists) {
        return null;
      }
      const userData = doc.data();
      const existingProgress = userData?.progress ?? {
        openedCourses: [],
        completedExams: [],
        scores: []
      };
      const normalizeNumberArray = (arr) => Array.from(new Set((Array.isArray(arr) ? arr : []).filter((n) => typeof n === "number"))).sort((a, b) => a - b);
      const mergedOpenedCourses = normalizeNumberArray([
        ...normalizeNumberArray(existingProgress?.openedCourses),
        ...normalizeNumberArray(updates.openedCourses)
      ]);
      const mergedCompletedExams = normalizeNumberArray([
        ...normalizeNumberArray(existingProgress?.completedExams),
        ...normalizeNumberArray(updates.completedExams)
      ]);
      const computeCurrentStage = (completed) => {
        const set = new Set(completed);
        let k = 0;
        while (set.has(k + 1)) k++;
        if (k >= 8) return 8;
        if (k === 7) return 7.5;
        return k === 0 ? 1 : k + 1;
      };
      const proposedStage = computeCurrentStage(mergedCompletedExams);
      const existingStage = typeof userData?.currentStage === "number" ? userData.currentStage : 1;
      const safeStage = Math.max(existingStage, proposedStage);
      const updateData = {
        "progress.openedCourses": mergedOpenedCourses,
        "progress.completedExams": mergedCompletedExams,
        currentStage: safeStage
      };
      if (updates.scores) {
        const existingScores = Array.isArray(existingProgress?.scores) ? existingProgress.scores : [];
        const incomingScores = Array.isArray(updates.scores) ? updates.scores : [];
        updateData["progress.scores"] = incomingScores.length >= existingScores.length ? incomingScores : existingScores;
      }
      await userRef.update(updateData);
      return await this.findById(id);
    } catch (error) {
      console.error("Error updating user progress:", error);
      throw error;
    }
  }
  // Clear legacy progress fields (used by the old system)
  static async clearLegacyProgress(id) {
    try {
      const userRef = this.collection.doc(id);
      const doc = await userRef.get();
      if (!doc.exists) return null;
      await userRef.update({
        progress: FieldValue.delete()
      });
      return await this.findById(id);
    } catch (error) {
      console.error("Error clearing legacy progress:", error);
      throw error;
    }
  }
  // Update new training progress (parts-based)
  static async updateTrainingProgress(id, updates) {
    try {
      const userRef = this.collection.doc(id);
      const doc = await userRef.get();
      if (!doc.exists) {
        return null;
      }
      const userData = doc.data();
      const courseKey = String(updates.courseId);
      const existingTraining = userData?.trainingProgress ?? { courses: {}, completedCourses: [] };
      const existingCourse = existingTraining?.courses?.[courseKey] ?? {};
      const normalize = (arr) => Array.from(new Set((Array.isArray(arr) ? arr : []).filter((n) => typeof n === "number"))).sort(
        (a, b) => a - b
      );
      const mergedRead = updates.readParts ? normalize([...existingCourse.readParts ?? [], ...updates.readParts]) : normalize(existingCourse.readParts ?? []);
      const mergedPassed = updates.passedParts ? normalize([...existingCourse.passedParts ?? [], ...updates.passedParts]) : normalize(existingCourse.passedParts ?? []);
      const startedAt = typeof updates.startedAt === "number" ? updates.startedAt : existingCourse.startedAt;
      const completedAt = typeof updates.completedAt === "number" ? updates.completedAt : existingCourse.completedAt;
      const completedCourses = normalize(existingTraining.completedCourses ?? []);
      if (typeof completedAt === "number" && !completedCourses.includes(updates.courseId)) {
        completedCourses.push(updates.courseId);
        completedCourses.sort((a, b) => a - b);
      }
      const existingStage = typeof userData?.currentStage === "number" ? userData.currentStage : 1;
      const nextStage = completedCourses.includes(updates.courseId) ? Math.min(updates.courseId + 1, 8) : existingStage;
      const safeStage = Math.max(existingStage, nextStage);
      const updateData = {
        [`trainingProgress.courses.${courseKey}`]: {
          startedAt,
          readParts: mergedRead,
          passedParts: mergedPassed,
          ...typeof completedAt === "number" ? { completedAt } : {}
        },
        "trainingProgress.completedCourses": completedCourses,
        currentStage: safeStage
      };
      await userRef.update(updateData);
      return await this.findById(id);
    } catch (error) {
      console.error("Error updating training progress:", error);
      throw error;
    }
  }
  // Utility function to clean up duplicate users (use with caution)
  static async cleanupDuplicateUsers() {
    try {
      console.log("\u{1F9F9} Starting cleanup of duplicate users...");
      const querySnapshot = await this.collection.get();
      const usersBySerial = /* @__PURE__ */ new Map();
      querySnapshot.docs.forEach((doc) => {
        const data = doc.data();
        const serial = data.serial;
        if (!usersBySerial.has(serial)) {
          usersBySerial.set(serial, []);
        }
        usersBySerial.get(serial).push({
          id: doc.id,
          data,
          ref: doc.ref
        });
      });
      for (const [serial, users] of Array.from(usersBySerial.entries())) {
        if (users.length > 1) {
          console.log(`\u{1F50D} Found ${users.length} users with serial ${serial}:`);
          users.forEach((user, index) => {
            console.log(`  ${index + 1}. ID: ${user.id}, Name: ${user.data.name}, Stage: ${user.data.currentStage}`);
          });
          for (let i = 1; i < users.length; i++) {
            console.log(`\u{1F5D1}\uFE0F Deleting duplicate user: ${users[i].data.name} (${users[i].id})`);
            await users[i].ref.delete();
          }
        }
      }
      console.log("\u2705 Cleanup completed");
    } catch (error) {
      console.error("Error cleaning up duplicate users:", error);
      throw error;
    }
  }
  // Fix demo user IDs by recreating them with proper Firestore IDs
  static async fixDemoUserIds() {
    try {
      console.log("\u{1F527} Starting to fix demo user IDs...");
      const querySnapshot = await this.collection.get();
      const usersToFix = [];
      querySnapshot.docs.forEach((doc) => {
        if (doc.id.startsWith("demo-user")) {
          const data = doc.data();
          usersToFix.push({
            oldId: doc.id,
            data,
            ref: doc.ref
          });
          console.log(`\u{1F50D} Found demo user: ${doc.id} - ${data.name} (${data.serial})`);
        }
      });
      if (usersToFix.length === 0) {
        console.log("\u2705 No demo users found to fix");
        return;
      }
      for (const user of usersToFix) {
        console.log(`\u{1F504} Recreating user: ${user.data.name} (${user.data.serial})`);
        const newDoc = await this.collection.add({
          name: user.data.name,
          serial: user.data.serial,
          currentStage: user.data.currentStage,
          progress: user.data.progress || {
            openedCourses: [],
            completedExams: [],
            scores: []
          }
        });
        console.log(`\u2705 Created new user with ID: ${newDoc.id}`);
        await user.ref.delete();
        console.log(`\u{1F5D1}\uFE0F Deleted old demo user: ${user.oldId}`);
      }
      console.log("\u{1F389} All demo user IDs fixed successfully!");
    } catch (error) {
      console.error("Error fixing demo user IDs:", error);
      throw error;
    }
  }
  // Update user progress and achievements
  static async updateUserAchievements(userId, completedCourses) {
    try {
      console.log(`\u{1F3AF} Updating achievements for user: ${userId}`);
      const userRef = this.collection.doc(userId);
      const doc = await userRef.get();
      if (!doc.exists) {
        return null;
      }
      const completedExams = completedCourses;
      const scores = completedCourses.map(() => Math.floor(Math.random() * 30) + 70);
      const certificates = completedCourses.length;
      const completedCount = completedCourses.length;
      const currentStage = completedCount >= 8 ? 8 : completedCount === 7 ? 7.5 : completedCount + 1;
      const updateData = {
        currentStage,
        "progress.openedCourses": completedCourses,
        "progress.completedExams": completedExams,
        "progress.scores": scores
      };
      await userRef.update(updateData);
      console.log(`\u2705 Updated user achievements: ${completedCourses.length} courses completed`);
      return await this.findById(userId);
    } catch (error) {
      console.error("Error updating user achievements:", error);
      throw error;
    }
  }
  // Batch update all users with realistic data
  static async updateAllUsersWithRealisticData() {
    try {
      console.log("\u{1F504} Updating all users with realistic achievement data...");
      const querySnapshot = await this.collection.get();
      const userData = [
        { serial: "112", completedCourses: [1, 2, 3, 4, 5, 6] },
        // 6 دورات مكتملة
        { serial: "101", completedCourses: [1, 2, 3] },
        // 3 دورات مكتملة  
        { serial: "105", completedCourses: [1] }
        // دورة واحدة مكتملة
      ];
      for (const doc of querySnapshot.docs) {
        const docData = doc.data();
        const userConfig = userData.find((u) => u.serial === docData.serial);
        if (userConfig) {
          const completedCourses = userConfig.completedCourses;
          const completedCount = completedCourses.length;
          const currentStage = completedCount >= 8 ? 8 : completedCount === 7 ? 7.5 : completedCount + 1;
          const scores = completedCourses.map(() => Math.floor(Math.random() * 30) + 70);
          await doc.ref.update({
            currentStage,
            progress: {
              openedCourses: completedCourses,
              completedExams: completedCourses,
              scores
            }
          });
          console.log(`\u2705 Updated ${docData.name}: ${completedCourses.length} courses completed, stage ${currentStage}`);
        }
      }
      console.log("\u{1F389} All users updated with realistic data!");
    } catch (error) {
      console.error("Error updating users with realistic data:", error);
      throw error;
    }
  }
  static async listUsersBasic() {
    const querySnapshot = await this.collection.get();
    return querySnapshot.docs.map((d) => {
      const data = d.data();
      return {
        id: d.id,
        serial: String(data.serial ?? ""),
        name: String(data.name ?? "")
      };
    }).filter((u) => u.serial && u.name);
  }
  static async bulkUpdateNamesBySerial(updates) {
    const querySnapshot = await this.collection.get();
    const refBySerial = /* @__PURE__ */ new Map();
    querySnapshot.docs.forEach((d) => {
      const data = d.data();
      const serial = String(data.serial ?? "");
      if (!serial) return;
      refBySerial.set(serial, d.ref);
    });
    const missingSerials = [];
    const normalized = updates.map((u) => ({ serial: String(u.serial).trim(), name: String(u.name).trim() })).filter((u) => u.serial && u.name);
    const chunks = [];
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
};

// server/routes.ts
async function registerRoutes(app3) {
  const requireAdmin = (req, res) => {
    const required = process.env.ADMIN_TOKEN;
    if (!required) return true;
    const tokenFromHeader = req.headers["x-admin-token"];
    const tokenFromBody = req.body?.token;
    const token = typeof tokenFromHeader === "string" ? tokenFromHeader : typeof tokenFromBody === "string" ? tokenFromBody : "";
    if (token && token === required) return true;
    res.status(401).json({ error: "Unauthorized", message: "\u063A\u064A\u0631 \u0645\u0635\u0631\u062D" });
    return false;
  };
  app3.post("/api/auth/barcode-login", async (req, res) => {
    try {
      const { barcodeNumber } = barcodeLoginSchema.parse(req.body);
      console.log(`\u{1F50D} Login attempt with barcode: ${barcodeNumber}`);
      const user = await FirestoreUserService.findBySerial(barcodeNumber);
      if (!user) {
        console.log(`\u274C User not found for barcode: ${barcodeNumber}`);
        return res.status(404).json({
          error: "User not found",
          message: "\u0627\u0644\u0631\u0642\u0645 \u063A\u064A\u0631 \u0645\u0648\u062C\u0648\u062F \u0641\u064A \u0627\u0644\u0646\u0638\u0627\u0645. \u062C\u0631\u0628: 112\u060C 101\u060C \u0623\u0648 105"
        });
      }
      console.log(`\u2705 User found: ${user.name}`);
      const cleanedUser = await FirestoreUserService.clearLegacyProgress(user.id);
      res.json({ user: cleanedUser ?? user });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({
        error: "Server error",
        message: error instanceof Error ? error.message : "\u062D\u062F\u062B \u062E\u0637\u0623 \u0641\u064A \u062A\u0633\u062C\u064A\u0644 \u0627\u0644\u062F\u062E\u0648\u0644"
      });
    }
  });
  app3.get("/api/users/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const user = await FirestoreUserService.findById(id);
      if (!user) {
        return res.status(404).json({
          error: "User not found",
          message: "\u0627\u0644\u0645\u0633\u062A\u062E\u062F\u0645 \u063A\u064A\u0631 \u0645\u0648\u062C\u0648\u062F"
        });
      }
      res.json({ user });
    } catch (error) {
      console.error("Get user error:", error);
      res.status(500).json({
        error: "Server error",
        message: "\u062D\u062F\u062B \u062E\u0637\u0623 \u0641\u064A \u062C\u0644\u0628 \u0628\u064A\u0627\u0646\u0627\u062A \u0627\u0644\u0645\u0633\u062A\u062E\u062F\u0645"
      });
    }
  });
  app3.patch("/api/users/:id/progress", async (req, res) => {
    try {
      const { id } = req.params;
      const updateSchema = z2.object({
        openedCourses: z2.array(z2.number()).optional(),
        completedExams: z2.array(z2.number()).optional(),
        scores: z2.array(z2.number()).optional()
      });
      const updates = updateSchema.parse(req.body);
      const user = await FirestoreUserService.updateProgress(id, updates);
      if (!user) {
        return res.status(404).json({
          error: "User not found",
          message: "\u0627\u0644\u0645\u0633\u062A\u062E\u062F\u0645 \u063A\u064A\u0631 \u0645\u0648\u062C\u0648\u062F"
        });
      }
      res.json({ user });
    } catch (error) {
      console.error("Update progress error:", error);
      res.status(500).json({
        error: "Update failed",
        message: "\u0641\u0634\u0644 \u062A\u062D\u062F\u064A\u062B \u0627\u0644\u062A\u0642\u062F\u0645"
      });
    }
  });
  app3.patch("/api/users/:id/training", async (req, res) => {
    try {
      const { id } = req.params;
      const updateSchema = z2.object({
        courseId: z2.number(),
        startedAt: z2.number().optional(),
        readParts: z2.array(z2.number()).optional(),
        passedParts: z2.array(z2.number()).optional(),
        completedAt: z2.number().optional()
      });
      const updates = updateSchema.parse(req.body);
      const user = await FirestoreUserService.updateTrainingProgress(id, updates);
      if (!user) {
        return res.status(404).json({
          error: "User not found",
          message: "\u0627\u0644\u0645\u0633\u062A\u062E\u062F\u0645 \u063A\u064A\u0631 \u0645\u0648\u062C\u0648\u062F"
        });
      }
      res.json({ user });
    } catch (error) {
      console.error("Update training progress error:", error);
      res.status(500).json({
        error: "Update failed",
        message: "\u0641\u0634\u0644 \u062A\u062D\u062F\u064A\u062B \u0627\u0644\u062A\u0642\u062F\u0645"
      });
    }
  });
  app3.get("/api/admin/users/basic", async (req, res) => {
    try {
      if (!requireAdmin(req, res)) return;
      const users = await FirestoreUserService.listUsersBasic();
      res.json({ users });
    } catch (error) {
      console.error("List users basic error:", error);
      res.status(500).json({
        error: "Server error",
        message: "\u062D\u062F\u062B \u062E\u0637\u0623 \u0641\u064A \u062C\u0644\u0628 \u0628\u064A\u0627\u0646\u0627\u062A \u0627\u0644\u0645\u0633\u062A\u062E\u062F\u0645\u064A\u0646"
      });
    }
  });
  app3.patch("/api/admin/users/names", async (req, res) => {
    try {
      if (!requireAdmin(req, res)) return;
      const bodySchema = z2.object({
        token: z2.string().optional(),
        updates: z2.array(
          z2.object({
            serial: z2.string().min(1),
            name: z2.string().min(1)
          })
        ).min(1)
      });
      const { updates } = bodySchema.parse(req.body);
      const result = await FirestoreUserService.bulkUpdateNamesBySerial(updates);
      res.json({ result });
    } catch (error) {
      console.error("Bulk update names error:", error);
      res.status(500).json({
        error: "Update failed",
        message: "\u0641\u0634\u0644 \u062A\u062D\u062F\u064A\u062B \u0627\u0644\u0623\u0633\u0645\u0627\u0621"
      });
    }
  });
  app3.post("/api/admin/fix-demo-ids", async (req, res) => {
    try {
      await FirestoreUserService.fixDemoUserIds();
      res.json({ success: true, message: "Demo user IDs fixed successfully" });
    } catch (error) {
      console.error("Fix demo IDs error:", error);
      res.status(500).json({
        error: "Fix failed",
        message: error instanceof Error ? error.message : "\u0641\u0634\u0644 \u0625\u0635\u0644\u0627\u062D \u0645\u0639\u0631\u0641\u0627\u062A \u0627\u0644\u0645\u0633\u062A\u062E\u062F\u0645\u064A\u0646"
      });
    }
  });
  app3.post("/api/admin/cleanup-duplicates", async (req, res) => {
    try {
      await FirestoreUserService.cleanupDuplicateUsers();
      res.json({ success: true, message: "Duplicate users cleaned up successfully" });
    } catch (error) {
      console.error("Cleanup error:", error);
      res.status(500).json({
        error: "Cleanup failed",
        message: error instanceof Error ? error.message : "\u0641\u0634\u0644 \u062A\u0646\u0638\u064A\u0641 \u0627\u0644\u0628\u064A\u0627\u0646\u0627\u062A \u0627\u0644\u0645\u0643\u0631\u0631\u0629"
      });
    }
  });
  app3.post("/api/admin/update-realistic-data", async (req, res) => {
    try {
      await FirestoreUserService.updateAllUsersWithRealisticData();
      res.json({ success: true, message: "Users updated with realistic data successfully" });
    } catch (error) {
      console.error("Update realistic data error:", error);
      res.status(500).json({
        error: "Update failed",
        message: error instanceof Error ? error.message : "\u0641\u0634\u0644 \u062A\u062D\u062F\u064A\u062B \u0627\u0644\u0628\u064A\u0627\u0646\u0627\u062A \u0627\u0644\u0648\u0627\u0642\u0639\u064A\u0629"
      });
    }
  });
  const httpServer = createServer(app3);
  return httpServer;
}

// server/vite.ts
import express from "express";
import fs from "fs";
import path2 from "path";
import { createServer as createViteServer, createLogger } from "vite";

// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";
var vite_config_default = defineConfig({
  plugins: [
    react(),
    runtimeErrorOverlay(),
    ...process.env.NODE_ENV !== "production" && process.env.REPL_ID !== void 0 ? [
      await import("@replit/vite-plugin-cartographer").then(
        (m) => m.cartographer()
      ),
      await import("@replit/vite-plugin-dev-banner").then(
        (m) => m.devBanner()
      )
    ] : []
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets")
    }
  },
  root: path.resolve(import.meta.dirname, "client"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true
  },
  server: {
    fs: {
      strict: true,
      deny: ["**/.*"]
    }
  }
});

// server/vite.ts
import { nanoid } from "nanoid";
var viteLogger = createLogger();
function log(message, source = "express") {
  const formattedTime = (/* @__PURE__ */ new Date()).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}
async function setupVite(app3, server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true
  };
  const vite = await createViteServer({
    ...vite_config_default,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        process.exit(1);
      }
    },
    server: serverOptions,
    appType: "custom"
  });
  app3.use(vite.middlewares);
  app3.use("*", async (req, res, next) => {
    const url = req.originalUrl;
    try {
      const clientTemplate = path2.resolve(
        import.meta.dirname,
        "..",
        "client",
        "index.html"
      );
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e);
      next(e);
    }
  });
}
function serveStatic(app3) {
  const distPath = path2.resolve(import.meta.dirname, "public");
  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }
  app3.use(express.static(distPath));
  app3.use("*", (_req, res) => {
    res.sendFile(path2.resolve(distPath, "index.html"));
  });
}

// server/index.ts
var app2 = express2();
app2.use(express2.json({
  verify: (req, _res, buf) => {
    req.rawBody = buf;
  }
}));
app2.use(express2.urlencoded({ extended: false }));
app2.use((req, res, next) => {
  const start = Date.now();
  const path3 = req.path;
  let capturedJsonResponse = void 0;
  const originalResJson = res.json;
  res.json = function(bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path3.startsWith("/api")) {
      let logLine = `${req.method} ${path3} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "\u2026";
      }
      log(logLine);
    }
  });
  next();
});
(async () => {
  const server = await registerRoutes(app2);
  app2.use((err, _req, res, _next) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
    throw err;
  });
  if (app2.get("env") === "development") {
    await setupVite(app2, server);
  } else {
    serveStatic(app2);
  }
  const port = parseInt(process.env.PORT || "5000", 10);
  server.listen(port, () => {
    log(`serving on port ${port}`);
  });
})();
