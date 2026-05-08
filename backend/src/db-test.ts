import "dotenv/config";
import mongoose from "mongoose";
import { Redis } from "ioredis";
import pg from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "./generated/prisma/client.js";

// Setup the Postgres Adapter
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);

// Pass the adapter to the Client
const prisma = new PrismaClient({ adapter });
const redis = new Redis(process.env.REDIS_URL || "redis://localhost:6379");
const mongoUrl = process.env.MONGO_URL;

async function testConnections() {
  console.log("Starting Infrastructure test");

  try {
    //Mongo test
    if (!mongoUrl) {
      throw new Error("MONGO_URL is not defined in .env file");
    }
    await mongoose.connect(mongoUrl);
    console.log("Mongo connected");

    //Redis test
    await redis.set("test-key", "PulseStack_OK");
    const redisVal = await redis.get("test-key");
    console.log(`Redis: Connected (Verified:${redisVal})`);

    //Prisma test
    await prisma.$connect();
    console.log("Postgres connected");

    await redis.quit();
    await prisma.$disconnect();
    await mongoose.disconnect();

    process.exit(0);
  } catch (error) {
    console.log("Connection failed:", error);
    process.exit(1);
  }
}

testConnections();
