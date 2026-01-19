import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { Friend, CONSTANTS } from '../types';
import { useAuth } from './useAuth';

interface UseFriendsReturn {
  activeFriends: Friend[];
  archivedFriends: Friend[];
  importPoolFriends: Friend[];
  pendingFriends: Friend[];
  loading: boolean;
  error: string | null;
  activeCount: number;
  archivedCount: number;
  isOverLimit: boolean;
  extraFriendsNeeded: number;
  refresh: () => Promise<void>;
  addFriend: (friendId: string) => Promise<void>;
  archiveFriend: (friendshipId: string) => Promise<void>;
  activateFriend: (friendshipId: string) => Promise<void>;
  removeFriend: (friendshipId: string) => Promise<void>;
  bulkArchive: (friendshipIds: string[]) => Promise<void>;
  bulkActivate: (friendshipIds: string[]) => Promise<void>;
}

export function useFriends(): UseFriendsReturn {
  const { user } = useAuth();
  const [activeFriends, setActiveFriends] = useState<Friend[]>([]);
  const [archivedFriends, setArchivedFriends] = useState<Friend[]>([]);
  const [importPoolFriends, setImportPoolFriends] = useState<Friend[]>([]);
  const [pendingFriends, setPendingFriends] = useState<Friend[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const activeCount = activeFriends.length;
  const archivedCount = archivedFriends.length;
  // Check if over limit (100 active OR 100 archived, or total > 200)
  const activeOverLimit = activeCount > CONSTANTS.FREE_ACTIVE_LIMIT;
  const archivedOverLimit = archivedCount > CONSTANTS.FREE_ARCHIVED_LIMIT;
  const isOverLimit = activeOverLimit || archivedOverLimit;
  const extraFriendsNeeded = Math.max(
    0,
    (activeCount - CONSTANTS.FREE_ACTIVE_LIMIT) + (archivedCount - CONSTANTS.FREE_ARCHIVED_LIMIT)
  );

  const fetchFriends = useCallback(async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('friends')
        .select(`
          *,
          friend_profile:profiles!friends_friend_id_fkey(*)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      const friends = data || [];
      
      setActiveFriends(friends.filter((f: Friend) => f.status === 'active'));
      setArchivedFriends(friends.filter((f: Friend) => f.status === 'archived'));
      setImportPoolFriends(friends.filter((f: Friend) => f.status === 'import_pool'));
      setPendingFriends(friends.filter((f: Friend) => f.status === 'pending'));
    } catch (err) {
      console.error('Error fetching friends:', err);
      setError('Failed to load friends');
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchFriends();
  }, [fetchFriends]);

  const addFriend = async (friendId: string) => {
    if (!user?.id) return;

    try {
      const { error } = await supabase
        .from('friends')
        .insert({
          user_id: user.id,
          friend_id: friendId,
          status: 'pending',
          source: 'manual',
        });

      if (error) throw error;
      await fetchFriends();
    } catch (err) {
      console.error('Error adding friend:', err);
      throw err;
    }
  };

  const archiveFriend = async (friendshipId: string) => {
    try {
      const { error } = await supabase
        .from('friends')
        .update({
          status: 'archived',
          archived_at: new Date().toISOString(),
        })
        .eq('id', friendshipId);

      if (error) throw error;
      await fetchFriends();
    } catch (err) {
      console.error('Error archiving friend:', err);
      throw err;
    }
  };

  const activateFriend = async (friendshipId: string) => {
    try {
      const { error } = await supabase
        .from('friends')
        .update({
          status: 'active',
          archived_at: null,
        })
        .eq('id', friendshipId);

      if (error) throw error;
      await fetchFriends();
    } catch (err) {
      console.error('Error activating friend:', err);
      throw err;
    }
  };

  const removeFriend = async (friendshipId: string) => {
    try {
      const { error } = await supabase
        .from('friends')
        .delete()
        .eq('id', friendshipId);

      if (error) throw error;
      await fetchFriends();
    } catch (err) {
      console.error('Error removing friend:', err);
      throw err;
    }
  };

  const bulkArchive = async (friendshipIds: string[]) => {
    try {
      const { error } = await supabase
        .from('friends')
        .update({
          status: 'archived',
          archived_at: new Date().toISOString(),
        })
        .in('id', friendshipIds);

      if (error) throw error;
      await fetchFriends();
    } catch (err) {
      console.error('Error bulk archiving:', err);
      throw err;
    }
  };

  const bulkActivate = async (friendshipIds: string[]) => {
    try {
      const { error } = await supabase
        .from('friends')
        .update({
          status: 'active',
          archived_at: null,
        })
        .in('id', friendshipIds);

      if (error) throw error;
      await fetchFriends();
    } catch (err) {
      console.error('Error bulk activating:', err);
      throw err;
    }
  };

  return {
    activeFriends,
    archivedFriends,
    importPoolFriends,
    pendingFriends,
    loading,
    error,
    activeCount,
    archivedCount,
    isOverLimit,
    extraFriendsNeeded,
    refresh: fetchFriends,
    addFriend,
    archiveFriend,
    activateFriend,
    removeFriend,
    bulkArchive,
    bulkActivate,
  };
}
