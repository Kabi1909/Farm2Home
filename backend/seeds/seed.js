import mongoose from "mongoose";
import { loadConfig } from "../config/env.js";
import { connectDB } from "../config/db.js";
import { seedData } from "./seedData.js";

try {
  const config = loadConfig();
  await connectDB(config.MONGO_URI);
  await Promise.all(
    Object.values(mongoose.models).map((model) => model.init()),
  );
  console.log(
    await seedData({ ...config, SEED_PASSWORD: process.env.SEED_PASSWORD }),
  );
  console.log(
    "Created fictional demo data. Accounts use farmer1–10/customer1–20@farm2home.example.",
  );
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
} finally {
  await mongoose.disconnect();
}
