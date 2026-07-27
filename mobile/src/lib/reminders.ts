// Local notifications for medication doses.
import * as Notifications from "expo-notifications";
import type { Medication } from "@/types/medication";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

/** Ask once, early (e.g. first time the Medication screen opens). */
export async function ensureNotificationPermission() {
  const { status } = await Notifications.getPermissionsAsync();
  if (status === "granted") return true;
  const req = await Notifications.requestPermissionsAsync();
  return req.status === "granted";
}

/** "9:00 AM" -> { hour: 9, minute: 0 } (24h). Unparseable input falls back to 9:00 AM. */
function parseTime(time: string): { hour: number; minute: number } {
  const m = time.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);
  if (!m) return { hour: 9, minute: 0 };
  let hour = parseInt(m[1], 10);
  const minute = parseInt(m[2], 10);
  const suffix = m[3]?.toUpperCase();
  if (suffix === "PM" && hour < 12) hour += 12;
  if (suffix === "AM" && hour === 12) hour = 0;
  return { hour, minute };
}

export async function scheduleMedicationReminder(med: Medication, repeatDaily = true) {
  const granted = await ensureNotificationPermission();
  if (!granted) return null;

  const { hour, minute } = parseTime(med.timeOfDay);
  return Notifications.scheduleNotificationAsync({
    identifier: med.guidId,
    content: {
      title: `Time for ${med.name}`,
      body: med.dose ? `${med.dose} · ${med.timeOfDay}` : med.timeOfDay,
      sound: true,
    },
    trigger: repeatDaily
      ? { type: Notifications.SchedulableTriggerInputTypes.DAILY, hour, minute }
      : { type: Notifications.SchedulableTriggerInputTypes.CALENDAR, hour, minute, repeats: false },
  });
}

export async function cancelMedicationReminder(medId: string) {
  await Notifications.cancelScheduledNotificationAsync(medId);
}
