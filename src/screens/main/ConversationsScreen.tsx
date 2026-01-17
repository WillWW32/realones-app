import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, typography, shadows } from '../../lib/theme';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';

type ConversationType = 'dm' | 'besties' | 'squad';

interface Conversation {
  id: string;
  type: ConversationType;
  name: string | null;
  last_message: string | null;
  last_message_at: string | null;
  unread_count: number;
  members: {
    id: string;
    full_name: string;
    avatar_url: string | null;
  }[];
}

const TYPE_CONFIG = {
  dm: { icon: 'person', color: colors.accent, label: 'DM' },
  besties: { icon: 'heart', color: colors.heart, label: 'Besties' },
  squad: { icon: 'people', color: colors.success, label: 'Squad' },
};

export default function ConversationsScreen({ navigation }: any) {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<ConversationType | 'all'>('all');

  useEffect(() => {
    fetchConversations();
    
    // Subscribe to realtime updates
    const channel = supabase
      .channel('conversations')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'messages',
      }, () => {
        fetchConversations();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchConversations = async () => {
    if (!user) return;
    
    try {
      // For now, use mock data - will connect to Supabase later
      const mockConversations: Conversation[] = [
        {
          id: '1',
          type: 'besties',
          name: 'Ride or Dies 💪',
          last_message: 'Who\'s in for dinner Friday?',
          last_message_at: new Date().toISOString(),
          unread_count: 3,
          members: [
            { id: '1', full_name: 'Sarah J', avatar_url: null },
            { id: '2', full_name: 'Mike C', avatar_url: null },
            { id: '3', full_name: 'Emily D', avatar_url: null },
            { id: '4', full_name: 'Alex T', avatar_url: null },
          ],
        },
        {
          id: '2',
          type: 'squad',
          name: 'College Crew 🎓',
          last_message: 'Did anyone catch the game?',
          last_message_at: new Date(Date.now() - 3600000).toISOString(),
          unread_count: 0,
          members: Array(12).fill(null).map((_, i) => ({
            id: String(i),
            full_name: `Friend ${i + 1}`,
            avatar_url: null,
          })),
        },
        {
          id: '3',
          type: 'dm',
          name: null,
          last_message: 'Hey, are you free tomorrow?',
          last_message_at: new Date(Date.now() - 7200000).toISOString(),
          unread_count: 1,
          members: [
            { id: '5', full_name: 'Jessica M', avatar_url: null },
          ],
        },
        {
          id: '4',
          type: 'dm',
          name: null,
          last_message: 'Thanks for the recommendation!',
          last_message_at: new Date(Date.now() - 86400000).toISOString(),
          unread_count: 0,
          members: [
            { id: '6', full_name: 'David K', avatar_url: null },
          ],
        },
      ];
      
      setConversations(mockConversations);
    } catch (error) {
      console.error('Error fetching conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const getConversationName = (conv: Conversation) => {
    if (conv.name) return conv.name;
    if (conv.type === 'dm' && conv.members.length > 0) {
      return conv.members[0].full_name;
    }
    return conv.members.map(m => m.full_name.split(' ')[0]).join(', ');
  };

  const getAvatarDisplay = (conv: Conversation) => {
    const config = TYPE_CONFIG[conv.type];
    
    if (conv.type === 'dm' && conv.members.length > 0) {
      const member = conv.members[0];
      return (
        <View style={[styles.avatar, { backgroundColor: colors.lightGray }]}>
          <Text style={styles.avatarText}>
            {member.full_name.charAt(0).toUpperCase()}
          </Text>
        </View>
      );
    }
    
    return (
      <View style={[styles.avatar, { backgroundColor: config.color + '20' }]}>
        <Ionicons name={config.icon as any} size={24} color={config.color} />
      </View>
    );
  };

  const formatTime = (dateString: string | null) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    if (diff < 60000) return 'now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h`;
    if (diff < 604800000) return `${Math.floor(diff / 86400000)}d`;
    return date.toLocaleDateString();
  };

  const filteredConversations = filter === 'all' 
    ? conversations 
    : conversations.filter(c => c.type === filter);

  const renderConversation = ({ item }: { item: Conversation }) => {
    const config = TYPE_CONFIG[item.type];
    
    return (
      <TouchableOpacity
        style={styles.conversationItem}
        onPress={() => navigation.navigate('Chat', { conversationId: item.id, conversation: item })}
        activeOpacity={0.7}
      >
        {getAvatarDisplay(item)}
        
        <View style={styles.conversationContent}>
          <View style={styles.conversationHeader}>
            <View style={styles.nameRow}>
              <Text style={styles.conversationName} numberOfLines={1}>
                {getConversationName(item)}
              </Text>
              {item.type !== 'dm' && (
                <View style={[styles.typeBadge, { backgroundColor: config.color + '20' }]}>
                  <Text style={[styles.typeBadgeText, { color: config.color }]}>
                    {item.members.length}
                  </Text>
                </View>
              )}
            </View>
            <Text style={styles.timeText}>{formatTime(item.last_message_at)}</Text>
          </View>
          
          <View style={styles.messageRow}>
            <Text style={styles.lastMessage} numberOfLines={1}>
              {item.last_message || 'No messages yet'}
            </Text>
            {item.unread_count > 0 && (
              <View style={styles.unreadBadge}>
                <Text style={styles.unreadText}>{item.unread_count}</Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const FilterButton = ({ type, label }: { type: ConversationType | 'all'; label: string }) => (
    <TouchableOpacity
      style={[styles.filterButton, filter === type && styles.filterButtonActive]}
      onPress={() => setFilter(type)}
    >
      <Text style={[styles.filterButtonText, filter === type && styles.filterButtonTextActive]}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Messages</Text>
        <TouchableOpacity
          style={styles.newButton}
          onPress={() => navigation.navigate('NewConversation')}
        >
          <Ionicons name="create-outline" size={24} color={colors.accent} />
        </TouchableOpacity>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterContainer}>
        <FilterButton type="all" label="All" />
        <FilterButton type="dm" label="DMs" />
        <FilterButton type="besties" label="Besties" />
        <FilterButton type="squad" label="Squad" />
      </View>

      {/* Conversations List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.accent} />
        </View>
      ) : filteredConversations.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="chatbubbles-outline" size={64} color={colors.mediumGray} />
          <Text style={styles.emptyTitle}>No conversations yet</Text>
          <Text style={styles.emptySubtitle}>
            Start a DM or create a group with your REALones
          </Text>
          <TouchableOpacity
            style={styles.startButton}
            onPress={() => navigation.navigate('NewConversation')}
          >
            <Text style={styles.startButtonText}>Start Conversation</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={filteredConversations}
          renderItem={renderConversation}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.warmWhite,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  title: {
    fontSize: typography['2xl'],
    fontWeight: typography.bold,
    color: colors.deepBlue,
  },
  newButton: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.full,
    backgroundColor: colors.babyBlue,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    gap: spacing.sm,
  },
  filterButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    backgroundColor: colors.lightGray,
  },
  filterButtonActive: {
    backgroundColor: colors.accent,
  },
  filterButtonText: {
    fontSize: typography.sm,
    fontWeight: typography.medium,
    color: colors.softGray,
  },
  filterButtonTextActive: {
    color: colors.warmWhite,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    paddingHorizontal: spacing.lg,
  },
  conversationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGray,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: borderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  avatarText: {
    fontSize: typography.xl,
    fontWeight: typography.semibold,
    color: colors.deepBlue,
  },
  conversationContent: {
    flex: 1,
  },
  conversationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: spacing.sm,
  },
  conversationName: {
    fontSize: typography.base,
    fontWeight: typography.semibold,
    color: colors.deepBlue,
    flexShrink: 1,
  },
  typeBadge: {
    marginLeft: spacing.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.full,
  },
  typeBadgeText: {
    fontSize: typography.xs,
    fontWeight: typography.bold,
  },
  timeText: {
    fontSize: typography.xs,
    color: colors.mediumGray,
  },
  messageRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  lastMessage: {
    fontSize: typography.sm,
    color: colors.softGray,
    flex: 1,
    marginRight: spacing.sm,
  },
  unreadBadge: {
    backgroundColor: colors.accent,
    borderRadius: borderRadius.full,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  unreadText: {
    fontSize: typography.xs,
    fontWeight: typography.bold,
    color: colors.warmWhite,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  emptyTitle: {
    fontSize: typography.xl,
    fontWeight: typography.semibold,
    color: colors.deepBlue,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  emptySubtitle: {
    fontSize: typography.base,
    color: colors.softGray,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  startButton: {
    backgroundColor: colors.accent,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
  },
  startButtonText: {
    fontSize: typography.base,
    fontWeight: typography.semibold,
    color: colors.warmWhite,
  },
});
