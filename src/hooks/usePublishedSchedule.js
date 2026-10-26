import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../config/supabase';

// Mirrors the web app's own publish check (schedule_publications.status === 'published'
// for the term) so "published" means the same thing on both sides.
export default function usePublishedSchedule(termId) {
  const [isPublished, setIsPublished] = useState(false);
  const [loading, setLoading] = useState(true);

  const check = useCallback(async () => {
    if (!termId) {
      setIsPublished(false);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data } = await supabase
      .from('schedule_publications')
      .select('id')
      .eq('term_id', termId)
      .eq('status', 'published')
      .maybeSingle();
    setIsPublished(!!data);
    setLoading(false);
  }, [termId]);

  useEffect(() => {
    check();
  }, [check]);

  return { isPublished, loading, refetch: check };
}
