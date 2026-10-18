// Background scheduling needs a push backend; never imply it is active here.
export async function requestNotificationPermissions() { return false; }
export async function cancelAllReminders() {}
export async function scheduleClassReminders() {}
export async function scheduleWeeklyDigest() {}
