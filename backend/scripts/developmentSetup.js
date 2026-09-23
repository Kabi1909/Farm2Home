import { randomBytes } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { createServer } from "node:net";

export const backendDirectory = fileURLToPath(new URL("../", import.meta.url));
export const localMongoUri =
  "mongodb://127.0.0.1:27018/farm2home?replicaSet=farm2home-dev";

export async function prepareDevelopmentEnv(directory = backendDirectory) {
  const path = `${directory}/.env`;
  try {
    await readFile(path);
    return false;
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }
  const contents = [
    "# Private local development configuration. Never commit this file.",
    "NODE_ENV=development",
    "PORT=5000",
    "DEV_LOCAL_DB=true",
    `MONGO_URI=${localMongoUri}`,
    `JWT_SECRET=${randomBytes(48).toString("hex")}`,
    "JWT_EXPIRES_IN=7d",
    "FRONTEND_URL=http://localhost:5173",
    "AI_SERVICE_URL=http://localhost:8000",
    "AI_SERVICE_TIMEOUT_MS=5000",
    "DELIVERY_CHARGE=250",
    "LOW_STOCK_THRESHOLD=5",
    "",
  ].join("\n");
  try {
    await writeFile(path, contents, { flag: "wx", mode: 0o600 });
    return true;
  } catch (error) {
    if (error.code === "EEXIST") return false;
    throw error;
  }
}

export async function startLocalDatabase() {
  await assertLocalPortAvailable();
  const { MongoMemoryReplSet } = await import("mongodb-memory-server");
  const dbPath = `${backendDirectory}/.local/mongodb`;
  await mkdir(dbPath, { recursive: true });
  // WiredTiger uses a persistent directory; stopping never deletes its records.
  const database = new MongoMemoryReplSet({
    binary: {
      downloadDir: `${backendDirectory}/node_modules/.cache/mongodb-binaries`,
    },
    instanceOpts: [{ port: 27018, dbPath }],
    replSet: {
      count: 1,
      name: "farm2home-dev",
      ip: "127.0.0.1",
      storageEngine: "wiredTiger",
    },
  });
  try {
    await database.start();
    if (new URL(database.getUri()).port !== "27018") {
      throw Object.assign(new Error("Development database port is occupied."), {
        code: "EADDRINUSE",
      });
    }
    return database;
  } catch (error) {
    await database.stop({ doCleanup: false }).catch(() => {});
    throw error;
  }
}

export async function assertLocalPortAvailable(port = 27018) {
  await new Promise((resolve, reject) => {
    const socket = createServer();
    socket.once("error", reject);
    socket.listen({ port, host: "127.0.0.1", exclusive: true }, () =>
      socket.close(resolve),
    );
  });
}
