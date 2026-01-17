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
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, typography, shadows } from '../../lib/theme';
import { useFriends } from '../../hooks/useFriends';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';

export default function BulkMessageScreen({ navigation }: any) {
  const { user } = useAuth();
  const { activeFriends, activeCount } = useFriends();
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSend = async () => {
    if (!content.trim()) {
      Alert.alert('Empty Message', 'Write a message to send to your circle!');
      return;
    }

    Alert.alert(
      'Send to Everyone?',
      `This will send your message to all ${activeCount} friends in your Active Circle.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Send',
          onPress: async () => {
            try {
              setLoading(true);
              
              const { error } = await supabase
                .from('bulk_messages')
                .insert({
                  user_id: user?.id,
                  content: content.trim(),
                  recipient_type: 'all',
                  recipient_count: activeCount,
                });

              if (error) throw error;

              setSent(true);
            } catch (error) {
              Alert.alert('Error', 'Failed to send message. Please try again.');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  if (sent) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.successContainer}>
          <View style={styles.successIcon}>
            <Ionicons name="checkmark-circle" size={80} color={colors.success} />
          </View>
          <Text style={styles.successTitle}>Message Sent!</Text>
          <Text style={styles.successText}>
            Your message has been sent to {activeCount} friends in your Active Circle.
          </Text>
          <TouchableOpacity
            style={styles.doneBtn}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.doneBtnText}>Done</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="close" size={28} color={colors.deepBlue} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Message Everyone</Text>
          <View style={{ width: 28 }} />
        </View>

        <ScrollView style={styles.scrollContent}>
          <View style={styles.infoCard}>
            <Ionicons name="megaphone" size={24} color={colors.accent} />
            <View style={styles.infoText}>
              <Text style={styles.infoTitle}>Bulk Message</Text>
              <Text style={styles.infoDesc}>
                Send a message to all {activeCount} friends in your Active Circle at once.
              </Text>
            </View>
          </View>

          <View style={styles.inputCard}>
            <TextInput
              style={styles.input}
              placeholder="Write your message..."
              placeholderTextColor={colors.softGray}
              multiline
              autoFocus
              value={content}
              onChangeText={setContent}
              maxLength={1000}
            />
            <Text style={styles.charCount}>{content.length}/1000</Text>
          </View>

          <View style={styles.tipsCard}>
            <Text style={styles.tipsTitle}>Tips for great bulk messages:</Text>
            <Text style={styles.tip}>• Share life updates or milestones</Text>
            <Text style={styles.tip}>• Announce events or gatherings</Text>
            <Text style={styles.tip}>• Send holiday greetings</Text>
            <Text style={styles.tip}>• Share important news</Text>
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity
            style={[
              styles.sendBtn,
              (!content.trim() || loading) && styles.sendBtnDisabled,
            ]}
            onPress={handleSend}
            disabled={!content.trim() || loading}
          >
            {loading ? (
              <ActivityIndicator color={colors.warmWhite} />
            ) : (
              <>
                <Ionicons name="send" size={20} color={colors.warmWhite} />
                <Text style={styles.sendBtnText}>
                  Send to {activeCount} Friends
                </Text>
              </>
            )}
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
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGray,
  },
  headerTitle: {
    fontSize: typography.lg,
    fontWeight: typography.semibold,
    color: colors.deepBlue,
  },
  scrollContent: {
    flex: 1,
    padding: spacing.md,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.warmWhite,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    gap: spacing.md,
    ...shadows.sm,
  },
  infoText: {
    flex: 1,
  },
  infoTitle: {
    fontSize: typography.base,
    fontWeight: typography.semibold,
    color: colors.deepBlue,
  },
  infoDesc: {
    fontSize: typography.sm,
    color: colors.softGray,
    marginTop: 2,
  },
  inputCard: {
    backgroundColor: colors.warmWhite,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    minHeight: 200,
    ...shadows.sm,
  },
  input: {
    flex: 1,
    fontSize: typography.base,
    color: colors.deepBlue,
    textAlignVertical: 'top',
    lineHeight: 24,
  },
  charCount: {
    fontSize: typography.sm,
    color: colors.softGray,
    textAlign: 'right',
    marginTop: spacing.sm,
  },
  tipsCard: {
    backgroundColor: colors.lightGray,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
  },
  tipsTitle: {
    fontSize: typography.sm,
    fontWeight: typography.semibold,
    color: colors.deepBlue,
    marginBottom: spacing.sm,
  },
  tip: {
    fontSize: typography.sm,
    color: colors.softGray,
    marginBottom: 4,
  },
  footer: {
    padding: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.lightGray,
  },
  sendBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.accent,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    gap: spacing.sm,
    ...shadows.md,
  },
  sendBtnDisabled: {
    backgroundColor: colors.mediumGray,
  },
  sendBtnText: {
    fontSize: typography.base,
    fontWeight: typography.semibold,
    color: colors.warmWhite,
  },
  successContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  successIcon: {
    marginBottom: spacing.lg,
  },
  successTitle: {
    fontSize: typography['2xl'],
    fontWeight: typography.bold,
    color: colors.deepBlue,
    marginBottom: spacing.sm,
  },
  successText: {
    fontSize: typography.base,
    color: colors.softGray,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  doneBtn: {
    backgroundColor: colors.deepBlue,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xxl,
    borderRadius: borderRadius.lg,
  },
  doneBtnText: {
    fontSize: typography.base,
    fontWeight: typography.semibold,
    color: colors.warmWhite,
  },
});
