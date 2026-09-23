export function startupMessage(error) {
  if (error.code === "CONFIG_INVALID") return error.message;
  if (error.code === "DB_REPLICA_REQUIRED")
    return "MongoDB must be a replica set. Run npm run dev for managed local development, or configure an Atlas/replica-set MONGO_URI.";
  if (error.code === "DB_UNAVAILABLE")
    return "Cannot connect to MongoDB. Check MONGO_URI and start your database. For managed local development, set DEV_LOCAL_DB=true and use the local URI documented in README.md.";
  if (error.code === "EADDRINUSE")
    return "The configured port is already in use. Stop the existing API/database process or select a different API PORT.";
  return "Startup failed. Check local filesystem permissions and MongoDB availability. On the first managed development run, MongoDB must be downloadable.";
}
