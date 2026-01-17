import React, { useState, useEffect, useRef } from 'react';
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
import { colors, spacing, borderRadius, typography } from '../../lib/theme';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';

interface Message {
  id: string;
  content: string;
  sender_id: string;
  sender_name: string;
  created_at: string;
  is_mine: boolean;
}

interface ConversationInfo {
  id: string;
  type: 'dm' | 'besties' | 'squad';
  name: string | null;
  members: {
    id: string;
    full_name: string;
    avatar_url: string | null;
  }[];
}

const TYPE_CONFIG = {
  dm: { icon: 'person', color: colors.accent, label: 'DM' },
  besties: { icon: 'heart', color: colors.heart, label: 'Besties (4)' },
  squad: { icon: 'people', color: colors.success, label: 'Squad (12)' },
};

export default function ChatScreen({ route, navigation }: any) {
  const { conversationId, conversation } = route.params;
  const { user, profile } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  const convInfo: ConversationInfo = conversation;
  const config = TYPE_CONFIG[convInfo.type];

  useEffect(() => {
    fetchMessages();
    
    // Subscribe to new messages
    const channel = supabase
      .channel(`chat:${conversationId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `conversation_id=eq.${conversationId}`,
      }, (payload) => {
        const newMessage = payload.new as any;
        setMessages(prev => [...prev, {
          id: newMessage.id,
          content: newMessage.content,
          sender_id: newMessage.sender_id,
          sender_name: newMessage.sender_name || 'Unknown',
          created_at: newMessage.created_at,
          is_mine: newMessage.sender_id === user?.id,
        }]);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId]);

  const fetchMessages = async () => {
    try {
      // Mock messages for now
      const mockMessages: Message[] = [
        {
          id: '1',
          content: 'Hey everyone! 👋',
          sender_id: 'other1',
          sender_name: 'Sarah',
          created_at: new Date(Date.now() - 3600000).toISOString(),
          is_mine: false,
        },
        {
          id: '2',
          content: 'What\'s the plan for this weekend?',
          sender_id: 'other1',
          sender_name: 'Sarah',
          created_at: new Date(Date.now() - 3500000).toISOString(),
          is_mine: false,
        },
        {
          id: '3',
          content: 'I was thinking we could grab dinner Friday night',
          sender_id: user?.id || 'me',
          sender_name: profile?.full_name || 'Me',
          created_at: new Date(Date.now() - 3400000).toISOString(),
          is_mine: true,
        },
        {
          id: '4',
          content: 'That sounds great! Count me in 🙌',
          sender_id: 'other2',
          sender_name: 'Mike',
          created_at: new Date(Date.now() - 3300000).toISOString(),
          is_mine: false,
        },
        {
          id: '5',
          content: 'Same here!',
          sender_id: 'other3',
          sender_name: 'Emily',
          created_at: new Date(Date.now() - 3200000).toISOString(),
          is_mine: false,
        },
        {
          id: '6',
          content: 'Perfect, let\'s do 7pm at the usual spot?',
          sender_id: user?.id || 'me',
          sender_name: profile?.full_name || 'Me',
          created_at: new Date(Date.now() - 3100000).toISOString(),
          is_mine: true,
        },
        {
          id: '7',
          content: 'Works for me! 👍',
          sender_id: 'other1',
          sender_name: 'Sarah',
          created_at: new Date(Date.now() - 60000).toISOString(),
          is_mine: false,
        },
      ];
      
      setMessages(mockMessages);
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!inputText.trim() || sending) return;
    
    const messageText = inputText.trim();
    setInputText('');
    setSending(true);
    
    try {
      // Add message optimistically
      const newMessage: Message = {
        id: Date.now().toString(),
        content: messageText,
        sender_id: user?.id || 'me',
        sender_name: profile?.full_name || 'Me',
        created_at: new Date().toISOString(),
        is_mine: true,
      };
      
      setMessages(prev => [...prev, newMessage]);
      
      // TODO: Send to Supabase
      // await supabase.from('messages').insert({
      //   conversation_id: conversationId,
      //   sender_id: user?.id,
      //   content: messageText,
      // });
      
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setSending(false);
    }
  };

  const getConversationTitle = () => {
    if (convInfo.name) return convInfo.name;
    if (convInfo.type === 'dm' && convInfo.members.length > 0) {
      return convInfo.members[0].full_name;
    }
    return convInfo.members.slice(0, 3).map(m => m.full_name.split(' ')[0]).join(', ') + 
      (convInfo.members.length > 3 ? ` +${convInfo.members.length - 3}` : '');
  };

  const formatMessageTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const shouldShowSender = (message: Message, index: number) => {
    if (convInfo.type === 'dm') return false;
    if (message.is_mine) return false;
    if (index === 0) return true;
    const prevMessage = messages[index - 1];
    return prevMessage.sender_id !== message.sender_id;
  };

  const renderMessage = ({ item, index }: { item: Message; index: number }) => {
    const showSender = shouldShowSender(item, index);
    
    return (
      <View style={[
        styles.messageContainer,
        item.is_mine ? styles.myMessageContainer : styles.otherMessageContainer,
      ]}>
        {showSender && (
          <Text style={styles.senderName}>{item.sender_name}</Text>
        )}
        <View style={[
          styles.messageBubble,
          item.is_mine ? styles.myMessageBubble : styles.otherMessageBubble,
        ]}>
          <Text style={[
            styles.messageText,
            item.is_mine ? styles.myMessageText : styles.otherMessageText,
          ]}>
            {item.content}
          </Text>
          <Text style={[
            styles.messageTime,
            item.is_mine ? styles.myMessageTime : styles.otherMessageTime,
          ]}>
            {formatMessageTime(item.created_at)}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="chevron-back" size={24} color={colors.deepBlue} />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.headerContent}
          onPress={() => navigation.navigate('ConversationInfo', { conversation: convInfo })}
        >
          <View style={[styles.headerIcon, { backgroundColor: config.color + '20' }]}>
            <Ionicons name={config.icon as any} size={20} color={config.color} />
          </View>
          <View style={styles.headerText}>
            <Text style={styles.headerTitle} numberOfLines={1}>
              {getConversationTitle()}
            </Text>
            <Text style={styles.headerSubtitle}>
              {convInfo.type === 'dm' ? 'Direct Message' : `${convInfo.members.length} members`}
            </Text>
          </View>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.menuButton}>
          <Ionicons name="ellipsis-vertical" size={20} color={colors.deepBlue} />
        </TouchableOpacity>
      </View>

      {/* Messages */}
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
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
            contentContainerStyle={styles.messagesList}
            showsVerticalScrollIndicator={false}
            onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
            onLayout={() => flatListRef.current?.scrollToEnd({ animated: false })}
          />
        )}

        {/* Input */}
        <View style={styles.inputContainer}>
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.input}
              placeholder="Message..."
              placeholderTextColor={colors.mediumGray}
              value={inputText}
              onChangeText={setInputText}
              multiline
              maxLength={1000}
            />
            <TouchableOpacity
              style={[
                styles.sendButton,
                (!inputText.trim() || sending) && styles.sendButtonDisabled,
              ]}
              onPress={sendMessage}
              disabled={!inputText.trim() || sending}
            >
              {sending ? (
                <ActivityIndicator size="small" color={colors.warmWhite} />
              ) : (
                <Ionicons name="send" size={20} color={colors.warmWhite} />
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
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
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGray,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerIcon: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  headerText: {
    flex: 1,
  },
  headerTitle: {
    fontSize: typography.base,
    fontWeight: typography.semibold,
    color: colors.deepBlue,
  },
  headerSubtitle: {
    fontSize: typography.xs,
    color: colors.softGray,
  },
  menuButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  keyboardView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  messagesList: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  messageContainer: {
    marginBottom: spacing.sm,
    maxWidth: '80%',
  },
  myMessageContainer: {
    alignSelf: 'flex-end',
  },
  otherMessageContainer: {
    alignSelf: 'flex-start',
  },
  senderName: {
    fontSize: typography.xs,
    color: colors.softGray,
    marginBottom: 4,
    marginLeft: spacing.sm,
  },
  messageBubble: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.lg,
  },
  myMessageBubble: {
    backgroundColor: colors.accent,
    borderBottomRightRadius: 4,
  },
  otherMessageBubble: {
    backgroundColor: colors.lightGray,
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: typography.base,
    lineHeight: 22,
  },
  myMessageText: {
    color: colors.warmWhite,
  },
  otherMessageText: {
    color: colors.deepBlue,
  },
  messageTime: {
    fontSize: typography.xs,
    marginTop: 4,
  },
  myMessageTime: {
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'right',
  },
  otherMessageTime: {
    color: colors.mediumGray,
  },
  inputContainer: {
    padding: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.lightGray,
    backgroundColor: colors.warmWhite,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: colors.lightGray,
    borderRadius: borderRadius.xl,
    paddingLeft: spacing.md,
    paddingRight: 4,
    paddingVertical: 4,
  },
  input: {
    flex: 1,
    fontSize: typography.base,
    color: colors.deepBlue,
    maxHeight: 100,
    paddingVertical: spacing.sm,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.full,
    backgroundColor: colors.accent,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: colors.mediumGray,
  },
});
