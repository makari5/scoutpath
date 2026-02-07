import { defineConfig } from "drizzle-kit";

// Check for database URL in different environment variable names
const databaseUrl = process.env.DATABASE_URL || 
                   process.env.DATABASE_PRIVATE_URL || 
                   process.env.POSTGRES_URL;

if (!databaseUrl) {
  console.warn("⚠️ No database URL found. Skipping database configuration.");
  // Don't throw error for Render deployment without database
}

export default defineConfig({
  out: "./migrations",
  schema: "./shared/schema.ts",
  dialect: "postgresql",
  dbCredentials: {
    url: databaseUrl || "postgresql://placeholder",
  },
});
