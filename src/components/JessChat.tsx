// =============================================================================
// JESS CHAT — REALones Embedded Component
// =============================================================================
// Light version of Jess focused on digital declutter & real connection
// Drop into feed, expands on tap
// =============================================================================

import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Animated,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { supabase } from '../lib/supabase';
import { generateJessResponse } from '../lib/jess-ai';

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

interface JessChatProps {
  userId?: string;
  pioneerLevel?: number;      // 1-5
  credits?: number;
  friendsCount?: number;
  startedFresh?: boolean;     // true if they skipped Facebook import
  onClose?: () => void;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

// -----------------------------------------------------------------------------
// Component
// -----------------------------------------------------------------------------

export const JessChat: React.FC<JessChatProps> = ({
  userId = '',
  pioneerLevel = 1,
  credits = 0,
  friendsCount = 0,
  startedFresh = false,
  onClose,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);
  const expandAnim = useRef(new Animated.Value(0)).current;

  // Expand/collapse animation
  useEffect(() => {
    Animated.spring(expandAnim, {
      toValue: isExpanded ? 1 : 0,
      useNativeDriver: false,
      tension: 50,
      friction: 8,
    }).start();
  }, [isExpanded]);

  // Load conversation on mount
  useEffect(() => {
    loadConversation();
  }, [userId]);

  const loadConversation = async () => {
    if (!userId) {
      // No user yet, just show greeting
      const greeting = getGreeting();
      setMessages([{ role: 'assistant', content: greeting, timestamp: new Date() }]);
      return;
    }

    const { data } = await supabase
      .from('jess_conversations')
      .select('messages')
      .eq('user_id', userId)
      .single();

    if (data?.messages) {
      setMessages(data.messages);
    } else {
      // First time — Jess introduces herself
      const greeting = getGreeting();
      setMessages([{ role: 'assistant', content: greeting, timestamp: new Date() }]);
    }
  };

  const getGreeting = (): string => {
    if (startedFresh && friendsCount === 0) {
      return "Starting fresh. I like that. No baggage, no algorithm deciding who matters. Just you, choosing your people. Who's the first real one you want to invite?";
    }
    if (friendsCount === 0) {
      return "Hey. Empty feed feels weird, right? But think about it — no ads, no random acquaintances, no outrage bait. Just... quiet. Ready to invite someone who actually matters?";
    }
    if (pioneerLevel >= 3) {
      return `Pioneer ${pioneerLevel}. You're building something real here. ${friendsCount} people who actually know you. How's it feel compared to the old scroll?`;
    }
    return "Hey. I'm Jess. I'm here to help you build something different — a feed full of people who actually matter. What's on your mind?";
  };

  const saveConversation = async (newMessages: Message[]) => {
    await supabase
      .from('jess_conversations')
      .upsert({
        user_id: userId,
        messages: newMessages,
        updated_at: new Date().toISOString(),
      });
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);

    try {
      const response = await generateJessResponse(newMessages, {
        pioneerLevel,
        credits,
        friendsCount,
        startedFresh,
      });

      const assistantMessage: Message = {
        role: 'assistant',
        content: response,
        timestamp: new Date(),
      };

      const finalMessages = [...newMessages, assistantMessage];
      setMessages(finalMessages);
      await saveConversation(finalMessages);
    } catch (error) {
      console.error('Jess response error:', error);
      const errorMessage: Message = {
        role: 'assistant',
        content: "Sorry, I'm having trouble connecting. Try again in a sec.",
        timestamp: new Date(),
      };
      setMessages([...newMessages, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  // Scroll to bottom on new messages
  useEffect(() => {
    if (scrollViewRef.current && isExpanded) {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages, isExpanded]);

  // Collapsed state — just a bubble
  if (!isExpanded) {
    return (
      <TouchableOpacity 
        style={styles.collapsedBubble} 
        onPress={() => setIsExpanded(true)}
        activeOpacity={0.8}
      >
        <Text style={styles.bubbleEmoji}>💬</Text>
        <View style={styles.bubbleTextContainer}>
          <Text style={styles.bubbleName}>Jess</Text>
          <Text style={styles.bubblePreview} numberOfLines={1}>
            {messages[messages.length - 1]?.content || "Hey, I'm here if you need me"}
          </Text>
        </View>
      </TouchableOpacity>
    );
  }

  // Expanded chat
  const chatHeight = expandAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [60, 400],
  });

  return (
    <Animated.View style={[styles.expandedContainer, { height: chatHeight }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Jess</Text>
        <TouchableOpacity onPress={() => setIsExpanded(false)}>
          <Text style={styles.closeButton}>✕</Text>
        </TouchableOpacity>
      </View>

      {/* Messages */}
      <ScrollView 
        ref={scrollViewRef}
        style={styles.messagesContainer}
        contentContainerStyle={styles.messagesContent}
      >
        {messages.map((msg, index) => (
          <View
            key={index}
            style={[
              styles.messageBubble,
              msg.role === 'user' ? styles.userBubble : styles.jessBubble,
            ]}
          >
            <Text style={[
              styles.messageText,
              msg.role === 'user' ? styles.userText : styles.jessText,
            ]}>
              {msg.content}
            </Text>
          </View>
        ))}
        {isLoading && (
          <View style={[styles.messageBubble, styles.jessBubble]}>
            <ActivityIndicator size="small" color="#666" />
          </View>
        )}
      </ScrollView>

      {/* Input */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            value={input}
            onChangeText={setInput}
            placeholder="Type a message..."
            placeholderTextColor="#999"
            multiline
            maxLength={500}
            onSubmitEditing={handleSend}
          />
          <TouchableOpacity 
            style={[styles.sendButton, !input.trim() && styles.sendButtonDisabled]}
            onPress={handleSend}
            disabled={!input.trim() || isLoading}
          >
            <Text style={styles.sendButtonText}>→</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Animated.View>
  );
};

// -----------------------------------------------------------------------------
// Styles
// -----------------------------------------------------------------------------

const styles = StyleSheet.create({
  // Collapsed bubble
  collapsedBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f8f8',
    borderRadius: 20,
    padding: 12,
    marginHorizontal: 16,
    marginVertical: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  bubbleEmoji: {
    fontSize: 24,
    marginRight: 12,
  },
  bubbleTextContainer: {
    flex: 1,
  },
  bubbleName: {
    fontWeight: '600',
    fontSize: 14,
    color: '#333',
  },
  bubblePreview: {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
  },

  // Expanded container
  expandedContainer: {
    backgroundColor: '#fff',
    borderRadius: 16,
    marginHorizontal: 16,
    marginVertical: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    overflow: 'hidden',
  },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  headerTitle: {
    fontWeight: '600',
    fontSize: 16,
    color: '#333',
  },
  closeButton: {
    fontSize: 18,
    color: '#999',
    padding: 4,
  },

  // Messages
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: 12,
  },
  messageBubble: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 16,
    marginVertical: 4,
  },
  userBubble: {
    alignSelf: 'flex-end',
    backgroundColor: '#007AFF',
    borderBottomRightRadius: 4,
  },
  jessBubble: {
    alignSelf: 'flex-start',
    backgroundColor: '#f0f0f0',
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 20,
  },
  userText: {
    color: '#fff',
  },
  jessText: {
    color: '#333',
  },

  // Input
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  input: {
    flex: 1,
    backgroundColor: '#f8f8f8',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    maxHeight: 100,
    color: '#333',
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  sendButtonDisabled: {
    backgroundColor: '#ccc',
  },
  sendButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
});

export default JessChat;
