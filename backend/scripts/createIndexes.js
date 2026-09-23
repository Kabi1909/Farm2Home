import mongoose from "mongoose";
import { loadConfig } from "../config/env.js";
import { connectDB } from "../config/db.js";
import "../routes/index.js";

try {
  const config = loadConfig();
  await connectDB(config.MONGO_URI);
  // createIndexes does not remove existing indexes or modify documents.
  for (const model of Object.values(mongoose.models)) {
    await model.createIndexes();
    console.log(`Indexes ready: ${model.modelName}`);
  }
} catch {
  console.error(
    "Index setup failed. Check database access and resolve duplicate records before retrying.",
  );
  process.exitCode = 1;
} finally {
  await mongoose.disconnect();
}
