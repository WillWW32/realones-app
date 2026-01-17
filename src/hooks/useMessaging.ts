import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';

export type ConversationType = 'dm' | 'besties' | 'squad';

export interface ConversationMember {
  id: string;
  full_name: string;
  avatar_url: string | null;
}

export interface Conversation {
  id: string;
  type: ConversationType;
  name: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
  members: ConversationMember[];
  last_message?: string;
  last_message_at?: string;
  unread_count: number;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  sender_name: string;
  content: string;
  created_at: string;
  is_mine: boolean;
}

export function useMessaging() {
  const { user, profile } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch all conversations for the current user
  const fetchConversations = useCallback(async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      
      // Get conversations where user is a member
      const { data: memberData, error: memberError } = await supabase
        .from('conversation_members')
        .select('conversation_id')
        .eq('user_id', user.id);

      if (memberError) throw memberError;
      
      const conversationIds = memberData?.map(m => m.conversation_id) || [];
      
      if (conversationIds.length === 0) {
        setConversations([]);
        return;
      }

      // Get conversation details
      const { data: convData, error: convError } = await supabase
        .from('conversations')
        .select('*')
        .in('id', conversationIds)
        .order('updated_at', { ascending: false });

      if (convError) throw convError;

      // Get members for each conversation
      const conversationsWithMembers: Conversation[] = await Promise.all(
        (convData || []).map(async (conv) => {
          const { data: members } = await supabase
            .from('conversation_members')
            .select(`
              user_id,
              profiles:user_id (id, full_name, avatar_url)
            `)
            .eq('conversation_id', conv.id)
            .neq('user_id', user.id);

          // Get last message
          const { data: lastMsg } = await supabase
            .from('messages')
            .select('content, created_at')
            .eq('conversation_id', conv.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

          // Get unread count
          const { data: memberInfo } = await supabase
            .from('conversation_members')
            .select('last_read_at')
            .eq('conversation_id', conv.id)
            .eq('user_id', user.id)
            .single();

          const { count: unreadCount } = await supabase
            .from('messages')
            .select('*', { count: 'exact', head: true })
            .eq('conversation_id', conv.id)
            .gt('created_at', memberInfo?.last_read_at || '1970-01-01');

          return {
            ...conv,
            members: members?.map((m: any) => m.profiles).filter(Boolean) || [],
            last_message: lastMsg?.content,
            last_message_at: lastMsg?.created_at,
            unread_count: unreadCount || 0,
          };
        })
      );

      setConversations(conversationsWithMembers);
    } catch (error) {
      console.error('Error fetching conversations:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Create a new conversation
  const createConversation = async (
    type: ConversationType,
    memberIds: string[],
    name?: string
  ): Promise<Conversation | null> => {
    if (!user) return null;

    try {
      // For DMs, check if conversation already exists
      if (type === 'dm' && memberIds.length === 1) {
        const existingConv = conversations.find(
          c => c.type === 'dm' && c.members.some(m => m.id === memberIds[0])
        );
        if (existingConv) return existingConv;
      }

      // Create conversation
      const { data: conv, error: convError } = await supabase
        .from('conversations')
        .insert({
          type,
          name: name || null,
          created_by: user.id,
        })
        .select()
        .single();

      if (convError) throw convError;

      // Add creator as member
      const allMemberIds = [user.id, ...memberIds];
      const memberInserts = allMemberIds.map(userId => ({
        conversation_id: conv.id,
        user_id: userId,
      }));

      const { error: membersError } = await supabase
        .from('conversation_members')
        .insert(memberInserts);

      if (membersError) throw membersError;

      // Refresh conversations
      await fetchConversations();

      return conv;
    } catch (error) {
      console.error('Error creating conversation:', error);
      return null;
    }
  };

  // Send a message
  const sendMessage = async (conversationId: string, content: string): Promise<Message | null> => {
    if (!user || !profile) return null;

    try {
      const { data, error } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          sender_id: user.id,
          content,
        })
        .select()
        .single();

      if (error) throw error;

      // Update last read
      await supabase
        .from('conversation_members')
        .update({ last_read_at: new Date().toISOString() })
        .eq('conversation_id', conversationId)
        .eq('user_id', user.id);

      return {
        ...data,
        sender_name: profile.full_name || 'You',
        is_mine: true,
      };
    } catch (error) {
      console.error('Error sending message:', error);
      return null;
    }
  };

  // Fetch messages for a conversation
  const fetchMessages = async (conversationId: string): Promise<Message[]> => {
    if (!user) return [];

    try {
      const { data, error } = await supabase
        .from('messages')
        .select(`
          *,
          profiles:sender_id (full_name)
        `)
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Mark as read
      await supabase
        .from('conversation_members')
        .update({ last_read_at: new Date().toISOString() })
        .eq('conversation_id', conversationId)
        .eq('user_id', user.id);

      return (data || []).map((msg: any) => ({
        id: msg.id,
        conversation_id: msg.conversation_id,
        sender_id: msg.sender_id,
        sender_name: msg.profiles?.full_name || 'Unknown',
        content: msg.content,
        created_at: msg.created_at,
        is_mine: msg.sender_id === user.id,
      }));
    } catch (error) {
      console.error('Error fetching messages:', error);
      return [];
    }
  };

  // Subscribe to new messages in a conversation
  const subscribeToMessages = (
    conversationId: string,
    onMessage: (message: Message) => void
  ) => {
    const channel = supabase
      .channel(`messages:${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        async (payload) => {
          const newMsg = payload.new as any;
          
          // Get sender info
          const { data: senderProfile } = await supabase
            .from('profiles')
            .select('full_name')
            .eq('id', newMsg.sender_id)
            .single();

          onMessage({
            id: newMsg.id,
            conversation_id: newMsg.conversation_id,
            sender_id: newMsg.sender_id,
            sender_name: senderProfile?.full_name || 'Unknown',
            content: newMsg.content,
            created_at: newMsg.created_at,
            is_mine: newMsg.sender_id === user?.id,
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  return {
    conversations,
    loading,
    fetchConversations,
    createConversation,
    sendMessage,
    fetchMessages,
    subscribeToMessages,
  };
}
