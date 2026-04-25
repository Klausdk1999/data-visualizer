import { useState, useEffect, useRef, useCallback } from "react";
import { getUserPreferences, updateUserPreferences } from "@/lib/requestHandlers";
import type { UserPreferences } from "@/types/widgets";

const DEBOUNCE_MS = 1000;

export function usePreferences(userId: number) {
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [loading, setLoading] = useState(true);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latestRef = useRef<UserPreferences | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getUserPreferences(userId)
      .then((prefs) => {
        if (!cancelled) {
          setPreferences(prefs);
          latestRef.current = prefs;
        }
      })
      .catch((err) => {
        console.error("Failed to load preferences:", err);
        if (!cancelled) {
          // Fallback to empty preferences so the UI still works
          setPreferences({});
          latestRef.current = {};
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [userId]);

  const savePreferences = useCallback(
    (partial: Partial<UserPreferences>) => {
      // Merge locally right away so the UI stays snappy
      const merged = { ...latestRef.current, ...partial } as UserPreferences;
      setPreferences(merged);
      latestRef.current = merged;

      // Debounce the API call
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        // Send the full merged preferences so the backend can do a simple
        // overwrite — avoids race conditions from concurrent partial updates.
        updateUserPreferences(userId, merged).catch((err) => {
          console.error("Failed to save preferences:", err);
        });
      }, DEBOUNCE_MS);
    },
    [userId]
  );

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return { preferences, loading, savePreferences };
}
