import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, typography, shadows } from '../../lib/theme';

interface InvitesSentScreenProps {
  navigation: any;
  route: {
    params: {
      count: number;
      friends: { name: string }[];
    };
  };
}

export default function InvitesSentScreen({ navigation, route }: InvitesSentScreenProps) {
  const { count, friends } = route.params;

  const handleContinue = () => {
    navigation.navigate('MainTabs');
  };

  const handleInviteMore = () => {
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Success Animation */}
        <View style={styles.successIcon}>
          <Ionicons name="paper-plane" size={64} color={colors.accent} />
        </View>

        <Text style={styles.title}>Spots Saved! 🎉</Text>
        
        <Text style={styles.subtitle}>
          You invited {count} friend{count !== 1 ? 's' : ''} to claim their spot in your top 200.
        </Text>

        {/* Preview of invited friends */}
        <View style={styles.invitedList}>
          {friends.slice(0, 5).map((friend, idx) => (
            <View key={idx} style={styles.invitedRow}>
              <View style={styles.invitedAvatar}>
                <Text style={styles.invitedAvatarText}>
                  {friend.name.charAt(0).toUpperCase()}
                </Text>
              </View>
              <Text style={styles.invitedName}>{friend.name}</Text>
              <View style={styles.pendingBadge}>
                <Text style={styles.pendingText}>Pending</Text>
              </View>
            </View>
          ))}
          {friends.length > 5 && (
            <Text style={styles.moreText}>
              +{friends.length - 5} more
            </Text>
          )}
        </View>

        {/* What happens next */}
        <View style={styles.nextSteps}>
          <Text style={styles.nextStepsTitle}>What happens next:</Text>
          <View style={styles.nextStep}>
            <Ionicons name="notifications" size={20} color={colors.accent} />
            <Text style={styles.nextStepText}>
              They'll get your invite with a personal link
            </Text>
          </View>
          <View style={styles.nextStep}>
            <Ionicons name="person-add" size={20} color={colors.accent} />
            <Text style={styles.nextStepText}>
              When they join, you're auto-connected
            </Text>
          </View>
          <View style={styles.nextStep}>
            <Ionicons name="heart" size={20} color={colors.accent} />
            <Text style={styles.nextStepText}>
              You'll both be in each other's top 200
            </Text>
          </View>
        </View>
      </View>

      {/* Bottom Actions */}
      <View style={styles.bottomActions}>
        <TouchableOpacity style={styles.continueBtn} onPress={handleContinue}>
          <Text style={styles.continueBtnText}>Continue to REALones</Text>
          <Ionicons name="arrow-forward" size={20} color="#fff" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.inviteMoreBtn} onPress={handleInviteMore}>
          <Ionicons name="add-circle-outline" size={20} color={colors.accent} />
          <Text style={styles.inviteMoreText}>Invite More Friends</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.babyBlue,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xxl,
    alignItems: 'center',
  },
  successIcon: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.warmWhite,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
    ...shadows.md,
  },
  title: {
    fontSize: typography['2xl'],
    fontWeight: typography.bold,
    color: colors.deepBlue,
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontSize: typography.base,
    color: colors.softGray,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  invitedList: {
    alignSelf: 'stretch',
    backgroundColor: colors.warmWhite,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.xl,
    ...shadows.sm,
  },
  invitedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  invitedAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.sky,
    alignItems: 'center',
    justifyContent: 'center',
  },
  invitedAvatarText: {
    fontSize: typography.base,
    fontWeight: typography.semibold,
    color: colors.deepBlue,
  },
  invitedName: {
    flex: 1,
    marginLeft: spacing.md,
    fontSize: typography.base,
    color: colors.deepBlue,
  },
  pendingBadge: {
    backgroundColor: colors.sky,
    paddingVertical: 4,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.sm,
  },
  pendingText: {
    fontSize: typography.xs,
    color: colors.deepBlue,
    fontWeight: typography.medium,
  },
  moreText: {
    textAlign: 'center',
    color: colors.softGray,
    fontSize: typography.sm,
    marginTop: spacing.sm,
  },
  nextSteps: {
    alignSelf: 'stretch',
  },
  nextStepsTitle: {
    fontSize: typography.base,
    fontWeight: typography.semibold,
    color: colors.deepBlue,
    marginBottom: spacing.md,
  },
  nextStep: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.sm,
  },
  nextStepText: {
    fontSize: typography.sm,
    color: colors.softGray,
    flex: 1,
  },
  bottomActions: {
    padding: spacing.lg,
    paddingBottom: spacing.xl,
  },
  continueBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.deepBlue,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    gap: spacing.sm,
    ...shadows.md,
  },
  continueBtnText: {
    color: '#fff',
    fontSize: typography.lg,
    fontWeight: typography.semibold,
  },
  inviteMoreBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    gap: spacing.sm,
  },
  inviteMoreText: {
    color: colors.accent,
    fontSize: typography.base,
    fontWeight: typography.medium,
  },
});
