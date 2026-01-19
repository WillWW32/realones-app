import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, typography, shadows } from '../../lib/theme';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';

interface AddFriendScreenProps {
  navigation: any;
}

export default function AddFriendScreen({ navigation }: AddFriendScreenProps) {
  const { user } = useAuth();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);

  const formatPhoneNumber = (text: string) => {
    // Remove all non-numeric characters
    const cleaned = text.replace(/\D/g, '');

    // Format as (XXX) XXX-XXXX
    if (cleaned.length <= 3) {
      return cleaned;
    } else if (cleaned.length <= 6) {
      return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3)}`;
    } else {
      return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6, 10)}`;
    }
  };

  const handlePhoneChange = (text: string) => {
    setPhone(formatPhoneNumber(text));
  };

  const handleAddFriend = async () => {
    if (!name.trim()) {
      Alert.alert('Name Required', 'Please enter your friend\'s name');
      return;
    }

    if (!user?.id) {
      Alert.alert('Error', 'You must be logged in to add friends');
      return;
    }

    setLoading(true);

    try {
      // Clean phone number for storage
      const cleanPhone = phone.replace(/\D/g, '');

      // Create a friend entry with manual source
      const { error } = await supabase
        .from('friends')
        .insert({
          user_id: user.id,
          status: 'active',
          source: 'manual',
          facebook_data: {
            name: name.trim(),
            phone: cleanPhone || null,
          },
          tier: 'realones', // Default tier
        });

      if (error) throw error;

      Alert.alert(
        'Friend Added!',
        `${name.trim()} has been added to your circle.`,
        [
          {
            text: 'Add Another',
            onPress: () => {
              setName('');
              setPhone('');
            },
          },
          {
            text: 'Done',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (error: any) {
      console.error('Error adding friend:', error);
      Alert.alert('Error', error.message || 'Failed to add friend');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="close" size={28} color={colors.deepBlue} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Add Friend</Text>
          <View style={{ width: 28 }} />
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Instructions */}
          <View style={styles.instructionCard}>
            <Ionicons name="heart" size={24} color={colors.accent} />
            <Text style={styles.instructionText}>
              Add friends manually to your circle. They'll appear in your active friends list.
            </Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Name *</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter friend's name"
                placeholderTextColor={colors.softGray}
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
                autoFocus
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Phone (optional)</Text>
              <TextInput
                style={styles.input}
                placeholder="(555) 123-4567"
                placeholderTextColor={colors.softGray}
                value={phone}
                onChangeText={handlePhoneChange}
                keyboardType="phone-pad"
                maxLength={14}
              />
              <Text style={styles.helperText}>
                Phone number helps you find them later
              </Text>
            </View>
          </View>

          {/* Import Option */}
          <TouchableOpacity
            style={styles.importOption}
            onPress={() => navigation.navigate('ContactImport')}
          >
            <View style={styles.importIconContainer}>
              <Ionicons name="people" size={24} color={colors.accent} />
            </View>
            <View style={styles.importTextContainer}>
              <Text style={styles.importTitle}>Import from Contacts</Text>
              <Text style={styles.importSubtitle}>
                Quickly add multiple friends at once
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.softGray} />
          </TouchableOpacity>
        </ScrollView>

        {/* Bottom Button */}
        <View style={styles.bottomContainer}>
          <TouchableOpacity
            style={[styles.addButton, (!name.trim() || loading) && styles.addButtonDisabled]}
            onPress={handleAddFriend}
            disabled={!name.trim() || loading}
          >
            <Ionicons name="person-add" size={20} color="#fff" />
            <Text style={styles.addButtonText}>
              {loading ? 'Adding...' : 'Add Friend'}
            </Text>
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
  keyboardView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  headerTitle: {
    fontSize: typography.xl,
    fontWeight: typography.semibold,
    color: colors.deepBlue,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
  },
  instructionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.warmWhite,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.xl,
    gap: spacing.md,
    ...shadows.sm,
  },
  instructionText: {
    flex: 1,
    fontSize: typography.base,
    color: colors.deepBlue,
    lineHeight: 22,
  },
  form: {
    gap: spacing.lg,
    marginBottom: spacing.xl,
  },
  inputGroup: {
    gap: spacing.xs,
  },
  label: {
    fontSize: typography.sm,
    fontWeight: typography.medium,
    color: colors.deepBlue,
    marginLeft: spacing.xs,
  },
  input: {
    backgroundColor: colors.warmWhite,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    fontSize: typography.base,
    color: colors.deepBlue,
    ...shadows.sm,
  },
  helperText: {
    fontSize: typography.xs,
    color: colors.softGray,
    marginLeft: spacing.xs,
    marginTop: spacing.xs,
  },
  importOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.warmWhite,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    gap: spacing.md,
    ...shadows.sm,
  },
  importIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.sky,
    alignItems: 'center',
    justifyContent: 'center',
  },
  importTextContainer: {
    flex: 1,
  },
  importTitle: {
    fontSize: typography.base,
    fontWeight: typography.medium,
    color: colors.deepBlue,
  },
  importSubtitle: {
    fontSize: typography.sm,
    color: colors.softGray,
    marginTop: 2,
  },
  bottomContainer: {
    padding: spacing.lg,
    paddingBottom: spacing.xl,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.deepBlue,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    gap: spacing.sm,
    ...shadows.md,
  },
  addButtonDisabled: {
    backgroundColor: colors.softGray,
  },
  addButtonText: {
    color: '#fff',
    fontSize: typography.lg,
    fontWeight: typography.semibold,
  },
});
