import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, typography } from '../../lib/theme';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';

type ConversationType = 'dm' | 'besties' | 'squad';

interface Friend {
  id: string;
  full_name: string;
  avatar_url: string | null;
}

const TYPE_CONFIG = {
  dm: { 
    icon: 'person', 
    color: colors.accent, 
    label: 'Direct Message',
    description: 'Private 1:1 conversation',
    min: 1, 
    max: 1,
  },
  besties: { 
    icon: 'heart', 
    color: colors.heart, 
    label: 'Besties',
    description: 'Your 4 closest people',
    min: 4, 
    max: 4,
  },
  squad: { 
    icon: 'people', 
    color: colors.success, 
    label: 'Squad',
    description: 'Your inner circle of 12',
    min: 2, 
    max: 12,
  },
};

export default function NewConversationScreen({ navigation }: any) {
  const { user } = useAuth();
  const [step, setStep] = useState<'type' | 'members' | 'name'>('type');
  const [conversationType, setConversationType] = useState<ConversationType | null>(null);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [selectedFriends, setSelectedFriends] = useState<Friend[]>([]);
  const [groupName, setGroupName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (step === 'members') {
      fetchFriends();
    }
  }, [step]);

  const fetchFriends = async () => {
    if (!user) return;
    setLoading(true);
    try {
      // Fetch real friends from Supabase
      const { data, error } = await supabase
        .from('friends')
        .select(`
          friend:profiles!friends_friend_id_fkey(id, full_name, avatar_url)
        `)
        .eq('user_id', user.id)
        .eq('status', 'accepted');

      if (error) {
        console.error('Error fetching friends:', error);
        setFriends([]);
        return;
      }

      const friendsList: Friend[] = (data || [])
        .map((item: any) => item.friend)
        .filter(Boolean);

      setFriends(friendsList);
    } catch (error) {
      console.error('Error fetching friends:', error);
      setFriends([]);
    } finally {
      setLoading(false);
    }
  };

  const toggleFriend = (friend: Friend) => {
    if (!conversationType) return;
    
    const config = TYPE_CONFIG[conversationType];
    const isSelected = selectedFriends.some(f => f.id === friend.id);
    
    if (isSelected) {
      setSelectedFriends(prev => prev.filter(f => f.id !== friend.id));
    } else {
      if (selectedFriends.length >= config.max) {
        Alert.alert(
          'Maximum Reached',
          `${config.label} can have at most ${config.max} ${config.max === 1 ? 'person' : 'people'}.`
        );
        return;
      }
      setSelectedFriends(prev => [...prev, friend]);
    }
  };

  const canProceed = () => {
    if (!conversationType) return false;
    const config = TYPE_CONFIG[conversationType];
    return selectedFriends.length >= config.min && selectedFriends.length <= config.max;
  };

  const handleNext = () => {
    if (step === 'type' && conversationType) {
      setStep('members');
    } else if (step === 'members' && canProceed()) {
      if (conversationType === 'dm') {
        createConversation();
      } else {
        setStep('name');
      }
    } else if (step === 'name') {
      createConversation();
    }
  };

  const createConversation = async () => {
    if (!conversationType || !user) return;

    setCreating(true);
    try {
      // For DMs, check if conversation already exists
      if (conversationType === 'dm' && selectedFriends.length === 1) {
        const friendId = selectedFriends[0].id;

        // Check for existing DM between these two users
        const { data: existingConvos } = await supabase
          .from('conversation_members')
          .select('conversation_id')
          .eq('user_id', user.id);

        if (existingConvos && existingConvos.length > 0) {
          for (const ec of existingConvos) {
            // Check if friend is also in this conversation
            const { data: friendInConvo } = await supabase
              .from('conversation_members')
              .select('conversation_id')
              .eq('conversation_id', ec.conversation_id)
              .eq('user_id', friendId);

            if (friendInConvo && friendInConvo.length > 0) {
              // Check if it's a DM (only 2 members)
              const { data: convoData } = await supabase
                .from('conversations')
                .select('id, type, name')
                .eq('id', ec.conversation_id)
                .eq('type', 'dm')
                .single();

              if (convoData) {
                // Existing DM found, navigate to it
                navigation.replace('Chat', {
                  conversationId: convoData.id,
                  conversation: {
                    id: convoData.id,
                    type: 'dm',
                    name: null,
                    members: selectedFriends,
                    last_message: null,
                    last_message_at: null,
                    unread_count: 0,
                  },
                });
                return;
              }
            }
          }
        }
      }

      // Create new conversation
      const { data: newConvo, error: convoError } = await supabase
        .from('conversations')
        .insert({
          type: conversationType,
          name: groupName || null,
          created_by: user.id,
        })
        .select()
        .single();

      if (convoError) throw convoError;

      // Add current user as member
      await supabase.from('conversation_members').insert({
        conversation_id: newConvo.id,
        user_id: user.id,
      });

      // Add selected friends as members
      const memberInserts = selectedFriends.map(friend => ({
        conversation_id: newConvo.id,
        user_id: friend.id,
      }));

      const { error: membersError } = await supabase
        .from('conversation_members')
        .insert(memberInserts);

      if (membersError) throw membersError;

      // Navigate to the new chat
      navigation.replace('Chat', {
        conversationId: newConvo.id,
        conversation: {
          id: newConvo.id,
          type: conversationType,
          name: groupName || null,
          members: selectedFriends,
          last_message: null,
          last_message_at: null,
          unread_count: 0,
        },
      });

    } catch (error) {
      console.error('Error creating conversation:', error);
      Alert.alert('Error', 'Failed to create conversation. Please try again.');
    } finally {
      setCreating(false);
    }
  };

  const filteredFriends = friends.filter(f => 
    f.full_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderTypeOption = (type: ConversationType) => {
    const config = TYPE_CONFIG[type];
    const isSelected = conversationType === type;
    
    return (
      <TouchableOpacity
        style={[styles.typeOption, isSelected && styles.typeOptionSelected]}
        onPress={() => setConversationType(type)}
      >
        <View style={[styles.typeIcon, { backgroundColor: config.color + '20' }]}>
          <Ionicons name={config.icon as any} size={32} color={config.color} />
        </View>
        <View style={styles.typeContent}>
          <Text style={styles.typeLabel}>{config.label}</Text>
          <Text style={styles.typeDescription}>{config.description}</Text>
        </View>
        <View style={[
          styles.typeRadio,
          isSelected && { borderColor: config.color, backgroundColor: config.color },
        ]}>
          {isSelected && <Ionicons name="checkmark" size={16} color={colors.warmWhite} />}
        </View>
      </TouchableOpacity>
    );
  };

  const renderFriend = ({ item }: { item: Friend }) => {
    const isSelected = selectedFriends.some(f => f.id === item.id);
    
    return (
      <TouchableOpacity
        style={styles.friendItem}
        onPress={() => toggleFriend(item)}
      >
        <View style={[styles.friendAvatar, isSelected && styles.friendAvatarSelected]}>
          <Text style={styles.friendAvatarText}>
            {item.full_name.charAt(0).toUpperCase()}
          </Text>
          {isSelected && (
            <View style={styles.checkBadge}>
              <Ionicons name="checkmark" size={12} color={colors.warmWhite} />
            </View>
          )}
        </View>
        <Text style={styles.friendName}>{item.full_name}</Text>
      </TouchableOpacity>
    );
  };

  const renderStep = () => {
    switch (step) {
      case 'type':
        return (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>What kind of conversation?</Text>
            <View style={styles.typeOptions}>
              {renderTypeOption('dm')}
              {renderTypeOption('besties')}
              {renderTypeOption('squad')}
            </View>
          </View>
        );
        
      case 'members':
        const config = conversationType ? TYPE_CONFIG[conversationType] : null;
        return (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>
              {conversationType === 'dm' ? 'Who do you want to message?' : 'Select members'}
            </Text>
            {config && conversationType !== 'dm' && (
              <Text style={styles.selectionCount}>
                {selectedFriends.length} / {config.max} selected
                {selectedFriends.length < config.min && ` (min ${config.min})`}
              </Text>
            )}
            
            <View style={styles.searchContainer}>
              <Ionicons name="search" size={20} color={colors.mediumGray} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search friends..."
                placeholderTextColor={colors.mediumGray}
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </View>
            
            {loading ? (
              <ActivityIndicator size="large" color={colors.accent} style={styles.loader} />
            ) : (
              <FlatList
                data={filteredFriends}
                renderItem={renderFriend}
                keyExtractor={item => item.id}
                numColumns={4}
                contentContainerStyle={styles.friendsList}
                showsVerticalScrollIndicator={false}
              />
            )}
          </View>
        );
        
      case 'name':
        return (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Name your group</Text>
            <Text style={styles.stepSubtitle}>
              Give your {conversationType === 'besties' ? 'Besties' : 'Squad'} a name
            </Text>
            
            <TextInput
              style={styles.nameInput}
              placeholder={conversationType === 'besties' ? 'e.g., Ride or Dies 💪' : 'e.g., College Crew 🎓'}
              placeholderTextColor={colors.mediumGray}
              value={groupName}
              onChangeText={setGroupName}
              maxLength={50}
              autoFocus
            />
            
            <View style={styles.selectedMembers}>
              <Text style={styles.selectedLabel}>Members:</Text>
              <Text style={styles.selectedNames}>
                {selectedFriends.map(f => f.full_name.split(' ')[0]).join(', ')}
              </Text>
            </View>
          </View>
        );
    }
  };

  const getNextButtonText = () => {
    if (step === 'type') return 'Continue';
    if (step === 'members') {
      if (conversationType === 'dm') return 'Start Chat';
      return 'Next';
    }
    return 'Create Group';
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => {
            if (step === 'type') {
              navigation.goBack();
            } else if (step === 'members') {
              setStep('type');
              setSelectedFriends([]);
            } else {
              setStep('members');
            }
          }}
        >
          <Ionicons name="chevron-back" size={24} color={colors.deepBlue} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>New Conversation</Text>
        <View style={styles.backButton} />
      </View>

      {/* Step Content */}
      {renderStep()}

      {/* Bottom Button */}
      <View style={styles.bottomContainer}>
        <TouchableOpacity
          style={[
            styles.nextButton,
            (step === 'type' && !conversationType) && styles.nextButtonDisabled,
            (step === 'members' && !canProceed()) && styles.nextButtonDisabled,
            (step === 'name' && !groupName.trim()) && styles.nextButtonDisabled,
          ]}
          onPress={handleNext}
          disabled={
            creating ||
            (step === 'type' && !conversationType) ||
            (step === 'members' && !canProceed()) ||
            (step === 'name' && !groupName.trim())
          }
        >
          {creating ? (
            <ActivityIndicator color={colors.warmWhite} />
          ) : (
            <Text style={styles.nextButtonText}>{getNextButtonText()}</Text>
          )}
        </TouchableOpacity>
      </View>
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
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGray,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: typography.lg,
    fontWeight: typography.semibold,
    color: colors.deepBlue,
  },
  stepContent: {
    flex: 1,
    padding: spacing.lg,
  },
  stepTitle: {
    fontSize: typography.xl,
    fontWeight: typography.bold,
    color: colors.deepBlue,
    marginBottom: spacing.sm,
  },
  stepSubtitle: {
    fontSize: typography.base,
    color: colors.softGray,
    marginBottom: spacing.lg,
  },
  typeOptions: {
    marginTop: spacing.lg,
    gap: spacing.md,
  },
  typeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    backgroundColor: colors.lightGray,
    borderRadius: borderRadius.lg,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  typeOptionSelected: {
    borderColor: colors.accent,
    backgroundColor: colors.babyBlue,
  },
  typeIcon: {
    width: 60,
    height: 60,
    borderRadius: borderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  typeContent: {
    flex: 1,
  },
  typeLabel: {
    fontSize: typography.lg,
    fontWeight: typography.semibold,
    color: colors.deepBlue,
  },
  typeDescription: {
    fontSize: typography.sm,
    color: colors.softGray,
    marginTop: 2,
  },
  typeRadio: {
    width: 24,
    height: 24,
    borderRadius: borderRadius.full,
    borderWidth: 2,
    borderColor: colors.mediumGray,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectionCount: {
    fontSize: typography.sm,
    color: colors.accent,
    marginBottom: spacing.md,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.lightGray,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
  },
  searchInput: {
    flex: 1,
    fontSize: typography.base,
    color: colors.deepBlue,
    paddingVertical: spacing.md,
    marginLeft: spacing.sm,
  },
  loader: {
    marginTop: spacing.xl,
  },
  friendsList: {
    paddingVertical: spacing.sm,
  },
  friendItem: {
    flex: 1,
    alignItems: 'center',
    padding: spacing.sm,
    maxWidth: '25%',
  },
  friendAvatar: {
    width: 60,
    height: 60,
    borderRadius: borderRadius.full,
    backgroundColor: colors.lightGray,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  friendAvatarSelected: {
    backgroundColor: colors.accent,
  },
  friendAvatarText: {
    fontSize: typography.xl,
    fontWeight: typography.semibold,
    color: colors.deepBlue,
  },
  checkBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 20,
    height: 20,
    borderRadius: borderRadius.full,
    backgroundColor: colors.success,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.warmWhite,
  },
  friendName: {
    fontSize: typography.xs,
    color: colors.deepBlue,
    textAlign: 'center',
  },
  nameInput: {
    fontSize: typography.lg,
    color: colors.deepBlue,
    backgroundColor: colors.lightGray,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  selectedMembers: {
    backgroundColor: colors.lightGray,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
  },
  selectedLabel: {
    fontSize: typography.sm,
    color: colors.softGray,
    marginBottom: spacing.xs,
  },
  selectedNames: {
    fontSize: typography.base,
    color: colors.deepBlue,
  },
  bottomContainer: {
    padding: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.lightGray,
  },
  nextButton: {
    backgroundColor: colors.accent,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
  },
  nextButtonDisabled: {
    backgroundColor: colors.mediumGray,
  },
  nextButtonText: {
    fontSize: typography.base,
    fontWeight: typography.semibold,
    color: colors.warmWhite,
  },
});
