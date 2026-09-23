import { spawn } from "node:child_process";
import {
  backendDirectory,
  localMongoUri,
  prepareDevelopmentEnv,
  startLocalDatabase,
} from "./developmentSetup.js";
import { startupMessage } from "../utils/startupError.js";

let database;
let child;
let stopping = false;

async function stop(code = 0) {
  if (stopping) return;
  stopping = true;
  if (child && child.exitCode === null) {
    await new Promise((resolve) => {
      child.once("exit", resolve);
      child.kill("SIGTERM");
      setTimeout(resolve, 5000).unref();
    });
  }
  await database?.stop({ doCleanup: false });
  process.exitCode = code;
}

try {
  if (await prepareDevelopmentEnv())
    console.log("Created backend/.env with a private development secret.");
  const { loadConfig } = await import("../config/env.js");
  const config = loadConfig();
  if (config.DEV_LOCAL_DB) {
    if (
      config.NODE_ENV !== "development" ||
      config.MONGO_URI !== localMongoUri
    ) {
      throw Object.assign(
        new Error(
          `Managed MongoDB requires NODE_ENV=development and MONGO_URI=${localMongoUri}. Set DEV_LOCAL_DB=false to use your own database.`,
        ),
        { code: "CONFIG_INVALID" },
      );
    }
    console.log("Starting persistent local MongoDB on 127.0.0.1:27018…");
    database = await startLocalDatabase();
  }
  child = spawn(process.execPath, ["--watch", "server.js"], {
    cwd: backendDirectory,
    env: process.env,
    stdio: "inherit",
    windowsHide: true,
  });
  child.once("error", async (error) => {
    console.error(startupMessage(error));
    await stop(1);
  });
  child.once("exit", (code) => {
    void stop(code || 0);
  });
  for (const signal of ["SIGINT", "SIGTERM"])
    process.once(signal, () => {
      void stop();
    });
} catch (error) {
  console.error(startupMessage(error));
  await stop(1);
}
