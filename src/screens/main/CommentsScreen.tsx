import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, typography, shadows } from '../../lib/theme';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';
import { Comment, Post } from '../../types';

interface CommentWithAuthor extends Omit<Comment, 'author'> {
  author?: {
    id: string;
    full_name: string;
    avatar_url: string | null;
  };
}

export default function CommentsScreen({ route, navigation }: any) {
  const { postId, post } = route.params;
  const { user, profile } = useAuth();
  const [comments, setComments] = useState<CommentWithAuthor[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [newComment, setNewComment] = useState('');
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    fetchComments();

    // Subscribe to new comments
    const channel = supabase
      .channel(`comments:${postId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'comments',
        filter: `post_id=eq.${postId}`,
      }, (payload) => {
        fetchComments(); // Refresh to get author info
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [postId]);

  const fetchComments = async () => {
    try {
      const { data, error } = await supabase
        .from('comments')
        .select(`
          *,
          author:profiles!comments_user_id_fkey(id, full_name, avatar_url)
        `)
        .eq('post_id', postId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setComments(data || []);
    } catch (error) {
      console.error('Error fetching comments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!newComment.trim() || !user?.id || sending) return;

    const commentText = newComment.trim();
    setNewComment('');
    setSending(true);

    try {
      const { error } = await supabase.from('comments').insert({
        post_id: postId,
        user_id: user.id,
        content: commentText,
      });

      if (error) throw error;

      // Optimistically add comment
      const optimisticComment: CommentWithAuthor = {
        id: Date.now().toString(),
        post_id: postId,
        user_id: user.id,
        content: commentText,
        created_at: new Date().toISOString(),
        author: {
          id: user.id,
          full_name: profile?.full_name || 'You',
          avatar_url: profile?.avatar_url || null,
        },
      };
      setComments(prev => [...prev, optimisticComment]);
    } catch (error) {
      console.error('Error posting comment:', error);
      setNewComment(commentText); // Restore on error
    } finally {
      setSending(false);
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();

    if (diff < 60000) return 'now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h`;
    if (diff < 604800000) return `${Math.floor(diff / 86400000)}d`;
    return date.toLocaleDateString();
  };

  const renderComment = ({ item }: { item: CommentWithAuthor }) => (
    <View style={styles.commentItem}>
      <View style={styles.commentAvatar}>
        {item.author?.avatar_url ? (
          <Image source={{ uri: item.author.avatar_url }} style={styles.avatarImage} />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <Text style={styles.avatarText}>
              {item.author?.full_name?.charAt(0) || '?'}
            </Text>
          </View>
        )}
      </View>
      <View style={styles.commentContent}>
        <View style={styles.commentBubble}>
          <Text style={styles.commentAuthor}>{item.author?.full_name || 'Unknown'}</Text>
          <Text style={styles.commentText}>{item.content}</Text>
        </View>
        <Text style={styles.commentTime}>{formatTime(item.created_at)}</Text>
      </View>
    </View>
  );

  const renderHeader = () => {
    if (!post) return null;

    return (
      <View style={styles.postPreview}>
        <View style={styles.postHeader}>
          <View style={styles.postAvatar}>
            {post.author?.avatar_url ? (
              <Image source={{ uri: post.author.avatar_url }} style={styles.postAvatarImage} />
            ) : (
              <View style={styles.postAvatarPlaceholder}>
                <Text style={styles.postAvatarText}>
                  {post.author?.full_name?.charAt(0) || '?'}
                </Text>
              </View>
            )}
          </View>
          <View>
            <Text style={styles.postAuthorName}>{post.author?.full_name || 'Unknown'}</Text>
            <Text style={styles.postTime}>{formatTime(post.created_at)}</Text>
          </View>
        </View>
        <Text style={styles.postContent} numberOfLines={3}>{post.content}</Text>
        <View style={styles.divider} />
        <Text style={styles.commentsTitle}>
          {comments.length} {comments.length === 1 ? 'Comment' : 'Comments'}
        </Text>
      </View>
    );
  };

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="chatbubble-outline" size={48} color={colors.mediumGray} />
      <Text style={styles.emptyText}>No comments yet</Text>
      <Text style={styles.emptySubtext}>Be the first to comment!</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={colors.deepBlue} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Comments</Text>
          <View style={styles.headerSpacer} />
        </View>

        {/* Comments List */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.accent} />
          </View>
        ) : (
          <FlatList
            data={comments}
            renderItem={renderComment}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            ListHeaderComponent={renderHeader}
            ListEmptyComponent={renderEmpty}
            showsVerticalScrollIndicator={false}
          />
        )}

        {/* Input Area */}
        <View style={styles.inputContainer}>
          <View style={styles.inputWrapper}>
            <TextInput
              ref={inputRef}
              style={styles.input}
              placeholder="Write a comment..."
              placeholderTextColor={colors.mediumGray}
              value={newComment}
              onChangeText={setNewComment}
              multiline
              maxLength={500}
            />
            <TouchableOpacity
              style={[
                styles.sendButton,
                (!newComment.trim() || sending) && styles.sendButtonDisabled,
              ]}
              onPress={handleSubmit}
              disabled={!newComment.trim() || sending}
            >
              {sending ? (
                <ActivityIndicator size="small" color={colors.warmWhite} />
              ) : (
                <Ionicons name="send" size={20} color={colors.warmWhite} />
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.warmWhite,
  },
  keyboardView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGray,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: typography.lg,
    fontWeight: typography.semibold,
    color: colors.deepBlue,
  },
  headerSpacer: {
    width: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    paddingBottom: spacing.md,
  },
  postPreview: {
    padding: spacing.md,
    backgroundColor: colors.babyBlue,
    marginBottom: spacing.sm,
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  postAvatar: {
    marginRight: spacing.sm,
  },
  postAvatarImage: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  postAvatarPlaceholder: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.sky,
    alignItems: 'center',
    justifyContent: 'center',
  },
  postAvatarText: {
    fontSize: typography.base,
    fontWeight: typography.semibold,
    color: colors.deepBlue,
  },
  postAuthorName: {
    fontSize: typography.sm,
    fontWeight: typography.semibold,
    color: colors.deepBlue,
  },
  postTime: {
    fontSize: typography.xs,
    color: colors.softGray,
  },
  postContent: {
    fontSize: typography.base,
    color: colors.deepBlue,
    lineHeight: 22,
  },
  divider: {
    height: 1,
    backgroundColor: colors.lightGray,
    marginVertical: spacing.md,
  },
  commentsTitle: {
    fontSize: typography.sm,
    fontWeight: typography.semibold,
    color: colors.softGray,
  },
  commentItem: {
    flexDirection: 'row',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  commentAvatar: {
    marginRight: spacing.sm,
  },
  avatarImage: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  avatarPlaceholder: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.sky,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: typography.sm,
    fontWeight: typography.semibold,
    color: colors.deepBlue,
  },
  commentContent: {
    flex: 1,
  },
  commentBubble: {
    backgroundColor: colors.lightGray,
    borderRadius: borderRadius.lg,
    padding: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  commentAuthor: {
    fontSize: typography.sm,
    fontWeight: typography.semibold,
    color: colors.deepBlue,
    marginBottom: 2,
  },
  commentText: {
    fontSize: typography.base,
    color: colors.deepBlue,
    lineHeight: 20,
  },
  commentTime: {
    fontSize: typography.xs,
    color: colors.mediumGray,
    marginTop: 4,
    marginLeft: spacing.sm,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: spacing.xxl,
  },
  emptyText: {
    fontSize: typography.lg,
    fontWeight: typography.semibold,
    color: colors.deepBlue,
    marginTop: spacing.md,
  },
  emptySubtext: {
    fontSize: typography.sm,
    color: colors.softGray,
    marginTop: spacing.xs,
  },
  inputContainer: {
    borderTopWidth: 1,
    borderTopColor: colors.lightGray,
    padding: spacing.md,
    backgroundColor: colors.warmWhite,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: colors.lightGray,
    borderRadius: borderRadius.xl,
    paddingLeft: spacing.md,
    paddingRight: spacing.xs,
    paddingVertical: spacing.xs,
  },
  input: {
    flex: 1,
    fontSize: typography.base,
    color: colors.deepBlue,
    maxHeight: 100,
    paddingVertical: spacing.sm,
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: spacing.sm,
  },
  sendButtonDisabled: {
    backgroundColor: colors.mediumGray,
  },
});
