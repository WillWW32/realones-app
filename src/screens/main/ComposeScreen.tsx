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
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, typography, shadows } from '../../lib/theme';
import { usePosts } from '../../hooks/usePosts';
import { useAuth } from '../../hooks/useAuth';

export default function ComposeScreen({ navigation }: any) {
  const { profile } = useAuth();
  const { createPost } = usePosts();
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);

  const handlePost = async () => {
    if (!content.trim()) {
      Alert.alert('Empty Post', 'Write something to share with your circle!');
      return;
    }

    try {
      setLoading(true);
      await createPost(content.trim());
      navigation.goBack();
    } catch (error) {
      Alert.alert('Error', 'Failed to create post. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const canPost = content.trim().length > 0;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>New Post</Text>
          <TouchableOpacity
            style={[styles.postButton, !canPost && styles.postButtonDisabled]}
            onPress={handlePost}
            disabled={!canPost || loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color={colors.warmWhite} />
            ) : (
              <Text style={[styles.postButtonText, !canPost && styles.postButtonTextDisabled]}>
                Post
              </Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Compose Area */}
        <View style={styles.composeArea}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {profile?.full_name?.charAt(0) || '?'}
              </Text>
            </View>
          </View>

          <TextInput
            style={styles.input}
            placeholder="What's on your mind?"
            placeholderTextColor={colors.softGray}
            multiline
            autoFocus
            value={content}
            onChangeText={setContent}
            maxLength={2000}
          />
        </View>

        {/* Character count */}
        <View style={styles.footer}>
          <Text style={styles.charCount}>{content.length}/2000</Text>
        </View>

        {/* Action buttons */}
        <View style={styles.actions}>
          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="image-outline" size={24} color={colors.accent} />
            <Text style={styles.actionText}>Photo</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="location-outline" size={24} color={colors.accent} />
            <Text style={styles.actionText}>Check In</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="stats-chart-outline" size={24} color={colors.accent} />
            <Text style={styles.actionText}>Poll</Text>
          </TouchableOpacity>
        </View>

        {/* Visibility indicator */}
        <View style={styles.visibilityBar}>
          <Ionicons name="people" size={18} color={colors.softGray} />
          <Text style={styles.visibilityText}>
            Visible to your Active Circle only
          </Text>
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
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGray,
  },
  cancelText: {
    fontSize: typography.base,
    color: colors.softGray,
  },
  headerTitle: {
    fontSize: typography.lg,
    fontWeight: typography.semibold,
    color: colors.deepBlue,
  },
  postButton: {
    backgroundColor: colors.accent,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.full,
    minWidth: 60,
    alignItems: 'center',
  },
  postButtonDisabled: {
    backgroundColor: colors.lightGray,
  },
  postButtonText: {
    fontSize: typography.base,
    fontWeight: typography.semibold,
    color: colors.warmWhite,
  },
  postButtonTextDisabled: {
    color: colors.softGray,
  },
  composeArea: {
    flex: 1,
    flexDirection: 'row',
    padding: spacing.md,
  },
  avatarContainer: {
    marginRight: spacing.md,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.sky,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: typography.lg,
    fontWeight: typography.semibold,
    color: colors.deepBlue,
  },
  input: {
    flex: 1,
    fontSize: typography.lg,
    color: colors.deepBlue,
    textAlignVertical: 'top',
    lineHeight: 26,
  },
  footer: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  charCount: {
    fontSize: typography.sm,
    color: colors.softGray,
    textAlign: 'right',
  },
  actions: {
    flexDirection: 'row',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    gap: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.lightGray,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  actionText: {
    fontSize: typography.sm,
    color: colors.accent,
    fontWeight: typography.medium,
  },
  visibilityBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    backgroundColor: colors.lightGray,
    gap: spacing.sm,
  },
  visibilityText: {
    fontSize: typography.sm,
    color: colors.softGray,
  },
});
