import { startBackgroundJobs } from "./services/backgroundJobs.js";
import mongoose from "mongoose";
import { loadConfig } from "./config/env.js";
import { connectDB } from "./config/db.js";
import { createApp } from "./app.js";
import { once } from "node:events";
import { startupMessage } from "./utils/startupError.js";
try {
  const config = loadConfig();
  await connectDB(config.MONGO_URI);
  const { default: routes } = await import("./routes/index.js");
  const server = createApp(config, routes).listen(config.PORT);
  await once(server, "listening");
  console.log(`Farm2Home API listening on port ${config.PORT}`);
  const stopJobs = startBackgroundJobs(config);
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
  console.error(startupMessage(error));
  await mongoose.disconnect();
  process.exitCode = 1;
}
