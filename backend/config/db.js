import mongoose from "mongoose";
export async function connectDB(uri) {
  mongoose.set("strictQuery", true);
  try {
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
      autoIndex: process.env.NODE_ENV !== "production",
    });
  } catch {
    await mongoose.disconnect();
    throw Object.assign(new Error("Database connection unavailable."), {
      code: "DB_UNAVAILABLE",
    });
  }
  const hello = await mongoose.connection.db.admin().command({ hello: 1 });
  if (!hello.setName && hello.msg !== "isdbgrid") {
    await mongoose.disconnect();
    throw Object.assign(
      new Error(
        "MongoDB replica set required for safe marketplace transactions.",
      ),
      { code: "DB_REPLICA_REQUIRED" },
    );
  }
}
