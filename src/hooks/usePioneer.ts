import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';

export type CreditType = 'friend_joined' | 'facebook_import' | 'profile_complete' | 'contacts_import';

interface PioneerStatus {
  id: string;
  user_id: string;
  credits: number;
  is_activated: boolean;
  activated_at?: string;
  created_at: string;
}

interface PioneerCredit {
  id: string;
  user_id: string;
  credit_type: CreditType;
  source_id?: string;
  created_at: string;
}

interface UsePioneerReturn {
  status: PioneerStatus | null;
  credits: PioneerCredit[];
  loading: boolean;
  error: string | null;
  isActivated: boolean;
  creditCount: number;
  creditsNeeded: number;
  refresh: () => Promise<void>;
  earnCredit: (type: CreditType, sourceId?: string) => Promise<boolean>;
  hasEarnedCredit: (type: CreditType, sourceId?: string) => boolean;
}

const CREDITS_REQUIRED = 5;

export function usePioneer(): UsePioneerReturn {
  const { user } = useAuth();
  const [status, setStatus] = useState<PioneerStatus | null>(null);
  const [credits, setCredits] = useState<PioneerCredit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPioneerData = useCallback(async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Fetch pioneer status
      let { data: statusData, error: statusError } = await supabase
        .from('pioneer_status')
        .select('*')
        .eq('user_id', user.id)
        .single();

      // If no status exists, create one
      if (statusError && statusError.code === 'PGRST116') {
        const { data: newStatus, error: createError } = await supabase
          .from('pioneer_status')
          .insert({ user_id: user.id })
          .select()
          .single();

        if (createError) throw createError;
        statusData = newStatus;
      } else if (statusError) {
        throw statusError;
      }

      setStatus(statusData);

      // Fetch credits
      const { data: creditsData, error: creditsError } = await supabase
        .from('pioneer_credits')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });

      if (creditsError) throw creditsError;
      setCredits(creditsData || []);

    } catch (err) {
      console.error('Error fetching pioneer data:', err);
      setError('Failed to load pioneer status');
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchPioneerData();
  }, [fetchPioneerData]);

  const hasEarnedCredit = useCallback((type: CreditType, sourceId?: string): boolean => {
    if (type === 'friend_joined' && sourceId) {
      return credits.some(c => c.credit_type === type && c.source_id === sourceId);
    }
    return credits.some(c => c.credit_type === type);
  }, [credits]);

  const earnCredit = useCallback(async (type: CreditType, sourceId?: string): Promise<boolean> => {
    if (!user?.id) return false;

    // Check if already earned
    if (hasEarnedCredit(type, sourceId)) {
      return false;
    }

    try {
      const { error } = await supabase
        .from('pioneer_credits')
        .insert({
          user_id: user.id,
          credit_type: type,
          source_id: sourceId || null,
        });

      if (error) {
        // Might be duplicate, ignore
        if (error.code === '23505') return false;
        throw error;
      }

      // Refresh data
      await fetchPioneerData();
      return true;
    } catch (err) {
      console.error('Error earning credit:', err);
      return false;
    }
  }, [user?.id, hasEarnedCredit, fetchPioneerData]);

  const creditCount = status?.credits || credits.length;
  const isActivated = status?.is_activated || creditCount >= CREDITS_REQUIRED;
  const creditsNeeded = Math.max(0, CREDITS_REQUIRED - creditCount);

  return {
    status,
    credits,
    loading,
    error,
    isActivated,
    creditCount,
    creditsNeeded,
    refresh: fetchPioneerData,
    earnCredit,
    hasEarnedCredit,
  };
}
