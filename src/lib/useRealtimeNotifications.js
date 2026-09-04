import { useEffect, useRef, useState } from "react";
import { supabase } from "../supabaseClient.js";

// Subscribes to live changes on `consultations` for one patient and turns
// "doctor replied" / "case accepted" transitions into toast notifications,
// without requiring a page refresh.
export function usePatientRealtimeNotifications(patientId, onChange) {
  const [toasts, setToasts] = useState([]);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  useEffect(() => {
    if (!patientId) return;

    const channel = supabase
      .channel(`patient-consultations-${patientId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "consultations",
          filter: `patient_id=eq.${patientId}`,
        },
        (payload) => {
          const before = payload.old;
          const after = payload.new;

          if (before.status !== "accepted" && after.status === "accepted") {
            pushToast("Case accepted", "A doctor has picked up your case.");
          }
          if (before.status !== "completed" && after.status === "completed") {
            pushToast("Doctor replied", "Your case has a new reply — check case history.");
          }

          onChangeRef.current?.();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [patientId]);

  function pushToast(title, body) {
    const id = crypto.randomUUID();
    setToasts((t) => [...t, { id, title, body }]);
    setTimeout(() => {
      setToasts((t) => t.filter((toast) => toast.id !== id));
    }, 6000);
  }

  function dismissToast(id) {
    setToasts((t) => t.filter((toast) => toast.id !== id));
  }

  return { toasts, dismissToast };
}
