/**
 * Notification dispatch. Phase 12 will send email / web push / FCM.
 * Safe no-op until credentials exist.
 */
export async function notifyOwner(_input: {
  userId: string;
  title: string;
  body: string;
}): Promise<void> {
  return;
}
