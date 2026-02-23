import type { Schedule } from "./types";

function getCurrentTimeStr(now: Date): string {
  return `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
}

function isTimeInRange(currentTime: string, startTime: string, endTime: string): boolean {
  if (startTime <= endTime) {
    // Normal range: e.g. 09:00-17:00
    return currentTime >= startTime && currentTime < endTime;
  } else {
    // Cross-midnight: e.g. 22:00-06:00
    return currentTime >= startTime || currentTime < endTime;
  }
}

export function isWithinSchedule(schedules: Schedule[], now: Date): boolean {
  const currentDay = now.getDay(); // 0=Sun
  const currentTime = getCurrentTimeStr(now);

  return schedules.some(
    (s) =>
      s.enabled &&
      s.days.includes(currentDay) &&
      isTimeInRange(currentTime, s.startTime, s.endTime),
  );
}
