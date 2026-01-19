import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  FlatList,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, typography, shadows } from '../../lib/theme';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../lib/supabase';
import { Post } from '../../types';

interface MemoryPost extends Post {
  years_ago: number;
}

interface MemoryGroup {
  years_ago: number;
  label: string;
  posts: MemoryPost[];
}

export default function MemoriesScreen({ navigation }: any) {
  const { user } = useAuth();
  const [memories, setMemories] = useState<MemoryGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'today' | 'book'>('today');

  const fetchMemories = useCallback(async () => {
    if (!user?.id) return;

    try {
      const today = new Date();
      const month = today.getMonth() + 1;
      const day = today.getDate();

      // Fetch posts from past years on this date
      // We look for posts where created_at matches month and day
      const { data: posts, error } = await supabase
        .from('posts')
        .select(`
          *,
          author:profiles(*)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Filter posts that match today's date in previous years
      const memoryPosts: MemoryPost[] = [];

      posts?.forEach((post) => {
        const postDate = new Date(post.created_at);
        const postMonth = postDate.getMonth() + 1;
        const postDay = postDate.getDate();
        const postYear = postDate.getFullYear();
        const currentYear = today.getFullYear();

        // Check if same month/day but different year
        if (postMonth === month && postDay === day && postYear < currentYear) {
          memoryPosts.push({
            ...post,
            years_ago: currentYear - postYear,
          });
        }
      });

      // Group by years ago
      const grouped: { [key: number]: MemoryPost[] } = {};
      memoryPosts.forEach((post) => {
        if (!grouped[post.years_ago]) {
          grouped[post.years_ago] = [];
        }
        grouped[post.years_ago].push(post);
      });

      // Convert to array and sort
      const memoryGroups: MemoryGroup[] = Object.entries(grouped)
        .map(([yearsAgo, posts]) => ({
          years_ago: parseInt(yearsAgo),
          label: parseInt(yearsAgo) === 1 ? '1 Year Ago Today' : `${yearsAgo} Years Ago Today`,
          posts,
        }))
        .sort((a, b) => a.years_ago - b.years_ago);

      setMemories(memoryGroups);
    } catch (err) {
      console.error('Error fetching memories:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchMemories();
  }, [fetchMemories]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchMemories();
  };

  const renderMemoryCard = (post: MemoryPost) => {
    const postDate = new Date(post.created_at);

    return (
      <View key={post.id} style={styles.memoryCard}>
        <View style={styles.memoryHeader}>
          <View style={styles.memoryDateBadge}>
            <Ionicons name="calendar" size={14} color={colors.accent} />
            <Text style={styles.memoryDate}>
              {postDate.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric'
              })}
            </Text>
          </View>
        </View>

        <Text style={styles.memoryContent}>{post.content}</Text>

        {post.media_urls && post.media_urls.length > 0 && (
          <View style={styles.mediaContainer}>
            {post.media_urls.map((url, index) => (
              <Image key={index} source={{ uri: url }} style={styles.mediaImage} />
            ))}
          </View>
        )}

        <TouchableOpacity style={styles.shareMemoryBtn}>
          <Ionicons name="share-outline" size={18} color={colors.accent} />
          <Text style={styles.shareMemoryText}>Share this memory</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderMemoryGroup = ({ item }: { item: MemoryGroup }) => (
    <View style={styles.memoryGroup}>
      <View style={styles.yearHeader}>
        <View style={styles.yearBadge}>
          <Ionicons name="time" size={20} color={colors.warmWhite} />
          <Text style={styles.yearText}>{item.label}</Text>
        </View>
      </View>
      {item.posts.map(renderMemoryCard)}
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyIcon}>
        <Ionicons name="images-outline" size={64} color={colors.softGray} />
      </View>
      <Text style={styles.emptyTitle}>No memories yet</Text>
      <Text style={styles.emptySubtitle}>
        Your memories from past years will appear here on this date. Keep posting and building your story!
      </Text>

      <TouchableOpacity
        style={styles.createMemoryBtn}
        onPress={() => navigation.navigate('MemoryBook')}
      >
        <Ionicons name="add-circle" size={24} color={colors.warmWhite} />
        <Text style={styles.createMemoryText}>Create a Memory Book entry</Text>
      </TouchableOpacity>

      <View style={styles.tipCard}>
        <Ionicons name="bulb-outline" size={20} color={colors.accent} />
        <Text style={styles.tipText}>
          Tip: Add memories from your past using the Memory Book - perfect for moments before you joined REALones!
        </Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.deepBlue} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Memory Lane</Text>
        <TouchableOpacity
          onPress={() => navigation.navigate('MemoryBook')}
          style={styles.addBtn}
        >
          <Ionicons name="add" size={24} color={colors.accent} />
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'today' && styles.activeTab]}
          onPress={() => setActiveTab('today')}
        >
          <Ionicons
            name="calendar-outline"
            size={18}
            color={activeTab === 'today' ? colors.accent : colors.softGray}
          />
          <Text style={[styles.tabText, activeTab === 'today' && styles.activeTabText]}>
            On This Day
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'book' && styles.activeTab]}
          onPress={() => setActiveTab('book')}
        >
          <Ionicons
            name="book-outline"
            size={18}
            color={activeTab === 'book' ? colors.accent : colors.softGray}
          />
          <Text style={[styles.tabText, activeTab === 'book' && styles.activeTabText]}>
            Memory Book
          </Text>
        </TouchableOpacity>
      </View>

      {/* Today's Date Banner */}
      {activeTab === 'today' && (
        <View style={styles.todayBanner}>
          <Ionicons name="sunny" size={24} color={colors.accent} />
          <View style={styles.todayInfo}>
            <Text style={styles.todayTitle}>
              {new Date().toLocaleDateString('en-US', {
                weekday: 'long',
                month: 'long',
                day: 'numeric'
              })}
            </Text>
            <Text style={styles.todaySubtitle}>
              See what you shared on this day in past years
            </Text>
          </View>
        </View>
      )}

      {/* Content */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.accent} />
          <Text style={styles.loadingText}>Finding your memories...</Text>
        </View>
      ) : activeTab === 'today' ? (
        <FlatList
          data={memories}
          renderItem={renderMemoryGroup}
          keyExtractor={(item) => item.years_ago.toString()}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.accent}
            />
          }
          ListEmptyComponent={renderEmptyState}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <View style={styles.bookTabContent}>
          <View style={styles.bookPrompt}>
            <Ionicons name="book" size={48} color={colors.accent} />
            <Text style={styles.bookTitle}>Your Memory Book</Text>
            <Text style={styles.bookSubtitle}>
              Scrapbook your favorite moments from the past - even from before you joined REALones.
              Add photos, dates, and stories to build your personal history.
            </Text>
            <TouchableOpacity
              style={styles.startBookBtn}
              onPress={() => navigation.navigate('MemoryBook')}
            >
              <Ionicons name="add-circle" size={20} color={colors.warmWhite} />
              <Text style={styles.startBookText}>Add Your First Memory</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  backBtn: {
    padding: spacing.xs,
  },
  headerTitle: {
    fontSize: typography.xl,
    fontWeight: typography.semibold,
    color: colors.deepBlue,
  },
  addBtn: {
    padding: spacing.xs,
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.full,
    backgroundColor: colors.warmWhite,
    gap: spacing.xs,
    ...shadows.sm,
  },
  activeTab: {
    backgroundColor: colors.accent + '20',
    borderWidth: 2,
    borderColor: colors.accent,
  },
  tabText: {
    fontSize: typography.sm,
    fontWeight: typography.medium,
    color: colors.softGray,
  },
  activeTabText: {
    color: colors.accent,
    fontWeight: typography.semibold,
  },
  todayBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.warmWhite,
    marginHorizontal: spacing.md,
    marginBottom: spacing.md,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    gap: spacing.md,
    ...shadows.sm,
  },
  todayInfo: {
    flex: 1,
  },
  todayTitle: {
    fontSize: typography.lg,
    fontWeight: typography.semibold,
    color: colors.deepBlue,
  },
  todaySubtitle: {
    fontSize: typography.sm,
    color: colors.softGray,
    marginTop: 2,
  },
  listContent: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.xxl,
  },
  memoryGroup: {
    marginBottom: spacing.lg,
  },
  yearHeader: {
    marginBottom: spacing.md,
  },
  yearBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: colors.accent,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.full,
    gap: spacing.xs,
  },
  yearText: {
    fontSize: typography.base,
    fontWeight: typography.semibold,
    color: colors.warmWhite,
  },
  memoryCard: {
    backgroundColor: colors.warmWhite,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    ...shadows.sm,
  },
  memoryHeader: {
    marginBottom: spacing.sm,
  },
  memoryDateBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  memoryDate: {
    fontSize: typography.sm,
    color: colors.accent,
    fontWeight: typography.medium,
  },
  memoryContent: {
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
  shareMemoryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.md,
    paddingVertical: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.lightGray,
    gap: spacing.xs,
  },
  shareMemoryText: {
    fontSize: typography.sm,
    color: colors.accent,
    fontWeight: typography.medium,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: spacing.md,
    fontSize: typography.base,
    color: colors.softGray,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    paddingTop: spacing.xxl,
    paddingHorizontal: spacing.lg,
  },
  emptyIcon: {
    marginBottom: spacing.lg,
  },
  emptyTitle: {
    fontSize: typography.xl,
    fontWeight: typography.semibold,
    color: colors.deepBlue,
    marginBottom: spacing.sm,
  },
  emptySubtitle: {
    fontSize: typography.base,
    color: colors.softGray,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: spacing.xl,
  },
  createMemoryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.accent,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.full,
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  createMemoryText: {
    fontSize: typography.base,
    fontWeight: typography.semibold,
    color: colors.warmWhite,
  },
  tipCard: {
    flexDirection: 'row',
    backgroundColor: colors.accent + '15',
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    gap: spacing.sm,
    alignItems: 'flex-start',
  },
  tipText: {
    flex: 1,
    fontSize: typography.sm,
    color: colors.deepBlue,
    lineHeight: 20,
  },
  bookTabContent: {
    flex: 1,
    paddingHorizontal: spacing.md,
  },
  bookPrompt: {
    alignItems: 'center',
    backgroundColor: colors.warmWhite,
    padding: spacing.xl,
    borderRadius: borderRadius.lg,
    marginTop: spacing.lg,
    ...shadows.sm,
  },
  bookTitle: {
    fontSize: typography.xl,
    fontWeight: typography.semibold,
    color: colors.deepBlue,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  bookSubtitle: {
    fontSize: typography.base,
    color: colors.softGray,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: spacing.lg,
  },
  startBookBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.accent,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.full,
    gap: spacing.sm,
  },
  startBookText: {
    fontSize: typography.base,
    fontWeight: typography.semibold,
    color: colors.warmWhite,
  },
});
