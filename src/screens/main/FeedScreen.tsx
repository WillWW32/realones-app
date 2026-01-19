import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, typography, shadows } from '../../lib/theme';
import { usePosts } from '../../hooks/usePosts';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../lib/supabase';
import { Post } from '../../types';
import { JessChat } from '../../components/JessChat';

interface PostCardProps {
  post: Post;
  onReact: (postId: string, type: string) => void;
  onComment: (post: Post) => void;
}

const REACTIONS = [
  { type: 'heart', emoji: '❤️' },
  { type: 'hug', emoji: '🤗' },
  { type: 'laugh', emoji: '😂' },
  { type: 'wow', emoji: '😮' },
  { type: 'sad', emoji: '😢' },
];

function PostCard({ post, onReact, onComment }: PostCardProps) {
  const [showReactions, setShowReactions] = useState(false);
  const [userReaction, setUserReaction] = useState<string | null>(post.user_reaction || null);
  const timeAgo = getTimeAgo(post.created_at);

  const handleReact = (type: string) => {
    setUserReaction(type);
    setShowReactions(false);
    onReact(post.id, type);
  };

  const handleLongPress = () => {
    setShowReactions(true);
  };

  const handleQuickReact = () => {
    if (userReaction) {
      setUserReaction(null);
      onReact(post.id, 'remove');
    } else {
      handleReact('heart');
    }
  };

  return (
    <View style={styles.postCard}>
      <View style={styles.postHeader}>
        <View style={styles.avatar}>
          {post.author?.avatar_url ? (
            <Image source={{ uri: post.author.avatar_url }} style={styles.avatarImage} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarText}>
                {post.author?.full_name?.charAt(0) || '?'}
              </Text>
            </View>
          )}
        </View>
        <View style={styles.postHeaderText}>
          <Text style={styles.authorName}>{post.author?.full_name || 'Unknown'}</Text>
          <Text style={styles.postTime}>{timeAgo}</Text>
        </View>
      </View>

      <Text style={styles.postContent}>{post.content}</Text>

      {post.media_urls && post.media_urls.length > 0 && (
        <View style={styles.mediaContainer}>
          {post.media_urls.map((url, index) => (
            <Image key={index} source={{ uri: url }} style={styles.mediaImage} />
          ))}
        </View>
      )}

      <View style={styles.postActions}>
        <View style={styles.reactionContainer}>
          {showReactions && (
            <View style={styles.reactionPicker}>
              {REACTIONS.map((reaction) => (
                <TouchableOpacity
                  key={reaction.type}
                  style={styles.reactionOption}
                  onPress={() => handleReact(reaction.type)}
                >
                  <Text style={styles.reactionEmoji}>{reaction.emoji}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleQuickReact}
            onLongPress={handleLongPress}
            delayLongPress={300}
          >
            {userReaction ? (
              <Text style={styles.activeReaction}>
                {REACTIONS.find(r => r.type === userReaction)?.emoji || '❤️'}
              </Text>
            ) : (
              <Ionicons name="heart-outline" size={22} color={colors.softGray} />
            )}
            {post.reactions_count && post.reactions_count > 0 && (
              <Text style={[styles.actionCount, userReaction && styles.activeCount]}>
                {post.reactions_count}
              </Text>
            )}
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.actionButton} onPress={() => onComment(post)}>
          <Ionicons name="chatbubble-outline" size={20} color={colors.softGray} />
          {post.comments_count && post.comments_count > 0 && (
            <Text style={styles.actionCount}>{post.comments_count}</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

function getTimeAgo(dateString: string): string {
  const now = new Date();
  const date = new Date(dateString);
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) return 'Just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  return date.toLocaleDateString();
}

export default function FeedScreen({ navigation }: any) {
  const { profile, user } = useAuth();
  const { posts, loading, refreshing, refresh, loadMore, reactToPost } = usePosts();
  const [memoriesCount, setMemoriesCount] = useState(0);
  const [memoriesLoading, setMemoriesLoading] = useState(true);

  // Check for "On This Day" memories
  const checkMemories = useCallback(async () => {
    if (!user?.id) {
      setMemoriesLoading(false);
      return;
    }

    try {
      const today = new Date();
      const month = today.getMonth() + 1;
      const day = today.getDate();

      // Fetch posts from this user
      const { data: userPosts } = await supabase
        .from('posts')
        .select('created_at')
        .eq('user_id', user.id);

      if (userPosts) {
        // Count posts that match today's date in previous years
        const count = userPosts.filter(post => {
          const postDate = new Date(post.created_at);
          return (
            postDate.getMonth() + 1 === month &&
            postDate.getDate() === day &&
            postDate.getFullYear() < today.getFullYear()
          );
        }).length;

        setMemoriesCount(count);
      }
    } catch (err) {
      console.error('Error checking memories:', err);
    } finally {
      setMemoriesLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    checkMemories();
  }, [checkMemories]);

  const handleComment = (post: Post) => {
    navigation.navigate('Comments', { postId: post.id, post });
  };

  const renderPost = ({ item }: { item: Post }) => (
    <PostCard post={item} onReact={reactToPost} onComment={handleComment} />
  );

  const renderHeader = () => (
    <View style={styles.header}>
      <Text style={styles.logoText}>
        REAL<Text style={styles.logoAccent}>ones</Text>
      </Text>
      <TouchableOpacity onPress={() => navigation.navigate('Compose')}>
        <Ionicons name="add-circle" size={32} color={colors.accent} />
      </TouchableOpacity>
    </View>
  );

  // Memory Lane banner component
  const MemoryLaneBanner = () => {
    if (memoriesLoading || memoriesCount === 0) return null;

    return (
      <TouchableOpacity
        style={styles.memoryBanner}
        onPress={() => navigation.navigate('Memories')}
      >
        <View style={styles.memoryBannerIcon}>
          <Ionicons name="time" size={24} color={colors.accent} />
        </View>
        <View style={styles.memoryBannerContent}>
          <Text style={styles.memoryBannerTitle}>
            📸 {memoriesCount} {memoriesCount === 1 ? 'memory' : 'memories'} from this day
          </Text>
          <Text style={styles.memoryBannerSubtitle}>
            Tap to see what you shared on {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} in past years
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color={colors.accent} />
      </TouchableOpacity>
    );
  };

  // Jess AI companion below posts
  const JessFooter = () => (
    <View style={styles.jessContainer}>
      <JessChat />
    </View>
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      {/* Welcome Section */}
      <View style={styles.welcomeSection}>
        <Text style={styles.welcomeEmoji}>🎉</Text>
        <Text style={styles.welcomeTitle}>Welcome to REALones!</Text>
        <Text style={styles.welcomeSubtitle}>
          Your feed shows posts from your real friends only — no algorithm, no ads, no noise.
        </Text>
      </View>

      {/* Getting Started Steps */}
      <View style={styles.stepsContainer}>
        <Text style={styles.stepsTitle}>Get Started</Text>

        <TouchableOpacity
          style={styles.stepCard}
          onPress={() => navigation.navigate('AddFriend')}
        >
          <View style={[styles.stepIcon, { backgroundColor: colors.accent + '20' }]}>
            <Ionicons name="person-add" size={24} color={colors.accent} />
          </View>
          <View style={styles.stepContent}>
            <Text style={styles.stepText}>Add your real friends</Text>
            <Text style={styles.stepSubtext}>Start with 10-20 people you actually care about</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.softGray} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.stepCard}
          onPress={() => navigation.navigate('ContactImport')}
        >
          <View style={[styles.stepIcon, { backgroundColor: colors.success + '20' }]}>
            <Ionicons name="phone-portrait" size={24} color={colors.success} />
          </View>
          <View style={styles.stepContent}>
            <Text style={styles.stepText}>Import from contacts</Text>
            <Text style={styles.stepSubtext}>Quickly add friends from your phone</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.softGray} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.stepCard}
          onPress={() => navigation.navigate('Compose')}
        >
          <View style={[styles.stepIcon, { backgroundColor: colors.heart + '20' }]}>
            <Ionicons name="create" size={24} color={colors.heart} />
          </View>
          <View style={styles.stepContent}>
            <Text style={styles.stepText}>Share your first post</Text>
            <Text style={styles.stepSubtext}>Let your circle know you're here</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.softGray} />
        </TouchableOpacity>
      </View>

      {/* Philosophy note */}
      <View style={styles.philosophySection}>
        <Text style={styles.philosophyText}>
          "Sometimes a step back is a step forward"
        </Text>
        <Text style={styles.philosophySubtext}>
          REALones is about quality over quantity — your 200 closest people, curated by you.
        </Text>
      </View>
    </View>
  );

  if (loading && posts.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        {renderHeader()}
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.accent} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {renderHeader()}
      <FlatList
        data={posts}
        renderItem={renderPost}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.feedContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              refresh();
              checkMemories();
            }}
            tintColor={colors.accent}
          />
        }
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
        ListHeaderComponent={<MemoryLaneBanner />}
        ListEmptyComponent={renderEmpty}
        ListFooterComponent={posts.length > 0 ? <JessFooter /> : null}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.babyBlue,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.babyBlue,
  },
  logoText: {
    fontSize: 28,
    fontWeight: '400',
    color: colors.deepBlue,
    letterSpacing: -1,
  },
  logoAccent: {
    fontStyle: 'italic',
    color: colors.accent,
  },
  feedContent: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.xxl,
  },
  memoryBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.accent + '15',
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.accent + '30',
  },
  memoryBannerIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.warmWhite,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  memoryBannerContent: {
    flex: 1,
  },
  memoryBannerTitle: {
    fontSize: typography.base,
    fontWeight: typography.semibold,
    color: colors.deepBlue,
  },
  memoryBannerSubtitle: {
    fontSize: typography.sm,
    color: colors.softGray,
    marginTop: 2,
  },
  postCard: {
    backgroundColor: colors.warmWhite,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    ...shadows.sm,
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginRight: spacing.sm,
  },
  avatarImage: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  avatarPlaceholder: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.sky,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: typography.lg,
    fontWeight: typography.semibold,
    color: colors.deepBlue,
  },
  postHeaderText: {
    flex: 1,
  },
  authorName: {
    fontSize: typography.base,
    fontWeight: typography.semibold,
    color: colors.deepBlue,
  },
  postTime: {
    fontSize: typography.sm,
    color: colors.softGray,
    marginTop: 2,
  },
  postContent: {
    fontSize: typography.base,
    color: colors.deepBlue,
    lineHeight: 24,
  },
  mediaContainer: {
    marginTop: spacing.md,
    borderRadius: borderRadius.md,
    overflow: 'hidden',
  },
  mediaImage: {
    width: '100%',
    height: 200,
    borderRadius: borderRadius.md,
  },
  postActions: {
    flexDirection: 'row',
    marginTop: spacing.md,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.lightGray,
    gap: spacing.lg,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  actionCount: {
    fontSize: typography.sm,
    color: colors.softGray,
  },
  activeCount: {
    color: colors.accent,
  },
  reactionContainer: {
    position: 'relative',
  },
  reactionPicker: {
    position: 'absolute',
    bottom: 40,
    left: -10,
    flexDirection: 'row',
    backgroundColor: colors.warmWhite,
    borderRadius: borderRadius.xl,
    padding: spacing.xs,
    ...shadows.md,
    zIndex: 10,
  },
  reactionOption: {
    padding: spacing.xs,
  },
  reactionEmoji: {
    fontSize: 24,
  },
  activeReaction: {
    fontSize: 22,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    paddingTop: spacing.lg,
    paddingHorizontal: spacing.md,
  },
  welcomeSection: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  welcomeEmoji: {
    fontSize: 48,
    marginBottom: spacing.sm,
  },
  welcomeTitle: {
    fontSize: typography['2xl'],
    fontWeight: typography.bold,
    color: colors.deepBlue,
    marginBottom: spacing.xs,
  },
  welcomeSubtitle: {
    fontSize: typography.base,
    color: colors.softGray,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: spacing.md,
  },
  stepsContainer: {
    marginBottom: spacing.xl,
  },
  stepsTitle: {
    fontSize: typography.lg,
    fontWeight: typography.semibold,
    color: colors.deepBlue,
    marginBottom: spacing.md,
  },
  stepCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.warmWhite,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    ...shadows.sm,
  },
  stepIcon: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  stepContent: {
    flex: 1,
  },
  stepText: {
    fontSize: typography.base,
    fontWeight: typography.semibold,
    color: colors.deepBlue,
  },
  stepSubtext: {
    fontSize: typography.sm,
    color: colors.softGray,
    marginTop: 2,
  },
  philosophySection: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.md,
  },
  philosophyText: {
    fontSize: typography.base,
    fontStyle: 'italic',
    color: colors.accent,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  philosophySubtext: {
    fontSize: typography.sm,
    color: colors.softGray,
    textAlign: 'center',
    lineHeight: 20,
  },
  jessContainer: {
    marginTop: spacing.lg,
    marginBottom: spacing.xl,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
  },
});
