import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, readFile, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve, sep } from "node:path";
import { createServer } from "node:net";
import { once } from "node:events";
import {
  prepareDevelopmentEnv,
  localMongoUri,
  assertLocalPortAvailable,
} from "../scripts/developmentSetup.js";
import { startupMessage } from "../utils/startupError.js";

test("development setup creates a private config once and preserves existing settings", async () => {
  const directory = await mkdtemp(join(tmpdir(), "farm2home-config-"));
  try {
    assert.equal(await prepareDevelopmentEnv(directory), true);
    const first = await readFile(join(directory, ".env"), "utf8");
    assert.ok(first.includes(`MONGO_URI=${localMongoUri}`));
    assert.match(first, /JWT_SECRET=[a-f0-9]{96}/);
    assert.equal(await prepareDevelopmentEnv(directory), false);
    assert.equal(await readFile(join(directory, ".env"), "utf8"), first);
    await writeFile(join(directory, ".env"), "EXISTING_CONFIG=preserve\n");
    assert.equal(await prepareDevelopmentEnv(directory), false);
    assert.equal(
      await readFile(join(directory, ".env"), "utf8"),
      "EXISTING_CONFIG=preserve\n",
    );
  } finally {
    // Only remove the exact temporary directory created by this test.
    assert.ok(
      resolve(directory).startsWith(
        `${resolve(tmpdir())}${sep}farm2home-config-`,
      ),
    );
    await rm(directory, { recursive: true, force: true });
  }
});

test("occupied local database ports are rejected before MongoDB starts", async () => {
  const socket = createServer().listen(0, "127.0.0.1");
  await once(socket, "listening");
  const port = socket.address().port;
  try {
    await assert.rejects(assertLocalPortAvailable(port), {
      code: "EADDRINUSE",
    });
  } finally {
    await new Promise((resolve) => socket.close(resolve));
  }
  await assertLocalPortAvailable(port);
});

test("startup diagnostics never echo raw database errors or connection credentials", () => {
  const message = startupMessage({
    code: "DB_UNAVAILABLE",
    message: "mongodb://user:secret@example.test",
  });
  assert.match(message, /Cannot connect/);
  assert.equal(message.includes("secret"), false);
  assert.match(startupMessage({ code: "EADDRINUSE" }), /port/);
});
