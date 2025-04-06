import dotenv from "dotenv";
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  out: "./drizzle",
  schema: "./db/schema.js",
  dialect: "postgresql",
  dbCredentials: {
    url: dotenv.config().parsed.DATABASE_URL,
  },
});
