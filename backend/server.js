import { startBackgroundJobs } from "./services/backgroundJobs.js";
import mongoose from "mongoose";
import { loadConfig } from "./config/env.js";
import { connectDB } from "./config/db.js";
import { createApp } from "./app.js";
try {
  const config = loadConfig();
  await connectDB(config.MONGO_URI);
  const stopJobs = startBackgroundJobs(config);
  const { default: routes } = await import("./routes/index.js");
  const server = createApp(config, routes).listen(config.PORT, () =>
    console.log(`Farm2Home API listening on port ${config.PORT}`),
  );
  for (const signal of ["SIGTERM", "SIGINT"])
    process.on(signal, () => {
      stopJobs();
      server.close(async () => {
        await mongoose.disconnect();
        process.exit(0);
      });
      setTimeout(() => process.exit(1), 10000).unref();
    });
} catch (error) {
  console.error(
    "API startup failed. Check configuration and MongoDB replica-set availability.",
  );
  process.exitCode = 1;
}
