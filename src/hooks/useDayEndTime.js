import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../config/supabase';

// Matches the web app's own DEFAULT_DAY_END_TIME (lib/schedulingHours.js) —
// used only until the real setting loads, or if the row is ever missing.
const DEFAULT_DAY_END_MINUTES = 17 * 60 + 30; // 17:30

function timeToMinutes(t) {
  if (!t) return null;
  const [h, m] = String(t).split(':').map(Number);
  return h * 60 + (m || 0);
}

// Mirrors scheduling_day_settings.day_end_time — the single global ceiling
// Manage's own grid/reports/exports already use (see lib/schedulingHours.js
// on the web side) — so every student's mobile timetable shows the same
// window, regardless of whether their own classes happen to reach it.
export default function useDayEndTime() {
  const [dayEndMinutes, setDayEndMinutes] = useState(DEFAULT_DAY_END_MINUTES);
  const [loading, setLoading] = useState(true);

  const check = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from('scheduling_day_settings')
      .select('day_end_time')
      .limit(1)
      .maybeSingle();
    setDayEndMinutes(timeToMinutes(data?.day_end_time) ?? DEFAULT_DAY_END_MINUTES);
    setLoading(false);
  }, []);

  useEffect(() => {
    check();
  }, [check]);

  return { dayEndMinutes, loading, refetch: check };
}
