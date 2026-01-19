import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, typography, shadows } from '../../lib/theme';
import { usePioneer, CreditType } from '../../hooks/usePioneer';
import { useAuth } from '../../hooks/useAuth';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface CreditItem {
  type: CreditType;
  title: string;
  description: string;
  icon: string;
  screen?: string;
}

const CREDIT_ACTIONS: CreditItem[] = [
  {
    type: 'friend_joined',
    title: 'Invite friends who join',
    description: 'Each friend who joins through your invite = 1 credit',
    icon: 'person-add',
    screen: 'Invite',
  },
  {
    type: 'facebook_import',
    title: 'Import Facebook friends',
    description: 'Bring your friends list for SwipeCull',
    icon: 'cloud-download',
    screen: 'FacebookImport',
  },
  {
    type: 'profile_complete',
    title: 'Complete your profile',
    description: 'Add a photo and bio',
    icon: 'person-circle',
    screen: 'EditProfile',
  },
  {
    type: 'contacts_import',
    title: 'Import contacts',
    description: 'Connect your phone contacts',
    icon: 'phone-portrait',
    screen: 'ContactImport',
  },
];

export default function PioneerScreen({ navigation }: any) {
  const { profile } = useAuth();
  const { creditCount, creditsNeeded, isActivated, credits, hasEarnedCredit, refresh, earnCredit } = usePioneer();

  // Pulse animation for progress ring
  const pulseAnim = React.useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  // Check if profile is complete and award credit
  useEffect(() => {
    if (profile?.avatar_url && profile?.bio && !hasEarnedCredit('profile_complete')) {
      earnCredit('profile_complete');
    }
  }, [profile]);

  // If activated, redirect to main app
  useEffect(() => {
    if (isActivated) {
      navigation.replace('MainTabs');
    }
  }, [isActivated]);

  const friendCredits = credits.filter(c => c.credit_type === 'friend_joined').length;
  const maxFriendCredits = 5; // Can earn up to 5 from friends alone

  const renderProgressRing = () => {
    const progress = creditCount / 5;
    const circumference = 2 * Math.PI * 45;
    const strokeDashoffset = circumference * (1 - progress);

    return (
      <Animated.View style={[styles.progressContainer, { transform: [{ scale: pulseAnim }] }]}>
        <View style={styles.progressRing}>
          {/* Background circle */}
          <View style={styles.progressBg} />

          {/* Progress indicator dots */}
          <View style={styles.dotsContainer}>
            {[0, 1, 2, 3, 4].map((i) => (
              <View
                key={i}
                style={[
                  styles.progressDot,
                  i < creditCount && styles.progressDotFilled,
                ]}
              />
            ))}
          </View>

          {/* Center content */}
          <View style={styles.progressCenter}>
            <Text style={styles.progressNumber}>{creditCount}</Text>
            <Text style={styles.progressLabel}>of 5</Text>
          </View>
        </View>
      </Animated.View>
    );
  };

  const renderCreditAction = (item: CreditItem, index: number) => {
    const isEarned = item.type === 'friend_joined'
      ? friendCredits > 0
      : hasEarnedCredit(item.type);

    const isFriendType = item.type === 'friend_joined';

    return (
      <TouchableOpacity
        key={item.type}
        style={[styles.actionCard, isEarned && !isFriendType && styles.actionCardEarned]}
        onPress={() => item.screen && navigation.navigate(item.screen)}
        disabled={isEarned && !isFriendType}
      >
        <View style={[styles.actionIcon, isEarned && !isFriendType && styles.actionIconEarned]}>
          {isEarned && !isFriendType ? (
            <Ionicons name="checkmark" size={24} color={colors.warmWhite} />
          ) : (
            <Ionicons name={item.icon as any} size={24} color={colors.accent} />
          )}
        </View>
        <View style={styles.actionContent}>
          <Text style={styles.actionTitle}>{item.title}</Text>
          <Text style={styles.actionDescription}>
            {isFriendType ? `${friendCredits} friends joined` : item.description}
          </Text>
        </View>
        {(!isEarned || isFriendType) && (
          <View style={styles.creditBadge}>
            <Text style={styles.creditBadgeText}>+1</Text>
          </View>
        )}
        <Ionicons
          name="chevron-forward"
          size={20}
          color={isEarned && !isFriendType ? colors.success : colors.softGray}
        />
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>🏔️ PIONEER</Text>
          </View>
          <Text style={styles.title}>Earn Your Status</Text>
          <Text style={styles.subtitle}>
            Build your circle to unlock REALones.
            {creditsNeeded > 0 ? ` ${creditsNeeded} more to go!` : ''}
          </Text>
        </View>

        {/* Progress Ring */}
        {renderProgressRing()}

        {/* Why Section */}
        <View style={styles.whyCard}>
          <Ionicons name="heart" size={20} color={colors.heart} />
          <Text style={styles.whyText}>
            We do this so you never have an empty feed. Your first friends will be waiting when you unlock!
          </Text>
        </View>

        {/* Actions */}
        <Text style={styles.sectionTitle}>Ways to earn credits</Text>
        {CREDIT_ACTIONS.map(renderCreditAction)}

        {/* Pioneer Squad Preview */}
        {friendCredits > 0 && (
          <TouchableOpacity
            style={styles.squadCard}
            onPress={() => navigation.navigate('PioneerChat')}
          >
            <View style={styles.squadHeader}>
              <Ionicons name="chatbubbles" size={24} color={colors.accent} />
              <Text style={styles.squadTitle}>Your Pioneer Squad</Text>
            </View>
            <Text style={styles.squadSubtitle}>
              {friendCredits} {friendCredits === 1 ? 'friend has' : 'friends have'} joined! Chat with them while you complete your journey.
            </Text>
            <View style={styles.squadCta}>
              <Text style={styles.squadCtaText}>Open Chat</Text>
              <Ionicons name="arrow-forward" size={16} color={colors.accent} />
            </View>
          </TouchableOpacity>
        )}

        {/* Pending Invites */}
        <TouchableOpacity
          style={styles.pendingCard}
          onPress={() => navigation.navigate('Invite')}
        >
          <Ionicons name="hourglass-outline" size={20} color={colors.softGray} />
          <Text style={styles.pendingText}>View pending invites</Text>
          <Ionicons name="chevron-forward" size={20} color={colors.softGray} />
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.babyBlue,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  badge: {
    backgroundColor: colors.deepBlue,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.full,
    marginBottom: spacing.md,
  },
  badgeText: {
    color: colors.warmWhite,
    fontSize: typography.sm,
    fontWeight: typography.bold,
    letterSpacing: 1,
  },
  title: {
    fontSize: typography['3xl'],
    fontWeight: typography.bold,
    color: colors.deepBlue,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: typography.base,
    color: colors.softGray,
    textAlign: 'center',
  },
  progressContainer: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  progressRing: {
    width: 160,
    height: 160,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressBg: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: colors.warmWhite,
    ...shadows.md,
  },
  dotsContainer: {
    position: 'absolute',
    flexDirection: 'row',
    top: 20,
    gap: spacing.sm,
  },
  progressDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.lightGray,
    borderWidth: 2,
    borderColor: colors.warmWhite,
  },
  progressDotFilled: {
    backgroundColor: colors.accent,
  },
  progressCenter: {
    alignItems: 'center',
  },
  progressNumber: {
    fontSize: 48,
    fontWeight: typography.bold,
    color: colors.deepBlue,
  },
  progressLabel: {
    fontSize: typography.lg,
    color: colors.softGray,
  },
  whyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.heart + '15',
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.xl,
    gap: spacing.sm,
  },
  whyText: {
    flex: 1,
    fontSize: typography.sm,
    color: colors.deepBlue,
    lineHeight: 20,
  },
  sectionTitle: {
    fontSize: typography.lg,
    fontWeight: typography.semibold,
    color: colors.deepBlue,
    marginBottom: spacing.md,
  },
  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.warmWhite,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.sm,
    ...shadows.sm,
  },
  actionCardEarned: {
    backgroundColor: colors.success + '15',
    borderWidth: 1,
    borderColor: colors.success + '30',
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.accent + '15',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  actionIconEarned: {
    backgroundColor: colors.success,
  },
  actionContent: {
    flex: 1,
  },
  actionTitle: {
    fontSize: typography.base,
    fontWeight: typography.semibold,
    color: colors.deepBlue,
  },
  actionDescription: {
    fontSize: typography.sm,
    color: colors.softGray,
    marginTop: 2,
  },
  creditBadge: {
    backgroundColor: colors.accent,
    paddingVertical: 2,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.full,
    marginRight: spacing.sm,
  },
  creditBadgeText: {
    color: colors.warmWhite,
    fontSize: typography.xs,
    fontWeight: typography.bold,
  },
  squadCard: {
    backgroundColor: colors.warmWhite,
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    marginTop: spacing.lg,
    ...shadows.sm,
  },
  squadHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  squadTitle: {
    fontSize: typography.lg,
    fontWeight: typography.semibold,
    color: colors.deepBlue,
  },
  squadSubtitle: {
    fontSize: typography.sm,
    color: colors.softGray,
    lineHeight: 20,
    marginBottom: spacing.md,
  },
  squadCta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  squadCtaText: {
    fontSize: typography.base,
    fontWeight: typography.semibold,
    color: colors.accent,
  },
  pendingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.warmWhite,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    marginTop: spacing.md,
    gap: spacing.sm,
    ...shadows.sm,
  },
  pendingText: {
    flex: 1,
    fontSize: typography.base,
    color: colors.softGray,
  },
});
