// Local notifications for medication doses.
//   npx expo install expo-notifications
import * as Notifications from "expo-notifications";
import type { Medication } from "@/types/baby";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

/** Ask once, early (e.g. first time the Medication screen opens). */
export async function ensureNotificationPermission() {
  const { status } = await Notifications.getPermissionsAsync();
  if (status === "granted") return true;
  const req = await Notifications.requestPermissionsAsync();
  return req.status === "granted";
}

/** "9:00 AM" -> { hour: 9, minute: 0 }. Named times fall back to sensible defaults. */
function parseTime(time: string): { hour: number; minute: number } {
  const named: Record<string, [number, number]> = {
    Morning: [8, 0],
    "After feed": [12, 0],
    Bedtime: [20, 0],
  };
  if (named[time]) return { hour: named[time][0], minute: named[time][1] };

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

  const { hour, minute } = parseTime(med.time);
  return Notifications.scheduleNotificationAsync({
    identifier: med.id,
    content: {
      title: `Time for ${med.name}`,
      body: `${med.dose} · ${med.time}`,
      sound: true,
    },
    trigger: { hour, minute, repeats: repeatDaily },
  });
}

export async function cancelMedicationReminder(medId: string) {
  await Notifications.cancelScheduledNotificationAsync(medId);
}
