import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Share,
  TextInput,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, typography, shadows } from '../../lib/theme';
import { useAuth } from '../../hooks/useAuth';

interface Friend {
  id: string;
  name: string;
  invited: boolean;
  spotsLeft?: number; // If they're already on the app
  onApp: boolean;
}

interface InviteFriendsScreenProps {
  navigation: any;
  route: {
    params?: {
      importedFriends?: { name: string; timestamp?: number }[];
    };
  };
}

export default function InviteFriendsScreen({ navigation, route }: InviteFriendsScreenProps) {
  const { profile } = useAuth();
  const importedFriends = route.params?.importedFriends || [];
  
  // Convert imported friends to our format
  const [friends, setFriends] = useState<Friend[]>(
    importedFriends.map((f, idx) => ({
      id: `imported-${idx}`,
      name: f.name,
      invited: false,
      onApp: false, // We'd check this against our DB in real implementation
    }))
  );
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCount, setSelectedCount] = useState(0);
  const maxInvites = 20; // First batch

  const filteredFriends = friends.filter(f => 
    f.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleInvite = (id: string) => {
    setFriends(prev => prev.map(f => {
      if (f.id === id) {
        const newInvited = !f.invited;
        setSelectedCount(c => newInvited ? c + 1 : c - 1);
        return { ...f, invited: newInvited };
      }
      return f;
    }));
  };

  const selectAll = () => {
    const toSelect = filteredFriends.slice(0, maxInvites);
    setFriends(prev => prev.map(f => ({
      ...f,
      invited: toSelect.some(s => s.id === f.id)
    })));
    setSelectedCount(Math.min(filteredFriends.length, maxInvites));
  };

  const sendInvites = async () => {
    const selectedFriends = friends.filter(f => f.invited);
    
    if (selectedFriends.length === 0) {
      Alert.alert('Select Friends', 'Pick some friends to invite first!');
      return;
    }

    const inviteMessage = `I just got real. 🎯\n\nI saved you a spot in my top 200 on REALones — the app for your actual friends, no algorithm.\n\nClaim your spot before I fill up:\nhttps://real-ones.app/invite/${profile?.id || 'join'}`;

    try {
      await Share.share({
        message: inviteMessage,
      });
      
      // Mark as invited and navigate
      navigation.navigate('InvitesSent', { 
        count: selectedFriends.length,
        friends: selectedFriends 
      });
    } catch (error) {
      console.error('Share error:', error);
    }
  };

  const skipForNow = () => {
    navigation.navigate('MainTabs');
  };

  const renderFriend = ({ item }: { item: Friend }) => (
    <TouchableOpacity
      style={[styles.friendRow, item.invited && styles.friendRowSelected]}
      onPress={() => toggleInvite(item.id)}
    >
      <View style={styles.friendAvatar}>
        <Text style={styles.friendAvatarText}>
          {item.name.charAt(0).toUpperCase()}
        </Text>
      </View>
      <View style={styles.friendInfo}>
        <Text style={styles.friendName}>{item.name}</Text>
        {item.onApp && (
          <Text style={styles.friendStatus}>
            On REALones · {item.spotsLeft} spots left
          </Text>
        )}
      </View>
      <View style={[styles.checkbox, item.invited && styles.checkboxSelected]}>
        {item.invited && (
          <Ionicons name="checkmark" size={16} color="#fff" />
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Save Your Spots</Text>
        <Text style={styles.subtitle}>
          Invite friends before their 200 fill up — and claim your spot in theirs!
        </Text>
      </View>

      {/* Urgency Banner */}
      <View style={styles.urgencyBanner}>
        <Ionicons name="flash" size={20} color={colors.warmWhite} />
        <Text style={styles.urgencyText}>
          Early users fill up fast. Invite now!
        </Text>
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color={colors.softGray} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search friends..."
          placeholderTextColor={colors.softGray}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Quick Actions */}
      <View style={styles.quickActions}>
        <TouchableOpacity style={styles.selectAllBtn} onPress={selectAll}>
          <Text style={styles.selectAllText}>Select Top {maxInvites}</Text>
        </TouchableOpacity>
        <Text style={styles.selectedCount}>
          {selectedCount} selected
        </Text>
      </View>

      {/* Friends List */}
      <FlatList
        data={filteredFriends}
        renderItem={renderFriend}
        keyExtractor={item => item.id}
        style={styles.list}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />

      {/* Bottom Actions */}
      <View style={styles.bottomActions}>
        <TouchableOpacity 
          style={[styles.inviteBtn, selectedCount === 0 && styles.inviteBtnDisabled]}
          onPress={sendInvites}
        >
          <Ionicons name="paper-plane" size={20} color="#fff" />
          <Text style={styles.inviteBtnText}>
            Send {selectedCount} Invite{selectedCount !== 1 ? 's' : ''}
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.skipBtn} onPress={skipForNow}>
          <Text style={styles.skipBtnText}>I'll invite later</Text>
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
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  title: {
    fontSize: typography['2xl'],
    fontWeight: typography.bold,
    color: colors.deepBlue,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: typography.base,
    color: colors.softGray,
    lineHeight: 22,
  },
  urgencyBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.accent,
    marginHorizontal: spacing.lg,
    marginVertical: spacing.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    gap: spacing.sm,
  },
  urgencyText: {
    color: colors.warmWhite,
    fontWeight: typography.semibold,
    fontSize: typography.sm,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.warmWhite,
    marginHorizontal: spacing.lg,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    gap: spacing.sm,
  },
  searchInput: {
    flex: 1,
    paddingVertical: spacing.sm,
    fontSize: typography.base,
    color: colors.deepBlue,
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  selectAllBtn: {
    backgroundColor: colors.sky,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.sm,
  },
  selectAllText: {
    color: colors.deepBlue,
    fontWeight: typography.medium,
    fontSize: typography.sm,
  },
  selectedCount: {
    color: colors.softGray,
    fontSize: typography.sm,
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
  },
  friendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.warmWhite,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.sm,
  },
  friendRowSelected: {
    backgroundColor: '#e8f5f4',
    borderWidth: 2,
    borderColor: colors.accent,
  },
  friendAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.sky,
    alignItems: 'center',
    justifyContent: 'center',
  },
  friendAvatarText: {
    fontSize: typography.lg,
    fontWeight: typography.semibold,
    color: colors.deepBlue,
  },
  friendInfo: {
    flex: 1,
    marginLeft: spacing.md,
  },
  friendName: {
    fontSize: typography.base,
    fontWeight: typography.medium,
    color: colors.deepBlue,
  },
  friendStatus: {
    fontSize: typography.sm,
    color: colors.accent,
    marginTop: 2,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.softGray,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxSelected: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  bottomActions: {
    padding: spacing.lg,
    paddingBottom: spacing.xl,
    backgroundColor: colors.babyBlue,
  },
  inviteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.deepBlue,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    gap: spacing.sm,
    ...shadows.md,
  },
  inviteBtnDisabled: {
    backgroundColor: colors.softGray,
  },
  inviteBtnText: {
    color: '#fff',
    fontSize: typography.lg,
    fontWeight: typography.semibold,
  },
  skipBtn: {
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  skipBtnText: {
    color: colors.softGray,
    fontSize: typography.base,
  },
});
