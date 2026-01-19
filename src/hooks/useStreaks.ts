import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { Streak, Badge, UserBadge } from '../types';
import { useAuth } from './useAuth';

export type StreakType = 'cull' | 'post' | 'general';

interface StreakData {
  cull_streak: number;
  post_streak: number;
  longest_cull_streak: number;
  longest_post_streak: number;
  last_cull_date?: string;
  last_post_date?: string;
}

interface UseStreaksReturn {
  streak: Streak | null;
  streakData: StreakData;
  badges: UserBadge[];
  allBadges: Badge[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  recordAction: (type?: StreakType) => Promise<void>;
  recordCullAction: () => Promise<void>;
  recordPostAction: () => Promise<void>;
}

export function useStreaks(): UseStreaksReturn {
  const { user } = useAuth();
  const [streak, setStreak] = useState<Streak | null>(null);
  const [streakData, setStreakData] = useState<StreakData>({
    cull_streak: 0,
    post_streak: 0,
    longest_cull_streak: 0,
    longest_post_streak: 0,
  });
  const [badges, setBadges] = useState<UserBadge[]>([]);
  const [allBadges, setAllBadges] = useState<Badge[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStreakData = useCallback(async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      setError(null);

      // Fetch user's streak
      const { data: streakData, error: streakError } = await supabase
        .from('streaks')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (streakError && streakError.code !== 'PGRST116') {
        throw streakError;
      }

      setStreak(streakData);

      // Fetch user's earned badges
      const { data: userBadges, error: badgesError } = await supabase
        .from('user_badges')
        .select(`
          *,
          badge:badges(*)
        `)
        .eq('user_id', user.id);

      if (badgesError) throw badgesError;
      setBadges(userBadges || []);

      // Fetch all available badges
      const { data: allBadgesData, error: allBadgesError } = await supabase
        .from('badges')
        .select('*')
        .order('requirement_value', { ascending: true });

      if (allBadgesError) throw allBadgesError;
      setAllBadges(allBadgesData || []);

    } catch (err) {
      console.error('Error fetching streak data:', err);
      setError('Failed to load streak data');
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchStreakData();
  }, [fetchStreakData]);

  const recordAction = useCallback(async () => {
    if (!user?.id) return;

    try {
      const today = new Date().toISOString().split('T')[0];

      if (streak) {
        const lastActionDate = streak.last_action_date?.split('T')[0];
        const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

        let newStreak = streak.current_streak;
        
        if (lastActionDate === today) {
          // Already recorded today, no change
          return;
        } else if (lastActionDate === yesterday) {
          // Continuing streak
          newStreak = streak.current_streak + 1;
        } else {
          // Streak broken, start fresh
          newStreak = 1;
        }

        const newLongest = Math.max(newStreak, streak.longest_streak);

        const { error } = await supabase
          .from('streaks')
          .update({
            current_streak: newStreak,
            longest_streak: newLongest,
            last_action_date: today,
          })
          .eq('id', streak.id);

        if (error) throw error;
      } else {
        // Create new streak record
        const { error } = await supabase
          .from('streaks')
          .insert({
            user_id: user.id,
            current_streak: 1,
            longest_streak: 1,
            last_action_date: today,
          });

        if (error) throw error;
      }

      // Check for new badges
      await checkAndAwardBadges();
      await fetchStreakData();
    } catch (err) {
      console.error('Error recording action:', err);
      throw err;
    }
  }, [user?.id, streak, fetchStreakData]);

  const checkAndAwardBadges = async () => {
    if (!user?.id || !streak) return;

    try {
      // Get badges not yet earned
      const earnedBadgeIds = badges.map(b => b.badge_id);
      const unearned = allBadges.filter(b => !earnedBadgeIds.includes(b.id));

      for (const badge of unearned) {
        let earned = false;

        if (badge.requirement_type === 'streak_days') {
          earned = streak.current_streak >= badge.requirement_value;
        }
        // Add more badge type checks here (cull_count, archive_count, etc.)

        if (earned) {
          await supabase
            .from('user_badges')
            .insert({
              user_id: user.id,
              badge_id: badge.id,
            });
        }
      }
    } catch (err) {
      console.error('Error checking badges:', err);
    }
  };

  const recordCullAction = useCallback(async () => {
    await recordAction();
  }, [recordAction]);

  const recordPostAction = useCallback(async () => {
    await recordAction();
  }, [recordAction]);

  return {
    streak,
    streakData,
    badges,
    allBadges,
    loading,
    error,
    refresh: fetchStreakData,
    recordAction,
    recordCullAction,
    recordPostAction,
  };
}
