import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  FlatList,
  Share,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, typography, shadows } from '../../lib/theme';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';

interface InvitedPerson {
  id: string;
  name: string;
  status: 'pending' | 'joined';
}

interface TierOnboardingScreenProps {
  navigation: any;
  route: {
    params?: {
      tier: 'besties' | 'squad' | 'realones';
    };
  };
}

const TIERS = {
  besties: {
    count: 4,
    name: 'Besties & Bros',
    emoji: '💜',
    title: 'Start With Your 4',
    subtitle: 'Who would you call at 2am? Add them first.',
    next: 'squad',
    color: '#9b59b6',
  },
  squad: {
    count: 12,
    name: 'Squad',
    emoji: '🔥',
    title: 'Build Your Squad',
    subtitle: 'Your ride-or-dies. The group chat crew.',
    next: 'realones',
    color: '#e74c3c',
  },
  realones: {
    count: 200,
    name: 'REALones',
    emoji: '✨',
    title: 'Your Full Circle',
    subtitle: 'Everyone who actually matters.',
    next: null,
    color: '#3d9b95',
  },
};

export default function TierOnboardingScreen({ navigation, route }: TierOnboardingScreenProps) {
  const { user, profile } = useAuth();
  const currentTier = route.params?.tier || 'besties';
  const tier = TIERS[currentTier];
  
  const [invited, setInvited] = useState<InvitedPerson[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [manualName, setManualName] = useState('');

  const spotsRemaining = tier.count - invited.length;
  const canProceed = invited.length >= tier.count;

  const addManualInvite = () => {
    if (!manualName.trim()) return;
    
    const newPerson: InvitedPerson = {
      id: `manual-${Date.now()}`,
      name: manualName.trim(),
      status: 'pending',
    };
    
    setInvited(prev => [...prev, newPerson]);
    setManualName('');
  };

  const removeInvite = (id: string) => {
    setInvited(prev => prev.filter(p => p.id !== id));
  };

  const sendInvites = async () => {
    const names = invited.map(p => p.name).join(', ');
    const tierName = tier.name;
    
    const message = currentTier === 'besties' 
      ? `You're one of my 4. 💜\n\nI'm starting fresh on REALones — an app for your REAL friends only. No algorithm, no ads.\n\nYou made my Besties list. Claim your spot:\nhttps://real-ones.app/invite/${user?.id}`
      : currentTier === 'squad'
      ? `You made my Squad. 🔥\n\nBuilding my inner circle on REALones. You're one of my 12.\n\nClaim your spot:\nhttps://real-ones.app/invite/${user?.id}`
      : `You're a REALone. ✨\n\nJoin me on REALones — the app for your actual friends.\n\nhttps://real-ones.app/invite/${user?.id}`;

    try {
      await Share.share({ message });
    } catch (err) {
      console.error('Share error:', err);
    }
  };

  const handleContinue = async () => {
    // Save to database
    if (user?.id) {
      const friendRecords = invited.map(person => ({
        user_id: user.id,
        friend_id: null,
        status: 'pending_invite',
        tier: currentTier,
        invited_name: person.name,
      }));

      await supabase.from('friends').insert(friendRecords);

      // Update profile tier
      await supabase
        .from('profiles')
        .update({ current_tier: tier.next || 'realones', onboarding_complete: !tier.next })
        .eq('id', user.id);
    }

    if (tier.next) {
      navigation.replace('TierOnboarding', { tier: tier.next });
    } else {
      navigation.replace('MainTabs');
    }
  };

  const renderInvitedPerson = ({ item, index }: { item: InvitedPerson; index: number }) => (
    <View style={styles.invitedRow}>
      <View style={[styles.invitedNumber, { backgroundColor: tier.color }]}>
        <Text style={styles.invitedNumberText}>{index + 1}</Text>
      </View>
      <View style={styles.invitedAvatar}>
        <Text style={styles.invitedAvatarText}>
          {item.name.charAt(0).toUpperCase()}
        </Text>
      </View>
      <Text style={styles.invitedName}>{item.name}</Text>
      <TouchableOpacity onPress={() => removeInvite(item.id)}>
        <Ionicons name="close-circle" size={28} color={colors.softGray} />
      </TouchableOpacity>
    </View>
  );

  const renderEmptySlot = (index: number) => (
    <View key={`empty-${index}`} style={styles.emptySlot}>
      <View style={[styles.emptyNumber, { borderColor: tier.color }]}>
        <Text style={[styles.emptyNumberText, { color: tier.color }]}>{invited.length + index + 1}</Text>
      </View>
      <View style={styles.emptyAvatar}>
        <Ionicons name="person-add" size={24} color={colors.softGray} />
      </View>
      <Text style={styles.emptyText}>Add someone</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.tierEmoji}>{tier.emoji}</Text>
        <Text style={styles.tierLabel}>{tier.name}</Text>
      </View>

      {/* Title */}
      <View style={styles.titleSection}>
        <Text style={styles.title}>{tier.title}</Text>
        <Text style={styles.subtitle}>{tier.subtitle}</Text>
      </View>

      {/* Progress */}
      <View style={styles.progressSection}>
        <View style={styles.progressBar}>
          <View 
            style={[
              styles.progressFill, 
              { 
                width: `${(invited.length / tier.count) * 100}%`,
                backgroundColor: tier.color 
              }
            ]} 
          />
        </View>
        <Text style={styles.progressText}>
          {invited.length} of {tier.count} added
        </Text>
      </View>

      {/* Add Input */}
      <View style={styles.addSection}>
        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            placeholder="Enter name..."
            placeholderTextColor={colors.softGray}
            value={manualName}
            onChangeText={setManualName}
            onSubmitEditing={addManualInvite}
          />
          <TouchableOpacity 
            style={[styles.addBtn, { backgroundColor: tier.color }]}
            onPress={addManualInvite}
          >
            <Ionicons name="add" size={28} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      {/* List */}
      <View style={styles.listSection}>
        <FlatList
          data={invited}
          renderItem={renderInvitedPerson}
          keyExtractor={item => item.id}
          ListFooterComponent={() => (
            <View>
              {Array.from({ length: Math.min(spotsRemaining, 3) }).map((_, i) => 
                renderEmptySlot(i)
              )}
              {spotsRemaining > 3 && (
                <Text style={styles.moreSlots}>+{spotsRemaining - 3} more spots</Text>
              )}
            </View>
          )}
          showsVerticalScrollIndicator={false}
        />
      </View>

      {/* Bottom Actions */}
      <View style={styles.bottomActions}>
        {invited.length > 0 && (
          <TouchableOpacity style={styles.sendBtn} onPress={sendInvites}>
            <Ionicons name="paper-plane" size={20} color={tier.color} />
            <Text style={[styles.sendBtnText, { color: tier.color }]}>
              Send Invites
            </Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity 
          style={[
            styles.continueBtn, 
            { backgroundColor: canProceed ? tier.color : colors.softGray }
          ]}
          onPress={handleContinue}
          disabled={invited.length === 0}
        >
          <Text style={styles.continueBtnText}>
            {canProceed 
              ? tier.next 
                ? `Continue to ${TIERS[tier.next].name}` 
                : 'Finish Setup'
              : `Add ${spotsRemaining} more to continue`
            }
          </Text>
          <Ionicons name="arrow-forward" size={22} color="#fff" />
        </TouchableOpacity>

        {invited.length > 0 && invited.length < tier.count && (
          <TouchableOpacity 
            style={styles.skipBtn}
            onPress={handleContinue}
          >
            <Text style={styles.skipBtnText}>
              Continue with {invited.length} for now
            </Text>
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
    paddingTop: spacing.lg,
  },
  tierEmoji: {
    fontSize: 48,
    marginBottom: spacing.xs,
  },
  tierLabel: {
    fontSize: typography.sm,
    color: colors.softGray,
    textTransform: 'uppercase',
    letterSpacing: 2,
    fontWeight: typography.semibold,
  },
  titleSection: {
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
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
  },
  progressSection: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
  },
  progressBar: {
    height: 8,
    backgroundColor: 'rgba(255,255,255,0.5)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressText: {
    fontSize: typography.sm,
    color: colors.softGray,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
  addSection: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
  },
  inputRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  input: {
    flex: 1,
    backgroundColor: colors.warmWhite,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    fontSize: typography.base,
    color: colors.deepBlue,
  },
  addBtn: {
    width: 56,
    height: 56,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listSection: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
  },
  invitedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.warmWhite,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.sm,
    gap: spacing.md,
  },
  invitedNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  invitedNumberText: {
    fontSize: typography.sm,
    fontWeight: typography.bold,
    color: '#fff',
  },
  invitedAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.sky,
    alignItems: 'center',
    justifyContent: 'center',
  },
  invitedAvatarText: {
    fontSize: typography.lg,
    fontWeight: typography.semibold,
    color: colors.deepBlue,
  },
  invitedName: {
    flex: 1,
    fontSize: typography.base,
    fontWeight: typography.medium,
    color: colors.deepBlue,
  },
  emptySlot: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.3)',
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.sm,
    gap: spacing.md,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: 'rgba(0,0,0,0.1)',
  },
  emptyNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
  },
  emptyNumberText: {
    fontSize: typography.sm,
    fontWeight: typography.bold,
  },
  emptyAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    flex: 1,
    fontSize: typography.base,
    color: colors.softGray,
  },
  moreSlots: {
    textAlign: 'center',
    color: colors.softGray,
    fontSize: typography.sm,
    marginTop: spacing.sm,
  },
  bottomActions: {
    padding: spacing.lg,
    gap: spacing.md,
  },
  sendBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    gap: spacing.sm,
  },
  sendBtnText: {
    fontSize: typography.base,
    fontWeight: typography.semibold,
  },
  continueBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    gap: spacing.sm,
  },
  continueBtnText: {
    fontSize: typography.lg,
    fontWeight: typography.semibold,
    color: '#fff',
  },
  skipBtn: {
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  skipBtnText: {
    fontSize: typography.sm,
    color: colors.softGray,
  },
});
