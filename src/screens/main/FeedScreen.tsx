import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, typography, shadows } from '../../lib/theme';
import { usePosts } from '../../hooks/usePosts';
import { useAuth } from '../../hooks/useAuth';
import { Post } from '../../types';

interface PostCardProps {
  post: Post;
  onReact: (postId: string, type: string) => void;
}

const REACTIONS = [
  { type: 'heart', emoji: '❤️' },
  { type: 'hug', emoji: '🤗' },
  { type: 'laugh', emoji: '😂' },
  { type: 'wow', emoji: '😮' },
  { type: 'sad', emoji: '😢' },
];

function PostCard({ post, onReact }: PostCardProps) {
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

        <TouchableOpacity style={styles.actionButton}>
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
  const { profile } = useAuth();
  const { posts, loading, refreshing, refresh, loadMore, reactToPost } = usePosts();

  const renderPost = ({ item }: { item: Post }) => (
    <PostCard post={item} onReact={reactToPost} />
  );

  const renderHeader = () => (
    <View style={styles.header}>
      <Image 
        source={require('../../../assets/logo.png')} 
        style={styles.logoImage}
        resizeMode="contain"
      />
      <TouchableOpacity onPress={() => navigation.navigate('Compose')}>
        <Ionicons name="add-circle" size={32} color={colors.accent} />
      </TouchableOpacity>
    </View>
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="people-outline" size={64} color={colors.softGray} />
      <Text style={styles.emptyTitle}>No posts yet</Text>
      <Text style={styles.emptyText}>
        Add friends to see their updates, or share something yourself!
      </Text>
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
            onRefresh={refresh}
            tintColor={colors.accent}
          />
        }
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
        ListEmptyComponent={renderEmpty}
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
  logoImage: {
    width: 120,
    height: 50,
  },
  feedContent: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.xxl,
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
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
    paddingHorizontal: spacing.xl,
  },
  emptyTitle: {
    fontSize: typography.xl,
    fontWeight: typography.semibold,
    color: colors.deepBlue,
    marginTop: spacing.md,
  },
  emptyText: {
    fontSize: typography.base,
    color: colors.softGray,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
});
