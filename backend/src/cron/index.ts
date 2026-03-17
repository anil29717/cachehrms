import cron from 'node-cron';

/** Run a job every 10 minutes. Cron expression: at 0, 10, 20, 30, 40, 50 minutes of every hour. */
const EVERY_10_MINUTES = '*/10 * * * *';

/**
 * Task that runs every 10 minutes. Add your logic here (e.g. cleanup, sync, notifications).
 */
async function runScheduledTask(): Promise<void> {
  const now = new Date().toISOString();
  console.log(`[Cron] Every-10-min job ran at ${now}`);
  // Add your scheduled logic here, e.g.:
  // - Clean up expired tokens
  // - Sync external data
  // - Send reminder notifications
  // - Aggregate reports
}

/**
 * Start the cron scheduler. Call this after the server is ready.
 */
export function startCron(): void {
  cron.schedule(EVERY_10_MINUTES, () => {
    runScheduledTask().catch((err) => {
      console.error('[Cron] Scheduled task error:', err);
    });
  });
  console.log('[Cron] Scheduler started (runs every 10 minutes)');
}
