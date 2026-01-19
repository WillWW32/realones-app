import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, typography, shadows } from '../../lib/theme';
import { usePioneer } from '../../hooks/usePioneer';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../lib/supabase';
import { JessChat } from '../../components/JessChat';

interface FeedItem {
  id: string;
  type: 'credit_earned' | 'friend_joined' | 'tip' | 'squad_chat' | 'progress' | 'jess_placeholder';
  title: string;
  subtitle?: string;
  icon?: string;
  emoji?: string;
  action?: string;
  timestamp?: string;
}

export default function PioneerFeedScreen({ navigation }: any) {
  const { profile } = useAuth();
  const { creditCount, creditsNeeded, credits, isActivated, refresh } = usePioneer();
  const [refreshing, setRefreshing] = useState(false);
  const [feedItems, setFeedItems] = useState<FeedItem[]>([]);

  // Build the feed items based on pioneer progress
  const buildFeed = useCallback(() => {
    const items: FeedItem[] = [];

    // Progress card always at top
    items.push({
      id: 'progress',
      type: 'progress',
      title: `${creditCount}/5 Pioneer Credits`,
      subtitle: creditsNeeded > 0
        ? `${creditsNeeded} more to unlock your feed!`
        : 'You did it! 🎉',
    });

    // Recent credit earnings
    credits.slice(-3).reverse().forEach((credit, idx) => {
      const creditInfo = getCreditInfo(credit.credit_type);
      items.push({
        id: `credit-${credit.id}`,
        type: 'credit_earned',
        title: creditInfo.title,
        subtitle: creditInfo.subtitle,
        emoji: '✓',
        timestamp: credit.created_at,
      });
    });

    // Tips based on what they haven't done
    const hasFacebookImport = credits.some(c => c.credit_type === 'facebook_import');
    const hasProfileComplete = credits.some(c => c.credit_type === 'profile_complete');
    const hasContactsImport = credits.some(c => c.credit_type === 'contacts_import');
    const friendCount = credits.filter(c => c.credit_type === 'friend_joined').length;

    if (!hasProfileComplete) {
      items.push({
        id: 'tip-profile',
        type: 'tip',
        title: 'Complete your profile',
        subtitle: 'Add a photo and bio to earn +1 credit',
        icon: 'person-circle',
        action: 'EditProfile',
      });
    }

    if (!hasFacebookImport) {
      items.push({
        id: 'tip-facebook',
        type: 'tip',
        title: 'Import Facebook friends',
        subtitle: 'Bring your friends for SwipeCull and earn +1 credit',
        icon: 'cloud-download',
        action: 'FacebookImport',
      });
    }

    if (friendCount < 2) {
      items.push({
        id: 'tip-invite',
        type: 'tip',
        title: 'Invite your real friends',
        subtitle: `Each friend who joins = +1 credit (${friendCount}/5 friends)`,
        icon: 'person-add',
        action: 'Invite',
      });
    }

    // Pioneer Squad chat if friends have joined
    if (friendCount > 0) {
      items.push({
        id: 'squad-chat',
        type: 'squad_chat',
        title: 'Pioneer Squad Chat',
        subtitle: `${friendCount} ${friendCount === 1 ? 'friend' : 'friends'} waiting to chat!`,
        icon: 'chatbubbles',
        action: 'PioneerChat',
      });
    }

    // Jess placeholder at the bottom
    items.push({
      id: 'jess',
      type: 'jess_placeholder',
      title: 'Chat with Jess',
      subtitle: 'Your AI companion while you build your circle',
      icon: 'sparkles',
    });

    setFeedItems(items);
  }, [credits, creditCount, creditsNeeded]);

  useEffect(() => {
    buildFeed();
  }, [buildFeed]);

  useEffect(() => {
    if (isActivated) {
      navigation.replace('MainTabs');
    }
  }, [isActivated]);

  const getCreditInfo = (type: string) => {
    switch (type) {
      case 'friend_joined':
        return { title: 'Friend joined!', subtitle: 'You earned +1 credit' };
      case 'facebook_import':
        return { title: 'Facebook imported!', subtitle: 'You earned +1 credit' };
      case 'profile_complete':
        return { title: 'Profile completed!', subtitle: 'You earned +1 credit' };
      case 'contacts_import':
        return { title: 'Contacts imported!', subtitle: 'You earned +1 credit' };
      default:
        return { title: 'Credit earned!', subtitle: '+1 credit' };
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await refresh();
    buildFeed();
    setRefreshing(false);
  };

  const renderItem = ({ item }: { item: FeedItem }) => {
    switch (item.type) {
      case 'progress':
        return (
          <TouchableOpacity
            style={styles.progressCard}
            onPress={() => navigation.navigate('Pioneer')}
          >
            <View style={styles.progressHeader}>
              <Text style={styles.pioneerBadge}>🏔️ PIONEER</Text>
              <Ionicons name="chevron-forward" size={20} color={colors.accent} />
            </View>
            <View style={styles.progressDots}>
              {[0, 1, 2, 3, 4].map(i => (
                <View
                  key={i}
                  style={[
                    styles.dot,
                    i < creditCount && styles.dotFilled,
                  ]}
                />
              ))}
            </View>
            <Text style={styles.progressTitle}>{item.title}</Text>
            <Text style={styles.progressSubtitle}>{item.subtitle}</Text>
          </TouchableOpacity>
        );

      case 'credit_earned':
        return (
          <View style={styles.creditCard}>
            <View style={styles.creditIcon}>
              <Ionicons name="checkmark-circle" size={24} color={colors.success} />
            </View>
            <View style={styles.creditContent}>
              <Text style={styles.creditTitle}>{item.title}</Text>
              <Text style={styles.creditSubtitle}>{item.subtitle}</Text>
            </View>
          </View>
        );

      case 'tip':
        return (
          <TouchableOpacity
            style={styles.tipCard}
            onPress={() => item.action && navigation.navigate(item.action)}
          >
            <View style={styles.tipIcon}>
              <Ionicons name={item.icon as any} size={24} color={colors.accent} />
            </View>
            <View style={styles.tipContent}>
              <Text style={styles.tipTitle}>{item.title}</Text>
              <Text style={styles.tipSubtitle}>{item.subtitle}</Text>
            </View>
            <View style={styles.tipBadge}>
              <Text style={styles.tipBadgeText}>+1</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.softGray} />
          </TouchableOpacity>
        );

      case 'squad_chat':
        return (
          <TouchableOpacity
            style={styles.squadCard}
            onPress={() => item.action && navigation.navigate(item.action)}
          >
            <View style={styles.squadIcon}>
              <Ionicons name={item.icon as any} size={28} color={colors.warmWhite} />
            </View>
            <View style={styles.squadContent}>
              <Text style={styles.squadTitle}>{item.title}</Text>
              <Text style={styles.squadSubtitle}>{item.subtitle}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.warmWhite} />
          </TouchableOpacity>
        );

      case 'jess_placeholder':
        return (
          <View style={styles.jessCard}>
            <JessChat />
          </View>
        );

      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.logoText}>
          REAL<Text style={styles.logoAccent}>ones</Text>
        </Text>
        <TouchableOpacity onPress={() => navigation.navigate('Pioneer')}>
          <View style={styles.statusBadge}>
            <Text style={styles.statusText}>{creditCount}/5</Text>
          </View>
        </TouchableOpacity>
      </View>

      <FlatList
        data={feedItems}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.feedContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.accent}
          />
        }
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
  statusBadge: {
    backgroundColor: colors.accent,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.full,
  },
  statusText: {
    color: colors.warmWhite,
    fontSize: typography.sm,
    fontWeight: typography.bold,
  },
  feedContent: {
    padding: spacing.md,
    paddingBottom: spacing.xxl,
  },
  // Progress Card
  progressCard: {
    backgroundColor: colors.warmWhite,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    marginBottom: spacing.md,
    ...shadows.md,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  pioneerBadge: {
    fontSize: typography.sm,
    fontWeight: typography.bold,
    color: colors.deepBlue,
    letterSpacing: 1,
  },
  progressDots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  dot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.lightGray,
    borderWidth: 2,
    borderColor: colors.warmWhite,
  },
  dotFilled: {
    backgroundColor: colors.accent,
  },
  progressTitle: {
    fontSize: typography.xl,
    fontWeight: typography.bold,
    color: colors.deepBlue,
    textAlign: 'center',
  },
  progressSubtitle: {
    fontSize: typography.base,
    color: colors.softGray,
    textAlign: 'center',
    marginTop: spacing.xs,
  },
  // Credit Card
  creditCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.success + '15',
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.success + '30',
  },
  creditIcon: {
    marginRight: spacing.md,
  },
  creditContent: {
    flex: 1,
  },
  creditTitle: {
    fontSize: typography.base,
    fontWeight: typography.semibold,
    color: colors.deepBlue,
  },
  creditSubtitle: {
    fontSize: typography.sm,
    color: colors.success,
  },
  // Tip Card
  tipCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.warmWhite,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    ...shadows.sm,
  },
  tipIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.accent + '15',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  tipContent: {
    flex: 1,
  },
  tipTitle: {
    fontSize: typography.base,
    fontWeight: typography.semibold,
    color: colors.deepBlue,
  },
  tipSubtitle: {
    fontSize: typography.sm,
    color: colors.softGray,
    marginTop: 2,
  },
  tipBadge: {
    backgroundColor: colors.accent,
    paddingVertical: 2,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.full,
    marginRight: spacing.sm,
  },
  tipBadgeText: {
    color: colors.warmWhite,
    fontSize: typography.xs,
    fontWeight: typography.bold,
  },
  // Squad Card
  squadCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.accent,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    ...shadows.md,
  },
  squadIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  squadContent: {
    flex: 1,
  },
  squadTitle: {
    fontSize: typography.base,
    fontWeight: typography.semibold,
    color: colors.warmWhite,
  },
  squadSubtitle: {
    fontSize: typography.sm,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
  },
  // Jess Card
  jessCard: {
    marginTop: spacing.md,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
  },
});
