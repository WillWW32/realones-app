import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  FlatList,
  Share,
  Animated,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, typography, shadows } from '../../lib/theme';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';

type Tier = 'besties' | 'squad' | 'realones';

interface TierConfig {
  name: string;
  count: number;
  emoji: string;
  description: string;
  nextTier: Tier | null;
  color: string;
}

const TIERS: Record<Tier, TierConfig> = {
  besties: {
    name: 'Besties & Bros',
    count: 4,
    emoji: '💜',
    description: 'Your ride or dies. The 4 people you text every day.',
    nextTier: 'squad',
    color: '#9b59b6',
  },
  squad: {
    name: 'Squad',
    count: 12,
    emoji: '🔥',
    description: 'Your inner circle. The 12 who always show up.',
    nextTier: 'realones',
    color: '#e74c3c',
  },
  realones: {
    name: 'REALones',
    count: 200,
    emoji: '💯',
    description: 'Your real friends. Everyone who actually matters.',
    nextTier: null,
    color: '#3d9b95',
  },
};

interface Friend {
  id: string;
  name: string;
  phone?: string;
  invited: boolean;
  joined: boolean;
  tier: Tier;
}

export default function TieredOnboardingScreen({ navigation }: any) {
  const { user, profile } = useAuth();
  const [currentTier, setCurrentTier] = useState<Tier>('besties');
  const [friends, setFriends] = useState<Friend[]>([]);
  const [inputName, setInputName] = useState('');
  const [inputPhone, setInputPhone] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const pulseAnim = useState(new Animated.Value(1))[0];

  const tierConfig = TIERS[currentTier];
  const tierFriends = friends.filter(f => f.tier === currentTier);
  const filledCount = tierFriends.length;
  const remainingCount = tierConfig.count - filledCount;
  const isComplete = filledCount >= tierConfig.count;

  useEffect(() => {
    // Pulse animation for progress
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

  const addFriend = () => {
    if (!inputName.trim()) return;

    const newFriend: Friend = {
      id: `friend-${Date.now()}`,
      name: inputName.trim(),
      phone: inputPhone.trim() || undefined,
      invited: false,
      joined: false,
      tier: currentTier,
    };

    setFriends([...friends, newFriend]);
    setInputName('');
    setInputPhone('');
    setShowAddForm(false);
  };

  const inviteFriend = async (friend: Friend) => {
    const message = `I just got real. 🎯\n\nYou're one of my ${tierConfig.name} on REALones — the app for your actual friends.\n\nClaim your spot:\nhttps://real-ones.app/invite/${user?.id || 'join'}`;

    try {
      await Share.share({ message });
      setFriends(friends.map(f => 
        f.id === friend.id ? { ...f, invited: true } : f
      ));
    } catch (error) {
      console.error('Share error:', error);
    }
  };

  const unlockNextTier = () => {
    if (tierConfig.nextTier) {
      setCurrentTier(tierConfig.nextTier);
    } else {
      // All tiers complete - go to main app
      navigation.replace('MainTabs');
    }
  };

  const skipToMain = () => {
    navigation.replace('MainTabs');
  };

  const renderFriend = ({ item }: { item: Friend }) => (
    <View style={styles.friendCard}>
      <View style={[styles.friendAvatar, { backgroundColor: tierConfig.color }]}>
        <Text style={styles.friendAvatarText}>
          {item.name.charAt(0).toUpperCase()}
        </Text>
      </View>
      <View style={styles.friendInfo}>
        <Text style={styles.friendName}>{item.name}</Text>
        {item.joined ? (
          <Text style={styles.friendStatus}>✓ Joined</Text>
        ) : item.invited ? (
          <Text style={styles.friendStatusPending}>Invited</Text>
        ) : null}
      </View>
      {!item.invited && !item.joined && (
        <TouchableOpacity
          style={[styles.inviteBtn, { backgroundColor: tierConfig.color }]}
          onPress={() => inviteFriend(item)}
        >
          <Text style={styles.inviteBtnText}>Invite</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  const renderEmptySlot = (index: number) => (
    <TouchableOpacity
      key={`empty-${index}`}
      style={styles.emptySlot}
      onPress={() => setShowAddForm(true)}
    >
      <Ionicons name="add-circle-outline" size={32} color={colors.softGray} />
      <Text style={styles.emptySlotText}>Add #{filledCount + index + 1}</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Image
          source={require('../../../assets/logo.png')}
          style={styles.logo}
          resizeMode="contain"
        />
      </View>

      {/* Tier Progress */}
      <View style={styles.tierProgress}>
        {Object.entries(TIERS).map(([key, config], index) => (
          <View key={key} style={styles.tierDot}>
            <View
              style={[
                styles.dot,
                {
                  backgroundColor:
                    key === currentTier
                      ? config.color
                      : friends.filter(f => f.tier === key).length >= config.count
                      ? colors.accent
                      : colors.lightGray,
                },
              ]}
            >
              {friends.filter(f => f.tier === key).length >= config.count && (
                <Ionicons name="checkmark" size={16} color="#fff" />
              )}
            </View>
            <Text
              style={[
                styles.tierLabel,
                key === currentTier && { color: config.color, fontWeight: '700' },
              ]}
            >
              {config.count}
            </Text>
          </View>
        ))}
      </View>

      {/* Current Tier Card */}
      <Animated.View
        style={[
          styles.tierCard,
          { borderColor: tierConfig.color, transform: [{ scale: pulseAnim }] },
        ]}
      >
        <Text style={styles.tierEmoji}>{tierConfig.emoji}</Text>
        <Text style={[styles.tierName, { color: tierConfig.color }]}>
          {tierConfig.name}
        </Text>
        <Text style={styles.tierDescription}>{tierConfig.description}</Text>
        <View style={styles.progressBar}>
          <View
            style={[
              styles.progressFill,
              {
                width: `${(filledCount / tierConfig.count) * 100}%`,
                backgroundColor: tierConfig.color,
              },
            ]}
          />
        </View>
        <Text style={styles.progressText}>
          {filledCount} of {tierConfig.count}
        </Text>
      </Animated.View>

      {/* Friends List */}
      <View style={styles.friendsSection}>
        <Text style={styles.sectionTitle}>
          {isComplete ? 'Your ' : 'Add Your '}{tierConfig.name}
        </Text>

        <FlatList
          data={tierFriends}
          renderItem={renderFriend}
          keyExtractor={item => item.id}
          ListFooterComponent={
            <>
              {!isComplete &&
                Array.from({ length: Math.min(remainingCount, 3) }).map((_, i) =>
                  renderEmptySlot(i)
                )}
            </>
          }
          style={styles.friendsList}
          showsVerticalScrollIndicator={false}
        />
      </View>

      {/* Add Friend Form */}
      {showAddForm && (
        <View style={styles.addFormOverlay}>
          <View style={styles.addForm}>
            <Text style={styles.addFormTitle}>Add to {tierConfig.name}</Text>
            <TextInput
              style={styles.input}
              placeholder="Friend's name"
              placeholderTextColor={colors.softGray}
              value={inputName}
              onChangeText={setInputName}
              autoFocus
            />
            <TextInput
              style={styles.input}
              placeholder="Phone (optional)"
              placeholderTextColor={colors.softGray}
              value={inputPhone}
              onChangeText={setInputPhone}
              keyboardType="phone-pad"
            />
            <View style={styles.addFormButtons}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setShowAddForm(false)}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.addBtn, { backgroundColor: tierConfig.color }]}
                onPress={addFriend}
              >
                <Text style={styles.addBtnText}>Add</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {/* Bottom Actions */}
      <View style={styles.bottomActions}>
        {isComplete ? (
          <TouchableOpacity
            style={[styles.unlockBtn, { backgroundColor: tierConfig.color }]}
            onPress={unlockNextTier}
          >
            <Text style={styles.unlockBtnText}>
              {tierConfig.nextTier
                ? `Unlock ${TIERS[tierConfig.nextTier].name} →`
                : 'Enter REALones →'}
            </Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.skipBtn} onPress={skipToMain}>
            <Text style={styles.skipBtnText}>I'll finish later</Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.babyBlue,
  },
  header: {
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  logo: {
    width: 150,
    height: 60,
  },
  tierProgress: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 40,
    paddingVertical: spacing.md,
  },
  tierDot: {
    alignItems: 'center',
  },
  dot: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tierLabel: {
    marginTop: 6,
    fontSize: typography.sm,
    color: colors.softGray,
  },
  tierCard: {
    marginHorizontal: spacing.lg,
    backgroundColor: colors.warmWhite,
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    alignItems: 'center',
    borderWidth: 3,
    ...shadows.md,
  },
  tierEmoji: {
    fontSize: 48,
    marginBottom: spacing.sm,
  },
  tierName: {
    fontSize: typography['2xl'],
    fontWeight: '700',
    marginBottom: spacing.xs,
  },
  tierDescription: {
    fontSize: typography.base,
    color: colors.softGray,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  progressBar: {
    width: '100%',
    height: 8,
    backgroundColor: colors.lightGray,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressText: {
    marginTop: spacing.sm,
    fontSize: typography.sm,
    color: colors.softGray,
  },
  friendsSection: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
  },
  sectionTitle: {
    fontSize: typography.lg,
    fontWeight: '600',
    color: colors.deepBlue,
    marginBottom: spacing.md,
  },
  friendsList: {
    flex: 1,
  },
  friendCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.warmWhite,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.sm,
    ...shadows.sm,
  },
  friendAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
  },
  friendAvatarText: {
    color: '#fff',
    fontSize: typography.lg,
    fontWeight: '700',
  },
  friendInfo: {
    flex: 1,
    marginLeft: spacing.md,
  },
  friendName: {
    fontSize: typography.base,
    fontWeight: '600',
    color: colors.deepBlue,
  },
  friendStatus: {
    fontSize: typography.sm,
    color: colors.accent,
  },
  friendStatusPending: {
    fontSize: typography.sm,
    color: colors.softGray,
  },
  inviteBtn: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
  },
  inviteBtnText: {
    color: '#fff',
    fontSize: typography.sm,
    fontWeight: '600',
  },
  emptySlot: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.5)',
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.sm,
    borderWidth: 2,
    borderColor: colors.lightGray,
    borderStyle: 'dashed',
    gap: spacing.md,
  },
  emptySlotText: {
    fontSize: typography.base,
    color: colors.softGray,
  },
  addFormOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  addForm: {
    backgroundColor: colors.warmWhite,
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    width: '100%',
    maxWidth: 400,
  },
  addFormTitle: {
    fontSize: typography.xl,
    fontWeight: '700',
    color: colors.deepBlue,
    marginBottom: spacing.lg,
    textAlign: 'center',
  },
  input: {
    backgroundColor: colors.lightGray,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    fontSize: typography.base,
    marginBottom: spacing.md,
    color: colors.deepBlue,
  },
  addFormButtons: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.sm,
  },
  cancelBtn: {
    flex: 1,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    backgroundColor: colors.lightGray,
    alignItems: 'center',
  },
  cancelBtnText: {
    color: colors.softGray,
    fontWeight: '600',
  },
  addBtn: {
    flex: 1,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  addBtnText: {
    color: '#fff',
    fontWeight: '600',
  },
  bottomActions: {
    padding: spacing.lg,
  },
  unlockBtn: {
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    ...shadows.md,
  },
  unlockBtnText: {
    color: '#fff',
    fontSize: typography.lg,
    fontWeight: '700',
  },
  skipBtn: {
    padding: spacing.md,
    alignItems: 'center',
  },
  skipBtnText: {
    color: colors.softGray,
    fontSize: typography.base,
  },
});
