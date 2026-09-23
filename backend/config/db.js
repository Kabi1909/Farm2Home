import mongoose from "mongoose";
export async function connectDB(uri) {
  mongoose.set("strictQuery", true);
  await mongoose.connect(uri, {
    serverSelectionTimeoutMS: 5000,
    autoIndex: process.env.NODE_ENV !== "production",
  });
  const hello = await mongoose.connection.db.admin().command({ hello: 1 });
  if (!hello.setName && hello.msg !== "isdbgrid") {
    await mongoose.disconnect();
    throw new Error(
      "MongoDB replica set required for safe marketplace transactions.",
    );
  }
}
