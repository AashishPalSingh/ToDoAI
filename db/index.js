// Make sure to install the 'pg' package
import { drizzle } from "drizzle-orm/node-postgres";
import dotenv from "dotenv";

export const db = drizzle(dotenv.config().parsed.DATABASE_URL);
