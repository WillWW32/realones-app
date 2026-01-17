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
import { CONSTANTS } from '../../types';

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
          <TouchableOpacity style={styles.editProfileBtn}>
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
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{CONSTANTS.FREE_FRIEND_LIMIT}</Text>
              <Text style={styles.statLabel}>Free Limit</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{archivedCount}</Text>
              <Text style={styles.statLabel}>Archived</Text>
            </View>
          </View>

          {isOverLimit && (
            <View style={styles.upgradeNotice}>
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

        {/* Streak Card */}
        <View style={styles.streakCard}>
          <View style={styles.streakHeader}>
            <Ionicons name="flame" size={28} color={colors.streakFire} />
            <View style={styles.streakInfo}>
              <Text style={styles.streakNumber}>{streak?.current_streak || 0}</Text>
              <Text style={styles.streakLabel}>Day Streak</Text>
            </View>
          </View>
          <View style={styles.streakStats}>
            <View style={styles.miniStat}>
              <Text style={styles.miniStatNumber}>{streak?.longest_streak || 0}</Text>
              <Text style={styles.miniStatLabel}>Best</Text>
            </View>
            <View style={styles.miniStat}>
              <Text style={styles.miniStatNumber}>{badges.length}</Text>
              <Text style={styles.miniStatLabel}>Badges</Text>
            </View>
          </View>
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
  statDivider: {
    width: 1,
    backgroundColor: colors.lightGray,
  },
  upgradeNotice: {
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.lightGray,
    alignItems: 'center',
  },
  upgradeText: {
    fontSize: typography.sm,
    color: colors.softGray,
    marginBottom: spacing.sm,
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
  streakHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  streakInfo: {
    flex: 1,
  },
  streakNumber: {
    fontSize: typography['3xl'],
    fontWeight: typography.bold,
    color: colors.deepBlue,
  },
  streakLabel: {
    fontSize: typography.sm,
    color: colors.softGray,
  },
  streakStats: {
    flexDirection: 'row',
    marginTop: spacing.md,
    gap: spacing.xl,
  },
  miniStat: {
    alignItems: 'center',
  },
  miniStatNumber: {
    fontSize: typography.lg,
    fontWeight: typography.semibold,
    color: colors.deepBlue,
  },
  miniStatLabel: {
    fontSize: typography.xs,
    color: colors.softGray,
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
});
