import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, typography, shadows } from '../../lib/theme';
import { useAuth } from '../../hooks/useAuth';
import { useFriends } from '../../hooks/useFriends';
import { useStreaks } from '../../hooks/useStreaks';
import { CONSTANTS, PRICING_INFO } from '../../types';

export default function ProfileScreen({ navigation }: any) {
  const { profile, signOut } = useAuth();
  const { activeCount, archivedCount, isOverLimit, extraFriendsNeeded } = useFriends();
  const { streak, badges } = useStreaks();

  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign Out', style: 'destructive', onPress: signOut },
      ]
    );
  };

  const monthlyPrice = Math.ceil(extraFriendsNeeded / 10);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Profile</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Settings')}>
            <Ionicons name="settings-outline" size={24} color={colors.deepBlue} />
          </TouchableOpacity>
        </View>

        {/* Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            {profile?.avatar_url ? (
              <Image source={{ uri: profile.avatar_url }} style={styles.avatarImage} />
            ) : (
              <Text style={styles.avatarText}>
                {profile?.full_name?.charAt(0) || '?'}
              </Text>
            )}
          </View>
          <Text style={styles.userName}>{profile?.full_name || 'Set up your profile'}</Text>
          {profile?.bio && <Text style={styles.userBio}>{profile.bio}</Text>}
          <TouchableOpacity
            style={styles.editProfileBtn}
            onPress={() => navigation.navigate('EditProfile')}
          >
            <Text style={styles.editProfileText}>Edit Profile</Text>
          </TouchableOpacity>
        </View>

        {/* Circle Stats */}
        <View style={styles.statsCard}>
          <Text style={styles.sectionTitle}>Your Circle</Text>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{activeCount}</Text>
              <Text style={styles.statLabel}>Active</Text>
              <Text style={styles.statLimit}>/ {CONSTANTS.FREE_ACTIVE_LIMIT}</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{archivedCount}</Text>
              <Text style={styles.statLabel}>Remember Me</Text>
              <Text style={styles.statLimit}>/ {CONSTANTS.FREE_ARCHIVED_LIMIT}</Text>
            </View>
          </View>

          {/* Progress bars */}
          <View style={styles.progressSection}>
            <View style={styles.progressRow}>
              <Text style={styles.progressLabel}>Active</Text>
              <View style={styles.progressBar}>
                <View
                  style={[
                    styles.progressFill,
                    {
                      width: `${Math.min((activeCount / CONSTANTS.FREE_ACTIVE_LIMIT) * 100, 100)}%`,
                      backgroundColor: activeCount > CONSTANTS.FREE_ACTIVE_LIMIT ? colors.warning : colors.accent,
                    },
                  ]}
                />
              </View>
            </View>
            <View style={styles.progressRow}>
              <Text style={styles.progressLabel}>Archived</Text>
              <View style={styles.progressBar}>
                <View
                  style={[
                    styles.progressFill,
                    {
                      width: `${Math.min((archivedCount / CONSTANTS.FREE_ARCHIVED_LIMIT) * 100, 100)}%`,
                      backgroundColor: archivedCount > CONSTANTS.FREE_ARCHIVED_LIMIT ? colors.warning : colors.success,
                    },
                  ]}
                />
              </View>
            </View>
          </View>

          {isOverLimit && (
            <View style={styles.upgradeNotice}>
              <Ionicons name="warning" size={20} color={colors.warning} />
              <Text style={styles.upgradeText}>
                You're {extraFriendsNeeded} friends over the free limit
              </Text>
              <TouchableOpacity style={styles.upgradeBtn}>
                <Text style={styles.upgradeBtnText}>
                  Upgrade for ${monthlyPrice}/mo
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Pricing Card */}
        <View style={styles.pricingCard}>
          <View style={styles.pricingHeader}>
            <Text style={styles.sectionTitle}>Pricing</Text>
            <View style={styles.freeTag}>
              <Text style={styles.freeTagText}>You're on Free</Text>
            </View>
          </View>

          <View style={styles.pricingTiers}>
            {/* Free Tier */}
            <View style={[styles.pricingTier, styles.pricingTierActive]}>
              <Text style={styles.tierPrice}>{PRICING_INFO.free.price}</Text>
              <Text style={styles.tierName}>{PRICING_INFO.free.name}</Text>
              {PRICING_INFO.free.features.map((feature, idx) => (
                <View key={idx} style={styles.featureRow}>
                  <Ionicons name="checkmark-circle" size={16} color={colors.success} />
                  <Text style={styles.featureText}>{feature}</Text>
                </View>
              ))}
            </View>

            {/* Premium Tier */}
            <View style={styles.pricingTier}>
              <Text style={styles.tierPrice}>{PRICING_INFO.premium.pricePerTen}</Text>
              <Text style={styles.tierName}>{PRICING_INFO.premium.name}</Text>
              {PRICING_INFO.premium.features.map((feature, idx) => (
                <View key={idx} style={styles.featureRow}>
                  <Ionicons name="add-circle-outline" size={16} color={colors.accent} />
                  <Text style={styles.featureText}>{feature}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* Enhanced Streak Card */}
        <View style={styles.streakCard}>
          <Text style={styles.streakSectionTitle}>Your Streaks 🔥</Text>

          {/* Main Streak Display */}
          <View style={styles.mainStreakRow}>
            <View style={styles.streakItem}>
              <View style={[styles.streakIconCircle, { backgroundColor: colors.heart + '20' }]}>
                <Ionicons name="heart" size={24} color={colors.heart} />
              </View>
              <Text style={styles.streakNumber}>{streak?.current_streak || 0}</Text>
              <Text style={styles.streakLabel}>Cull Streak</Text>
              <Text style={styles.streakSubLabel}>Reviewing friends</Text>
            </View>

            <View style={styles.streakDivider} />

            <View style={styles.streakItem}>
              <View style={[styles.streakIconCircle, { backgroundColor: colors.accent + '20' }]}>
                <Ionicons name="create" size={24} color={colors.accent} />
              </View>
              <Text style={styles.streakNumber}>{0}</Text>
              <Text style={styles.streakLabel}>Post Streak</Text>
              <Text style={styles.streakSubLabel}>Sharing moments</Text>
            </View>
          </View>

          {/* Streak Stats */}
          <View style={styles.streakStatsRow}>
            <View style={styles.streakStat}>
              <Ionicons name="trophy" size={16} color={colors.accent} />
              <Text style={styles.streakStatText}>Best: {streak?.longest_streak || 0} days</Text>
            </View>
            <View style={styles.streakStat}>
              <Ionicons name="ribbon" size={16} color={colors.accent} />
              <Text style={styles.streakStatText}>{badges.length} badges earned</Text>
            </View>
          </View>

          {/* CTA to start cull */}
          <TouchableOpacity
            style={styles.startCullBtn}
            onPress={() => navigation.navigate('SwipeCull')}
          >
            <Ionicons name="shuffle" size={18} color={colors.warmWhite} />
            <Text style={styles.startCullText}>Review Friends Now</Text>
          </TouchableOpacity>
        </View>

        {/* Badges */}
        {badges.length > 0 && (
          <View style={styles.badgesCard}>
            <Text style={styles.sectionTitle}>Badges Earned</Text>
            <View style={styles.badgesGrid}>
              {badges.map((userBadge) => (
                <View key={userBadge.id} style={styles.badge}>
                  <Text style={styles.badgeIcon}>{userBadge.badge?.icon || '🏆'}</Text>
                  <Text style={styles.badgeName}>{userBadge.badge?.name}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Quick Actions */}
        <View style={styles.actionsCard}>
          <TouchableOpacity
            style={styles.actionRow}
            onPress={() => navigation.navigate('BulkMessage')}
          >
            <Ionicons name="megaphone-outline" size={22} color={colors.deepBlue} />
            <Text style={styles.actionText}>Message All Friends</Text>
            <Ionicons name="chevron-forward" size={20} color={colors.softGray} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionRow}
            onPress={() => navigation.navigate('FacebookImport')}
          >
            <Ionicons name="cloud-download-outline" size={22} color={colors.deepBlue} />
            <Text style={styles.actionText}>Import from Facebook</Text>
            <Ionicons name="chevron-forward" size={20} color={colors.softGray} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionRow}
            onPress={() => navigation.navigate('Memories')}
          >
            <Ionicons name="time-outline" size={22} color={colors.deepBlue} />
            <Text style={styles.actionText}>Memory Lane</Text>
            <Ionicons name="chevron-forward" size={20} color={colors.softGray} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionRow}
            onPress={() => navigation.navigate('Invite')}
          >
            <Ionicons name="paper-plane-outline" size={22} color={colors.deepBlue} />
            <Text style={styles.actionText}>Invite Friends via SMS</Text>
            <Ionicons name="chevron-forward" size={20} color={colors.softGray} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionRow, { borderBottomWidth: 0 }]}
            onPress={() => navigation.navigate('ContactImport')}
          >
            <Ionicons name="phone-portrait-outline" size={22} color={colors.deepBlue} />
            <Text style={styles.actionText}>Import from Contacts</Text>
            <Ionicons name="chevron-forward" size={20} color={colors.softGray} />
          </TouchableOpacity>
        </View>

        {/* Sign Out */}
        <TouchableOpacity style={styles.signOutBtn} onPress={handleSignOut}>
          <Ionicons name="log-out-outline" size={20} color={colors.error} />
          <Text style={styles.signOutText}>Sign Out</Text>
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
    padding: spacing.md,
    paddingBottom: spacing.xxl,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  headerTitle: {
    fontSize: typography['2xl'],
    fontWeight: typography.semibold,
    color: colors.deepBlue,
  },
  profileCard: {
    backgroundColor: colors.warmWhite,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    alignItems: 'center',
    marginBottom: spacing.md,
    ...shadows.sm,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.sky,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  avatarImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: typography.semibold,
    color: colors.deepBlue,
  },
  userName: {
    fontSize: typography.xl,
    fontWeight: typography.semibold,
    color: colors.deepBlue,
  },
  userBio: {
    fontSize: typography.base,
    color: colors.softGray,
    marginTop: spacing.xs,
    textAlign: 'center',
  },
  editProfileBtn: {
    marginTop: spacing.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.full,
    backgroundColor: colors.lightGray,
  },
  editProfileText: {
    fontSize: typography.sm,
    fontWeight: typography.medium,
    color: colors.deepBlue,
  },
  statsCard: {
    backgroundColor: colors.warmWhite,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    ...shadows.sm,
  },
  sectionTitle: {
    fontSize: typography.base,
    fontWeight: typography.semibold,
    color: colors.deepBlue,
    marginBottom: spacing.md,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statNumber: {
    fontSize: typography['2xl'],
    fontWeight: typography.bold,
    color: colors.deepBlue,
  },
  statLabel: {
    fontSize: typography.xs,
    color: colors.softGray,
    marginTop: 2,
  },
  statLimit: {
    fontSize: typography.xs,
    color: colors.mediumGray,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    backgroundColor: colors.lightGray,
  },
  progressSection: {
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.lightGray,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  progressLabel: {
    width: 60,
    fontSize: typography.xs,
    color: colors.softGray,
  },
  progressBar: {
    flex: 1,
    height: 8,
    backgroundColor: colors.lightGray,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  upgradeNotice: {
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.lightGray,
    alignItems: 'center',
    flexDirection: 'column',
    gap: spacing.sm,
  },
  upgradeText: {
    fontSize: typography.sm,
    color: colors.softGray,
  },
  upgradeBtn: {
    backgroundColor: colors.accent,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.full,
  },
  upgradeBtnText: {
    fontSize: typography.sm,
    fontWeight: typography.semibold,
    color: colors.warmWhite,
  },
  streakCard: {
    backgroundColor: colors.warmWhite,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    ...shadows.sm,
  },
  streakSectionTitle: {
    fontSize: typography.lg,
    fontWeight: typography.semibold,
    color: colors.deepBlue,
    marginBottom: spacing.md,
  },
  mainStreakRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: spacing.md,
  },
  streakItem: {
    alignItems: 'center',
    flex: 1,
  },
  streakIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  streakDivider: {
    width: 1,
    backgroundColor: colors.lightGray,
    marginHorizontal: spacing.md,
  },
  streakNumber: {
    fontSize: typography['2xl'],
    fontWeight: typography.bold,
    color: colors.deepBlue,
  },
  streakLabel: {
    fontSize: typography.sm,
    fontWeight: typography.medium,
    color: colors.deepBlue,
    marginTop: 2,
  },
  streakSubLabel: {
    fontSize: typography.xs,
    color: colors.softGray,
  },
  streakStatsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.lg,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.lightGray,
  },
  streakStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  streakStatText: {
    fontSize: typography.sm,
    color: colors.softGray,
  },
  startCullBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.heart,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.full,
    marginTop: spacing.md,
    gap: spacing.xs,
  },
  startCullText: {
    fontSize: typography.base,
    fontWeight: typography.semibold,
    color: colors.warmWhite,
  },
  badgesCard: {
    backgroundColor: colors.warmWhite,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    ...shadows.sm,
  },
  badgesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  badge: {
    alignItems: 'center',
    padding: spacing.sm,
    backgroundColor: colors.lightGray,
    borderRadius: borderRadius.md,
    minWidth: 70,
  },
  badgeIcon: {
    fontSize: 24,
  },
  badgeName: {
    fontSize: typography.xs,
    color: colors.deepBlue,
    marginTop: 4,
    textAlign: 'center',
  },
  actionsCard: {
    backgroundColor: colors.warmWhite,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.md,
    ...shadows.sm,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    gap: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGray,
  },
  actionText: {
    flex: 1,
    fontSize: typography.base,
    color: colors.deepBlue,
  },
  signOutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    marginTop: spacing.md,
  },
  signOutText: {
    fontSize: typography.base,
    color: colors.error,
    fontWeight: typography.medium,
  },
  // Pricing card styles
  pricingCard: {
    backgroundColor: colors.warmWhite,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    ...shadows.sm,
  },
  pricingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  freeTag: {
    backgroundColor: colors.success + '20',
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.sm,
  },
  freeTagText: {
    fontSize: typography.xs,
    fontWeight: typography.semibold,
    color: colors.success,
  },
  pricingTiers: {
    gap: spacing.md,
  },
  pricingTier: {
    padding: spacing.md,
    backgroundColor: colors.lightGray,
    borderRadius: borderRadius.md,
  },
  pricingTierActive: {
    backgroundColor: colors.accent + '10',
    borderWidth: 2,
    borderColor: colors.accent,
  },
  tierPrice: {
    fontSize: typography.lg,
    fontWeight: typography.bold,
    color: colors.deepBlue,
  },
  tierName: {
    fontSize: typography.sm,
    color: colors.softGray,
    marginBottom: spacing.sm,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: 4,
  },
  featureText: {
    fontSize: typography.sm,
    color: colors.deepBlue,
  },
});
