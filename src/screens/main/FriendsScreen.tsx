import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, typography, shadows } from '../../lib/theme';
import { useFriends } from '../../hooks/useFriends';
import { Friend, CONSTANTS } from '../../types';

type TabType = 'active' | 'archived' | 'import';

interface FriendItemProps {
  friend: Friend;
  onArchive?: () => void;
  onActivate?: () => void;
  onRemove?: () => void;
}

function FriendItem({ friend, onArchive, onActivate, onRemove }: FriendItemProps) {
  const profile = friend.friend_profile;
  const fbData = friend.facebook_data;
  const name = profile?.full_name || fbData?.name || 'Unknown';
  const initial = name.charAt(0).toUpperCase();

  return (
    <View style={styles.friendItem}>
      <View style={styles.friendAvatar}>
        {profile?.avatar_url ? (
          <Image source={{ uri: profile.avatar_url }} style={styles.avatarImage} />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <Text style={styles.avatarText}>{initial}</Text>
          </View>
        )}
      </View>

      <View style={styles.friendInfo}>
        <Text style={styles.friendName}>{name}</Text>
        {friend.source === 'facebook_import' && !profile && (
          <Text style={styles.friendSubtext}>Imported from Facebook</Text>
        )}
      </View>

      <View style={styles.friendActions}>
        {friend.status === 'active' && onArchive && (
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={onArchive}
          >
            <Ionicons name="archive-outline" size={20} color={colors.softGray} />
          </TouchableOpacity>
        )}
        {friend.status === 'archived' && onActivate && (
          <TouchableOpacity
            style={[styles.actionBtn, styles.activateBtn]}
            onPress={onActivate}
          >
            <Ionicons name="person-add-outline" size={20} color={colors.accent} />
          </TouchableOpacity>
        )}
        {friend.status === 'import_pool' && (
          <>
            <TouchableOpacity
              style={[styles.actionBtn, styles.activateBtn]}
              onPress={onActivate}
            >
              <Ionicons name="checkmark" size={20} color={colors.success} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionBtn}
              onPress={onArchive}
            >
              <Ionicons name="archive-outline" size={20} color={colors.softGray} />
            </TouchableOpacity>
          </>
        )}
      </View>
    </View>
  );
}

export default function FriendsScreen({ navigation }: any) {
  const [activeTab, setActiveTab] = useState<TabType>('active');
  const [searchQuery, setSearchQuery] = useState('');
  
  const {
    activeFriends,
    archivedFriends,
    importPoolFriends,
    loading,
    activeCount,
    isOverLimit,
    extraFriendsNeeded,
    archiveFriend,
    activateFriend,
    refresh,
  } = useFriends();

  const handleArchive = async (friendshipId: string) => {
    try {
      await archiveFriend(friendshipId);
    } catch (error) {
      Alert.alert('Error', 'Failed to archive friend');
    }
  };

  const handleActivate = async (friendshipId: string) => {
    try {
      await activateFriend(friendshipId);
    } catch (error) {
      Alert.alert('Error', 'Failed to activate friend');
    }
  };

  const filterFriends = (friends: Friend[]) => {
    if (!searchQuery) return friends;
    const query = searchQuery.toLowerCase();
    return friends.filter((f) => {
      const name = f.friend_profile?.full_name || f.facebook_data?.name || '';
      return name.toLowerCase().includes(query);
    });
  };

  const getCurrentList = () => {
    switch (activeTab) {
      case 'active':
        return filterFriends(activeFriends);
      case 'archived':
        return filterFriends(archivedFriends);
      case 'import':
        return filterFriends(importPoolFriends);
    }
  };

  const renderFriend = ({ item }: { item: Friend }) => (
    <FriendItem
      friend={item}
      onArchive={
        item.status === 'active' || item.status === 'import_pool'
          ? () => handleArchive(item.id)
          : undefined
      }
      onActivate={
        item.status === 'archived' || item.status === 'import_pool'
          ? () => handleActivate(item.id)
          : undefined
      }
    />
  );

  const renderHeader = () => (
    <>
      {/* Circle Stats */}
      <View style={styles.statsCard}>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{activeCount}</Text>
          <Text style={styles.statLabel}>Active Circle</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{CONSTANTS.FREE_FRIEND_LIMIT}</Text>
          <Text style={styles.statLabel}>Free Limit</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{archivedFriends.length}</Text>
          <Text style={styles.statLabel}>Remember Me</Text>
        </View>
      </View>

      {/* Over limit warning */}
      {isOverLimit && (
        <View style={styles.warningCard}>
          <Ionicons name="warning" size={20} color={colors.warning} />
          <Text style={styles.warningText}>
            You're {extraFriendsNeeded} over the free limit.{' '}
            <Text style={styles.warningLink}>
              ${Math.ceil(extraFriendsNeeded / 10)}/mo to keep them active
            </Text>
          </Text>
        </View>
      )}

      {/* Import pool notice */}
      {importPoolFriends.length > 0 && (
        <TouchableOpacity
          style={styles.importNotice}
          onPress={() => setActiveTab('import')}
        >
          <Ionicons name="cloud-download" size={20} color={colors.accent} />
          <Text style={styles.importNoticeText}>
            {importPoolFriends.length} friends waiting to be sorted
          </Text>
          <Ionicons name="chevron-forward" size={20} color={colors.accent} />
        </TouchableOpacity>
      )}

      {/* Tabs */}
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'active' && styles.tabActive]}
          onPress={() => setActiveTab('active')}
        >
          <Text style={[styles.tabText, activeTab === 'active' && styles.tabTextActive]}>
            Active ({activeFriends.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'archived' && styles.tabActive]}
          onPress={() => setActiveTab('archived')}
        >
          <Text style={[styles.tabText, activeTab === 'archived' && styles.tabTextActive]}>
            Remember Me ({archivedFriends.length})
          </Text>
        </TouchableOpacity>
        {importPoolFriends.length > 0 && (
          <TouchableOpacity
            style={[styles.tab, activeTab === 'import' && styles.tabActive]}
            onPress={() => setActiveTab('import')}
          >
            <Text style={[styles.tabText, activeTab === 'import' && styles.tabTextActive]}>
              Import ({importPoolFriends.length})
            </Text>
          </TouchableOpacity>
        )}
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
    </>
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Ionicons
        name={activeTab === 'archived' ? 'archive-outline' : 'people-outline'}
        size={48}
        color={colors.softGray}
      />
      <Text style={styles.emptyText}>
        {activeTab === 'active'
          ? 'No active friends yet'
          : activeTab === 'archived'
          ? 'No archived friends'
          : 'No imports to sort'}
      </Text>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Friends</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.accent} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Friends</Text>
        <TouchableOpacity onPress={() => navigation.navigate('AddFriend')}>
          <Ionicons name="person-add" size={24} color={colors.accent} />
        </TouchableOpacity>
      </View>

      <FlatList
        data={getCurrentList()}
        renderItem={renderFriend}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmpty}
        contentContainerStyle={styles.listContent}
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
  headerTitle: {
    fontSize: typography['2xl'],
    fontWeight: typography.semibold,
    color: colors.deepBlue,
  },
  listContent: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.xxl,
  },
  statsCard: {
    flexDirection: 'row',
    backgroundColor: colors.warmWhite,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    ...shadows.sm,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
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
    marginHorizontal: spacing.sm,
  },
  warningCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef3e2',
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  warningText: {
    flex: 1,
    fontSize: typography.sm,
    color: colors.deepBlue,
  },
  warningLink: {
    color: colors.accent,
    fontWeight: typography.medium,
  },
  importNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.warmWhite,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    gap: spacing.sm,
    ...shadows.sm,
  },
  importNoticeText: {
    flex: 1,
    fontSize: typography.base,
    color: colors.deepBlue,
  },
  tabs: {
    flexDirection: 'row',
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  tab: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.full,
    backgroundColor: colors.warmWhite,
  },
  tabActive: {
    backgroundColor: colors.deepBlue,
  },
  tabText: {
    fontSize: typography.sm,
    color: colors.softGray,
    fontWeight: typography.medium,
  },
  tabTextActive: {
    color: colors.warmWhite,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.warmWhite,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
    ...shadows.sm,
  },
  searchInput: {
    flex: 1,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    fontSize: typography.base,
    color: colors.deepBlue,
  },
  friendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.warmWhite,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    ...shadows.sm,
  },
  friendAvatar: {
    marginRight: spacing.md,
  },
  avatarImage: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  avatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.sky,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: typography.lg,
    fontWeight: typography.semibold,
    color: colors.deepBlue,
  },
  friendInfo: {
    flex: 1,
  },
  friendName: {
    fontSize: typography.base,
    fontWeight: typography.medium,
    color: colors.deepBlue,
  },
  friendSubtext: {
    fontSize: typography.sm,
    color: colors.softGray,
    marginTop: 2,
  },
  friendActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  actionBtn: {
    padding: spacing.sm,
    borderRadius: borderRadius.sm,
  },
  activateBtn: {
    backgroundColor: colors.lightGray,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingTop: spacing.xxl,
  },
  emptyText: {
    fontSize: typography.base,
    color: colors.softGray,
    marginTop: spacing.md,
  },
});
