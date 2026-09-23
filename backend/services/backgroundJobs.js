import { cloudAdapter, processCleanup } from "./cloudinaryService.js";
import { recordMarketPrices } from "./priceHistoryService.js";

export function startBackgroundJobs(config) {
  let stopped = false;
  const timers = new Set();
  function schedule(task, delay, label) {
    async function run() {
      try {
        await task();
      } catch {
        console.error(`${label} failed; the next scheduled run will retry.`);
      }
      if (stopped) return;
      const timer = setTimeout(() => {
        timers.delete(timer);
        void run();
      }, delay);
      timer.unref();
      timers.add(timer);
    }
    void run();
  }
  schedule(() => recordMarketPrices(), 60 * 60 * 1000, "Price snapshot");
  if (
    config.CLOUDINARY_CLOUD_NAME &&
    config.CLOUDINARY_API_KEY &&
    config.CLOUDINARY_API_SECRET
  ) {
    schedule(
      () => processCleanup(cloudAdapter(config)),
      60000,
      "Image cleanup",
    );
  }
  return () => {
    stopped = true;
    timers.forEach(clearTimeout);
    timers.clear();
  };
}
