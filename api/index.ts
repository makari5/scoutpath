import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "../server/routes";

const app = express();

console.log("ðŸ”‘ API Function Starting...");

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Health check endpoint (add before routes)
app.get("/api/health", (_req, res) => {
  res.status(200).json({ status: "ok", timestamp: new Date().toISOString() });
});

try {
  // Register routes
  registerRoutes(app);
  console.log("âœ… Routes registered successfully");
} catch (error) {
  console.error("âŒ Failed to register routes:", error);
}

// Error handling
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  const status = err.status || err.statusCode || 500;
  const message = err.message || "Internal Server Error";
  res.status(status).json({ message });
});

export default app;
