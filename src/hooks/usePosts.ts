import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { Post } from '../types';
import { useAuth } from './useAuth';

interface UsePostsReturn {
  posts: Post[];
  loading: boolean;
  error: string | null;
  refreshing: boolean;
  hasMore: boolean;
  refresh: () => Promise<void>;
  loadMore: () => Promise<void>;
  createPost: (content: string, mediaUrls?: string[], postType?: Post['post_type']) => Promise<void>;
  deletePost: (postId: string) => Promise<void>;
  reactToPost: (postId: string, reactionType: string) => Promise<void>;
  removeReaction: (postId: string) => Promise<void>;
}

const PAGE_SIZE = 20;

export function usePosts(): UsePostsReturn {
  const { user } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);

  const fetchPosts = useCallback(async (pageNum: number, isRefresh: boolean = false) => {
    if (!user?.id) return;

    try {
      if (isRefresh) {
        setRefreshing(true);
      } else if (pageNum === 0) {
        setLoading(true);
      }
      setError(null);

      // Get active friend IDs
      const { data: friends } = await supabase
        .from('friends')
        .select('friend_id')
        .eq('user_id', user.id)
        .eq('status', 'active');

      const friendIds = friends?.map(f => f.friend_id) || [];
      const allUserIds = [user.id, ...friendIds];

      // Fetch posts from user and active friends (chronological - NO ALGORITHM)
      const { data, error: fetchError } = await supabase
        .from('posts')
        .select(`
          *,
          author:profiles!posts_user_id_fkey(*),
          reactions_count:reactions(count),
          comments_count:comments(count),
          user_reaction:reactions!left(type)
        `)
        .in('user_id', allUserIds)
        .eq('visibility', 'circle')
        .eq('reactions.user_id', user.id)
        .order('created_at', { ascending: false })
        .range(pageNum * PAGE_SIZE, (pageNum + 1) * PAGE_SIZE - 1);

      if (fetchError) throw fetchError;

      // Transform user_reaction from array to single value
      const newPosts = (data || []).map(post => ({
        ...post,
        user_reaction: post.user_reaction?.[0]?.type || null,
      }));
      
      if (isRefresh || pageNum === 0) {
        setPosts(newPosts);
      } else {
        setPosts(prev => [...prev, ...newPosts]);
      }

      setHasMore(newPosts.length === PAGE_SIZE);
      setPage(pageNum);
    } catch (err) {
      console.error('Error fetching posts:', err);
      setError('Failed to load posts');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchPosts(0);
  }, [fetchPosts]);

  const refresh = async () => {
    await fetchPosts(0, true);
  };

  const loadMore = async () => {
    if (!hasMore || loading) return;
    await fetchPosts(page + 1);
  };

  const createPost = async (
    content: string,
    mediaUrls?: string[],
    postType: Post['post_type'] = 'text'
  ) => {
    if (!user?.id) return;

    try {
      const { error } = await supabase
        .from('posts')
        .insert({
          user_id: user.id,
          content,
          media_urls: mediaUrls,
          post_type: postType,
          visibility: 'circle',
        });

      if (error) throw error;
      await refresh();
    } catch (err) {
      console.error('Error creating post:', err);
      throw err;
    }
  };

  const deletePost = async (postId: string) => {
    try {
      const { error } = await supabase
        .from('posts')
        .delete()
        .eq('id', postId)
        .eq('user_id', user?.id);

      if (error) throw error;
      setPosts(prev => prev.filter(p => p.id !== postId));
    } catch (err) {
      console.error('Error deleting post:', err);
      throw err;
    }
  };

  const reactToPost = async (postId: string, reactionType: string) => {
    if (!user?.id) return;

    try {
      // Upsert reaction (one per user per post)
      const { error } = await supabase
        .from('reactions')
        .upsert({
          post_id: postId,
          user_id: user.id,
          type: reactionType,
        }, {
          onConflict: 'post_id,user_id',
        });

      if (error) throw error;
    } catch (err) {
      console.error('Error reacting to post:', err);
      throw err;
    }
  };

  const removeReaction = async (postId: string) => {
    if (!user?.id) return;

    try {
      const { error } = await supabase
        .from('reactions')
        .delete()
        .eq('post_id', postId)
        .eq('user_id', user.id);

      if (error) throw error;
    } catch (err) {
      console.error('Error removing reaction:', err);
      throw err;
    }
  };

  return {
    posts,
    loading,
    error,
    refreshing,
    hasMore,
    refresh,
    loadMore,
    createPost,
    deletePost,
    reactToPost,
    removeReaction,
  };
}
