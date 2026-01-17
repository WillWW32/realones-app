import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Share,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, typography, shadows } from '../../lib/theme';

interface GotRealScreenProps {
  navigation: any;
  route?: {
    params?: {
      friendCount?: number;
    };
  };
}

export default function GotRealScreen({ navigation, route }: GotRealScreenProps) {
  const friendCount = route?.params?.friendCount || 0;

  const shareMessage = `I just got real. 🎯

Ditched the algorithm, kept my real friends. No ads, no noise—just the ${friendCount > 0 ? friendCount : ''} people who actually matter.

Sometimes a step back is a step forward.

#REALones #GotReal`;

  const shareLink = 'https://real-ones.app';

  const handleShare = async (platform?: string) => {
    try {
      if (platform === 'copy') {
        // Copy to clipboard
        const fullMessage = `${shareMessage}\n\n${shareLink}`;
        // Note: In production, use Clipboard API
        await Share.share({ message: fullMessage });
        return;
      }

      const result = await Share.share({
        message: `${shareMessage}\n\n${shareLink}`,
        url: shareLink, // iOS only
        title: 'I just got real',
      });

      if (result.action === Share.sharedAction) {
        // Shared successfully
      }
    } catch (error) {
      console.error('Share error:', error);
    }
  };

  const handleSkip = () => {
    navigation.replace('MainTabs');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Celebration Icon */}
        <View style={styles.iconContainer}>
          <Text style={styles.emoji}>🎯</Text>
        </View>

        {/* Title */}
        <Text style={styles.title}>You just got real.</Text>
        <Text style={styles.subtitle}>Welcome to your circle.</Text>

        {/* Stats Card */}
        {friendCount > 0 && (
          <View style={styles.statsCard}>
            <Text style={styles.statsNumber}>{friendCount}</Text>
            <Text style={styles.statsLabel}>Real Friends</Text>
          </View>
        )}

        {/* Share Message Preview */}
        <View style={styles.previewCard}>
          <Text style={styles.previewText}>
            I just got real. 🎯{'\n\n'}
            Ditched the algorithm, kept my real friends.{'\n\n'}
            <Text style={styles.hashtag}>#REALones #GotReal</Text>
          </Text>
        </View>

        {/* Share Buttons */}
        <View style={styles.shareButtons}>
          <TouchableOpacity
            style={[styles.shareBtn, styles.twitterBtn]}
            onPress={() => handleShare('twitter')}
          >
            <Ionicons name="logo-twitter" size={24} color="#fff" />
            <Text style={styles.shareBtnText}>Share on X</Text>
          </TouchableOpacity>

          <View style={styles.shareRow}>
            <TouchableOpacity
              style={[styles.shareBtn, styles.smallBtn]}
              onPress={() => handleShare('instagram')}
            >
              <Ionicons name="logo-instagram" size={22} color="#fff" />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.shareBtn, styles.smallBtn, styles.messageBtn]}
              onPress={() => handleShare('message')}
            >
              <Ionicons name="chatbubble" size={22} color={colors.deepBlue} />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.shareBtn, styles.smallBtn, styles.copyBtn]}
              onPress={() => handleShare('copy')}
            >
              <Ionicons name="copy-outline" size={22} color={colors.deepBlue} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Skip */}
        <TouchableOpacity style={styles.skipBtn} onPress={handleSkip}>
          <Text style={styles.skipText}>Skip for now</Text>
        </TouchableOpacity>
      </View>

      {/* Decorative */}
      <View style={[styles.circle, styles.circle1]} />
      <View style={[styles.circle, styles.circle2]} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.babyBlue,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconContainer: {
    marginBottom: spacing.lg,
  },
  emoji: {
    fontSize: 72,
  },
  title: {
    fontSize: typography['3xl'],
    fontWeight: typography.bold,
    color: colors.deepBlue,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: typography.lg,
    color: colors.softGray,
    marginTop: spacing.sm,
    marginBottom: spacing.xl,
  },
  statsCard: {
    backgroundColor: colors.warmWhite,
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xxl,
    alignItems: 'center',
    marginBottom: spacing.lg,
    ...shadows.md,
  },
  statsNumber: {
    fontSize: 48,
    fontWeight: typography.bold,
    color: colors.accent,
  },
  statsLabel: {
    fontSize: typography.base,
    color: colors.softGray,
    marginTop: spacing.xs,
  },
  previewCard: {
    backgroundColor: colors.warmWhite,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    width: '100%',
    marginBottom: spacing.lg,
    ...shadows.sm,
  },
  previewText: {
    fontSize: typography.base,
    color: colors.deepBlue,
    lineHeight: 24,
    textAlign: 'center',
  },
  hashtag: {
    color: colors.accent,
    fontWeight: typography.medium,
  },
  shareButtons: {
    width: '100%',
    gap: spacing.md,
  },
  shareBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    gap: spacing.sm,
    ...shadows.sm,
  },
  twitterBtn: {
    backgroundColor: '#000',
    width: '100%',
  },
  shareBtnText: {
    fontSize: typography.base,
    fontWeight: typography.semibold,
    color: '#fff',
  },
  shareRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  smallBtn: {
    flex: 1,
    backgroundColor: '#E1306C', // Instagram pink
  },
  messageBtn: {
    backgroundColor: colors.warmWhite,
  },
  copyBtn: {
    backgroundColor: colors.warmWhite,
  },
  skipBtn: {
    marginTop: spacing.xl,
    padding: spacing.md,
  },
  skipText: {
    fontSize: typography.base,
    color: colors.softGray,
  },
  circle: {
    position: 'absolute',
    borderRadius: 9999,
    backgroundColor: 'rgba(184, 223, 245, 0.4)',
    zIndex: -1,
  },
  circle1: {
    width: 200,
    height: 200,
    top: -50,
    left: -80,
  },
  circle2: {
    width: 150,
    height: 150,
    bottom: 100,
    right: -60,
  },
});
