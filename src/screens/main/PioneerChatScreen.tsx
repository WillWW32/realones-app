import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, typography, shadows } from '../../lib/theme';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../lib/supabase';

interface Message {
  id: string;
  user_id: string;
  content: string;
  created_at: string;
  author?: {
    full_name: string;
    avatar_url?: string;
  };
}

interface PioneerMember {
  id: string;
  full_name: string;
  avatar_url?: string;
}

export default function PioneerChatScreen({ navigation }: any) {
  const { user, profile } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [members, setMembers] = useState<PioneerMember[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  // For now, use a simple approach - fetch all users who were invited by this user
  // or who invited this user (mutual pioneer connection)
  const fetchPioneerSquad = useCallback(async () => {
    if (!user?.id) return;

    try {
      setLoading(true);

      // Get users this person invited
      const { data: invitedUsers } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url')
        .eq('invited_by', user.id);

      // Get the person who invited this user
      const { data: inviter } = await supabase
        .from('profiles')
        .select('invited_by')
        .eq('id', user.id)
        .single();

      let inviterProfile = null;
      if (inviter?.invited_by) {
        const { data } = await supabase
          .from('profiles')
          .select('id, full_name, avatar_url')
          .eq('id', inviter.invited_by)
          .single();
        inviterProfile = data;
      }

      const allMembers: PioneerMember[] = [];
      if (invitedUsers) allMembers.push(...invitedUsers);
      if (inviterProfile) allMembers.push(inviterProfile);

      setMembers(allMembers);

      // Fetch messages from pioneer_chat table (we'll create this)
      // For now, just show welcome message
      setMessages([
        {
          id: 'welcome',
          user_id: 'system',
          content: '🏔️ Welcome to your Pioneer Squad! This is your private chat while you build your circles together.',
          created_at: new Date().toISOString(),
        },
      ]);

    } catch (err) {
      console.error('Error fetching pioneer squad:', err);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchPioneerSquad();
  }, [fetchPioneerSquad]);

  const sendMessage = async () => {
    if (!newMessage.trim() || !user?.id) return;

    setSending(true);
    const messageContent = newMessage.trim();
    setNewMessage('');

    // Add message optimistically
    const tempMessage: Message = {
      id: `temp-${Date.now()}`,
      user_id: user.id,
      content: messageContent,
      created_at: new Date().toISOString(),
      author: {
        full_name: profile?.full_name || 'You',
        avatar_url: profile?.avatar_url,
      },
    };

    setMessages(prev => [...prev, tempMessage]);
    setSending(false);

    // Scroll to bottom
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const isSystem = item.user_id === 'system';
    const isMe = item.user_id === user?.id;

    if (isSystem) {
      return (
        <View style={styles.systemMessage}>
          <Text style={styles.systemMessageText}>{item.content}</Text>
        </View>
      );
    }

    return (
      <View style={[styles.messageRow, isMe && styles.messageRowMe]}>
        {!isMe && (
          <View style={styles.messageAvatar}>
            <Text style={styles.messageAvatarText}>
              {item.author?.full_name?.charAt(0) || '?'}
            </Text>
          </View>
        )}
        <View style={[styles.messageBubble, isMe && styles.messageBubbleMe]}>
          {!isMe && (
            <Text style={styles.messageAuthor}>{item.author?.full_name}</Text>
          )}
          <Text style={[styles.messageText, isMe && styles.messageTextMe]}>
            {item.content}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.deepBlue} />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Pioneer Squad</Text>
          <Text style={styles.headerSubtitle}>
            {members.length + 1} {members.length === 0 ? 'member' : 'members'}
          </Text>
        </View>
        <View style={styles.headerBadge}>
          <Text style={styles.headerBadgeText}>🏔️</Text>
        </View>
      </View>

      {/* Members Preview */}
      {members.length > 0 && (
        <View style={styles.membersRow}>
          <View style={styles.memberAvatars}>
            {members.slice(0, 5).map((member, idx) => (
              <View
                key={member.id}
                style={[styles.memberAvatar, { marginLeft: idx > 0 ? -10 : 0 }]}
              >
                <Text style={styles.memberAvatarText}>
                  {member.full_name?.charAt(0) || '?'}
                </Text>
              </View>
            ))}
          </View>
          <Text style={styles.membersText}>
            {members.map(m => m.full_name?.split(' ')[0]).join(', ')} & you
          </Text>
        </View>
      )}

      {/* Messages */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.accent} />
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.messagesContent}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Input */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={90}
      >
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Message your squad..."
            placeholderTextColor={colors.softGray}
            value={newMessage}
            onChangeText={setNewMessage}
            multiline
            maxLength={500}
          />
          <TouchableOpacity
            style={[styles.sendBtn, !newMessage.trim() && styles.sendBtnDisabled]}
            onPress={sendMessage}
            disabled={!newMessage.trim() || sending}
          >
            <Ionicons
              name="send"
              size={20}
              color={newMessage.trim() ? colors.warmWhite : colors.softGray}
            />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
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
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    backgroundColor: colors.warmWhite,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGray,
  },
  backBtn: {
    padding: spacing.xs,
    marginRight: spacing.sm,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: typography.lg,
    fontWeight: typography.semibold,
    color: colors.deepBlue,
  },
  headerSubtitle: {
    fontSize: typography.sm,
    color: colors.softGray,
  },
  headerBadge: {
    fontSize: 24,
  },
  headerBadgeText: {
    fontSize: 24,
  },
  membersRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.warmWhite,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGray,
  },
  memberAvatars: {
    flexDirection: 'row',
    marginRight: spacing.sm,
  },
  memberAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.warmWhite,
  },
  memberAvatarText: {
    fontSize: typography.xs,
    fontWeight: typography.bold,
    color: colors.warmWhite,
  },
  membersText: {
    fontSize: typography.sm,
    color: colors.softGray,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  messagesContent: {
    padding: spacing.md,
    paddingBottom: spacing.xl,
  },
  systemMessage: {
    alignItems: 'center',
    marginVertical: spacing.md,
  },
  systemMessageText: {
    fontSize: typography.sm,
    color: colors.softGray,
    textAlign: 'center',
    backgroundColor: colors.warmWhite,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.lg,
  },
  messageRow: {
    flexDirection: 'row',
    marginBottom: spacing.sm,
    alignItems: 'flex-end',
  },
  messageRowMe: {
    flexDirection: 'row-reverse',
  },
  messageAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.sky,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.xs,
  },
  messageAvatarText: {
    fontSize: typography.sm,
    fontWeight: typography.semibold,
    color: colors.deepBlue,
  },
  messageBubble: {
    maxWidth: '75%',
    backgroundColor: colors.warmWhite,
    borderRadius: borderRadius.lg,
    borderBottomLeftRadius: borderRadius.xs,
    padding: spacing.sm,
    paddingHorizontal: spacing.md,
    ...shadows.sm,
  },
  messageBubbleMe: {
    backgroundColor: colors.accent,
    borderBottomLeftRadius: borderRadius.lg,
    borderBottomRightRadius: borderRadius.xs,
  },
  messageAuthor: {
    fontSize: typography.xs,
    fontWeight: typography.semibold,
    color: colors.accent,
    marginBottom: 2,
  },
  messageText: {
    fontSize: typography.base,
    color: colors.deepBlue,
    lineHeight: 20,
  },
  messageTextMe: {
    color: colors.warmWhite,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: colors.warmWhite,
    padding: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.lightGray,
    gap: spacing.sm,
  },
  input: {
    flex: 1,
    backgroundColor: colors.babyBlue,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: typography.base,
    color: colors.deepBlue,
    maxHeight: 100,
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: {
    backgroundColor: colors.lightGray,
  },
});
