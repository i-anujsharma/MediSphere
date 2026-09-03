import { useEffect, useRef, useState } from "react";

// Plays a short beep using the Web Audio API (no audio file needed).
function playBeep() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();
    oscillator.type = "sine";
    oscillator.frequency.value = 880;
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    oscillator.connect(gain);
    gain.connect(ctx.destination);
    oscillator.start();
    oscillator.stop(ctx.currentTime + 0.5);
  } catch (err) {
    // Audio not available -- fail silently, the in-app modal still shows.
  }
}

// Checks every 30s whether any active reminder's time matches the current
// clock time (HH:MM). Fires once per reminder per day using a "firedToday"
// tracker so it doesn't repeat every 30 seconds.
export function useMedicineAlarm(reminders) {
  const [dueReminder, setDueReminder] = useState(null);
  const firedTodayRef = useRef(new Set());

  useEffect(() => {
    if (Notification && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      const currentHHMM = now.toTimeString().slice(0, 5);
      const todayKey = now.toDateString();

      reminders.forEach((r) => {
        if (!r.reminder_time) return;
        const reminderHHMM = r.reminder_time.slice(0, 5);
        const fireKey = `${r.id}-${todayKey}`;

        if (reminderHHMM === currentHHMM && !firedTodayRef.current.has(fireKey)) {
          firedTodayRef.current.add(fireKey);
          playBeep();
          setDueReminder(r);

          if (Notification && Notification.permission === "granted") {
            new Notification("Medicine reminder", {
              body: `Time to take ${r.medicine_name}${r.dosage ? ` (${r.dosage})` : ""}`,
            });
          }
        }
      });
    }, 30000);

    return () => clearInterval(interval);
  }, [reminders]);

  function dismiss() {
    setDueReminder(null);
  }

  return { dueReminder, dismiss };
}
