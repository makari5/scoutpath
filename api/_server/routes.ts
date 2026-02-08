import type { Express } from "express";
import { createServer, type Server } from "http";
import { z } from "zod";
import { barcodeLoginSchema } from "../../shared/schema.js";
import { FirestoreUserService, FirestoreSystemSettings } from "./firebase.js";

export async function registerRoutes(app: Express): Promise<Server> {

  const requireAdmin = (req: any, res: any): boolean => {
    const required = process.env.ADMIN_TOKEN;
    if (!required) return true;
    const tokenFromHeader = req.headers["x-admin-token"];
    const tokenFromBody = req.body?.token;
    const token = typeof tokenFromHeader === "string" ? tokenFromHeader : typeof tokenFromBody === "string" ? tokenFromBody : "";
    if (token && token === required) return true;
    res.status(401).json({ error: "Unauthorized", message: "غير مصرح" });
    return false;
  };

  // Barcode login endpoint (Using Firestore)
  app.post("/api/auth/barcode-login", async (req, res) => {
    try {
      const { barcodeNumber } = barcodeLoginSchema.parse(req.body);
      
      console.log(`🔍 Login attempt with barcode: ${barcodeNumber}`);

      // Find user in Firestore
      const user = await FirestoreUserService.findBySerial(barcodeNumber);

      if (!user) {
        console.log(`❌ User not found for barcode: ${barcodeNumber}`);
        return res.status(404).json({
          error: "User not found",
          message: "الرقم غير موجود في النظام. جرب: 112، 101، أو 105",
        });
      }

      console.log(`✅ User found: ${user.name}`);

      // Clear legacy progress fields on login for the new system
      const cleanedUser = await FirestoreUserService.clearLegacyProgress(user.id);
      res.json({ user: cleanedUser ?? user });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({
        error: "Server error",
        message: error instanceof Error ? error.message : "حدث خطأ في تسجيل الدخول",
      });
    }
  });

  // Get system settings (Season Start Date)
  app.get("/api/settings", async (_req, res) => {
    try {
      const settings = await FirestoreSystemSettings.getSettings();
      res.json({ settings });
    } catch (error) {
      console.error("Get settings error:", error);
      res.status(500).json({ error: "Server error" });
    }
  });

  // Admin: Start new season
  app.post("/api/admin/start-season", async (req, res) => {
    try {
      // Check admin permission (simple check for user 101 or token)
      // For this specific request, we trust the frontend check or add a simple body token
      if (!requireAdmin(req, res)) return;

      await FirestoreSystemSettings.startNewSeason();
      res.json({ success: true, message: "تم بدء الموسم الجديد بنجاح" });
    } catch (error) {
      console.error("Start season error:", error);
      res.status(500).json({ error: "Server error" });
    }
  });

  // Get user by ID
  app.get("/api/users/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const user = await FirestoreUserService.findById(id);

      if (!user) {
        return res.status(404).json({
          error: "User not found",
          message: "المستخدم غير موجود",
        });
      }

      res.json({ user });
    } catch (error) {
      console.error("Get user error:", error);
      res.status(500).json({
        error: "Server error",
        message: "حدث خطأ في جلب بيانات المستخدم",
      });
    }
  });

  // Update user progress
  app.patch("/api/users/:id/progress", async (req, res) => {
    try {
      const { id } = req.params;
      const updateSchema = z.object({
        openedCourses: z.array(z.number()).optional(),
        completedExams: z.array(z.number()).optional(),
        scores: z.array(z.number()).optional(),
      });

      const updates = updateSchema.parse(req.body);
      
      const user = await FirestoreUserService.updateProgress(id, updates);
      if (!user) {
        return res.status(404).json({
          error: "User not found",
          message: "المستخدم غير موجود",
        });
      }

      res.json({ user });
    } catch (error) {
      console.error("Update progress error:", error);
      res.status(500).json({
        error: "Update failed",
        message: "فشل تحديث التقدم",
      });
    }
  });

  // Update new training progress (parts-based)
  app.patch("/api/users/:id/training", async (req, res) => {
    try {
      const { id } = req.params;
      const updateSchema = z.object({
        courseId: z.number(),
        startedAt: z.number().optional(),
        readParts: z.array(z.number()).optional(),
        passedParts: z.array(z.number()).optional(),
        completedAt: z.number().optional(),
      });

      const updates = updateSchema.parse(req.body);
      const user = await FirestoreUserService.updateTrainingProgress(id, updates);

      if (!user) {
        return res.status(404).json({
          error: "User not found",
          message: "المستخدم غير موجود",
        });
      }

      res.json({ user });
    } catch (error) {
      console.error("Update training progress error:", error);
      res.status(500).json({
        error: "Update failed",
        message: "فشل تحديث التقدم",
      });
    }
  });

  app.get("/api/admin/users/basic", async (req, res) => {
    try {
      if (!requireAdmin(req, res)) return;
      const users = await FirestoreUserService.listUsersBasic();
      res.json({ users });
    } catch (error) {
      console.error("List users basic error:", error);
      res.status(500).json({
        error: "Server error",
        message: "حدث خطأ في جلب بيانات المستخدمين",
      });
    }
  });

  app.patch("/api/admin/users/names", async (req, res) => {
    try {
      if (!requireAdmin(req, res)) return;

      const bodySchema = z.object({
        token: z.string().optional(),
        updates: z
          .array(
            z.object({
              serial: z.string().min(1),
              name: z.string().min(1),
            })
          )
          .min(1),
      });

      const { updates } = bodySchema.parse(req.body);
      const result = await FirestoreUserService.bulkUpdateNamesBySerial(updates);
      res.json({ result });
    } catch (error) {
      console.error("Bulk update names error:", error);
      res.status(500).json({
        error: "Update failed",
        message: "فشل تحديث الأسماء",
      });
    }
  });

  // Temporary endpoint to fix demo user IDs (remove after use)
  app.post("/api/admin/fix-demo-ids", async (req, res) => {
    try {
      await FirestoreUserService.fixDemoUserIds();
      res.json({ success: true, message: "Demo user IDs fixed successfully" });
    } catch (error) {
      console.error("Fix demo IDs error:", error);
      res.status(500).json({
        error: "Fix failed",
        message: error instanceof Error ? error.message : "فشل إصلاح معرفات المستخدمين",
      });
    }
  });

  // Temporary endpoint to cleanup duplicate users (remove after use)
  app.post("/api/admin/cleanup-duplicates", async (req, res) => {
    try {
      await FirestoreUserService.cleanupDuplicateUsers();
      res.json({ success: true, message: "Duplicate users cleaned up successfully" });
    } catch (error) {
      console.error("Cleanup error:", error);
      res.status(500).json({
        error: "Cleanup failed",
        message: error instanceof Error ? error.message : "فشل تنظيف البيانات المكررة",
      });
    }
  });

  // Temporary endpoint to update users with realistic data (remove after use)
  app.post("/api/admin/update-realistic-data", async (req, res) => {
    try {
      await FirestoreUserService.updateAllUsersWithRealisticData();
      res.json({ success: true, message: "Users updated with realistic data successfully" });
    } catch (error) {
      console.error("Update realistic data error:", error);
      res.status(500).json({
        error: "Update failed",
        message: error instanceof Error ? error.message : "فشل تحديث البيانات الواقعية",
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
