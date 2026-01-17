import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  PanResponder,
  Dimensions,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, typography, shadows } from '../../lib/theme';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.25;
const SWIPE_OUT_DURATION = 250;

interface FacebookFriend {
  name: string;
  timestamp?: number;
}

interface SwipeCullScreenProps {
  navigation: any;
  route: {
    params: {
      friends: FacebookFriend[];
    };
  };
}

export default function SwipeCullScreen({ navigation, route }: SwipeCullScreenProps) {
  const { user } = useAuth();
  const [friends, setFriends] = useState<FacebookFriend[]>(route.params?.friends || []);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [keptCount, setKeptCount] = useState(0);
  const [archivedCount, setArchivedCount] = useState(0);
  const [saving, setSaving] = useState(false);

  const position = useRef(new Animated.ValueXY()).current;
  const rotate = position.x.interpolate({
    inputRange: [-SCREEN_WIDTH / 2, 0, SCREEN_WIDTH / 2],
    outputRange: ['-10deg', '0deg', '10deg'],
    extrapolate: 'clamp',
  });

  const keepOpacity = position.x.interpolate({
    inputRange: [0, SCREEN_WIDTH / 4],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  const archiveOpacity = position.x.interpolate({
    inputRange: [-SCREEN_WIDTH / 4, 0],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  const nextCardScale = position.x.interpolate({
    inputRange: [-SCREEN_WIDTH / 2, 0, SCREEN_WIDTH / 2],
    outputRange: [1, 0.9, 1],
    extrapolate: 'clamp',
  });

  const saveFriend = async (friend: FacebookFriend, status: 'active' | 'archived') => {
    if (!user?.id) return;

    try {
      await supabase.from('friends').insert({
        user_id: user.id,
        friend_id: null, // No linked profile yet
        status,
        source: 'facebook_import',
        facebook_data: {
          name: friend.name,
          timestamp: friend.timestamp,
        },
      });
    } catch (err) {
      console.error('Error saving friend:', err);
    }
  };

  const swipeRight = useCallback(async () => {
    const friend = friends[currentIndex];
    await saveFriend(friend, 'active');
    setKeptCount(prev => prev + 1);
    
    Animated.timing(position, {
      toValue: { x: SCREEN_WIDTH + 100, y: 0 },
      duration: SWIPE_OUT_DURATION,
      useNativeDriver: true,
    }).start(() => {
      position.setValue({ x: 0, y: 0 });
      setCurrentIndex(prev => prev + 1);
    });
  }, [currentIndex, friends, position]);

  const swipeLeft = useCallback(async () => {
    const friend = friends[currentIndex];
    await saveFriend(friend, 'archived');
    setArchivedCount(prev => prev + 1);
    
    Animated.timing(position, {
      toValue: { x: -SCREEN_WIDTH - 100, y: 0 },
      duration: SWIPE_OUT_DURATION,
      useNativeDriver: true,
    }).start(() => {
      position.setValue({ x: 0, y: 0 });
      setCurrentIndex(prev => prev + 1);
    });
  }, [currentIndex, friends, position]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderMove: (_, gesture) => {
        position.setValue({ x: gesture.dx, y: gesture.dy * 0.5 });
      },
      onPanResponderRelease: (_, gesture) => {
        if (gesture.dx > SWIPE_THRESHOLD) {
          swipeRight();
        } else if (gesture.dx < -SWIPE_THRESHOLD) {
          swipeLeft();
        } else {
          Animated.spring(position, {
            toValue: { x: 0, y: 0 },
            friction: 5,
            useNativeDriver: true,
          }).start();
        }
      },
    })
  ).current;

  const handleFinish = async () => {
    setSaving(true);
    // Navigate to success screen
    navigation.replace('GotReal', { friendCount: keptCount });
  };

  const currentFriend = friends[currentIndex];
  const nextFriend = friends[currentIndex + 1];
  const isComplete = currentIndex >= friends.length;
  const progress = friends.length > 0 ? (currentIndex / friends.length) * 100 : 0;

  if (isComplete) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.completeContainer}>
          <Text style={styles.completeEmoji}>🎉</Text>
          <Text style={styles.completeTitle}>All Done!</Text>
          <Text style={styles.completeSubtitle}>
            You've sorted through all your Facebook friends.
          </Text>
          
          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Text style={styles.statNumber}>{keptCount}</Text>
              <Text style={styles.statLabel}>REALones</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statNumber}>{archivedCount}</Text>
              <Text style={styles.statLabel}>Archived</Text>
            </View>
          </View>

          <TouchableOpacity 
            style={styles.finishButton}
            onPress={handleFinish}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.finishButtonText}>Continue to REALones</Text>
            )}
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="close" size={28} color={colors.softGray} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Sort Your Friends</Text>
        <View style={{ width: 28 }} />
      </View>

      {/* Progress */}
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${progress}%` }]} />
        </View>
        <Text style={styles.progressText}>
          {currentIndex + 1} of {friends.length}
        </Text>
      </View>

      {/* Stats */}
      <View style={styles.miniStats}>
        <View style={styles.miniStat}>
          <Ionicons name="heart" size={16} color={colors.accent} />
          <Text style={styles.miniStatText}>{keptCount}</Text>
        </View>
        <View style={styles.miniStat}>
          <Ionicons name="archive" size={16} color={colors.softGray} />
          <Text style={styles.miniStatText}>{archivedCount}</Text>
        </View>
      </View>

      {/* Cards */}
      <View style={styles.cardsContainer}>
        {/* Next Card (underneath) */}
        {nextFriend && (
          <Animated.View
            style={[
              styles.card,
              styles.nextCard,
              { transform: [{ scale: nextCardScale }] },
            ]}
          >
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarText}>
                {nextFriend.name.charAt(0).toUpperCase()}
              </Text>
            </View>
            <Text style={styles.friendName}>{nextFriend.name}</Text>
          </Animated.View>
        )}

        {/* Current Card */}
        {currentFriend && (
          <Animated.View
            style={[
              styles.card,
              {
                transform: [
                  { translateX: position.x },
                  { translateY: position.y },
                  { rotate },
                ],
              },
            ]}
            {...panResponder.panHandlers}
          >
            {/* Keep overlay */}
            <Animated.View
              style={[styles.overlay, styles.keepOverlay, { opacity: keepOpacity }]}
            >
              <Text style={styles.overlayText}>KEEP ✓</Text>
            </Animated.View>

            {/* Archive overlay */}
            <Animated.View
              style={[styles.overlay, styles.archiveOverlay, { opacity: archiveOpacity }]}
            >
              <Text style={styles.overlayText}>ARCHIVE</Text>
            </Animated.View>

            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarText}>
                {currentFriend.name.charAt(0).toUpperCase()}
              </Text>
            </View>
            <Text style={styles.friendName}>{currentFriend.name}</Text>
            {currentFriend.timestamp && (
              <Text style={styles.friendSince}>
                Friends since {new Date(currentFriend.timestamp * 1000).getFullYear()}
              </Text>
            )}
          </Animated.View>
        )}
      </View>

      {/* Instructions */}
      <View style={styles.instructions}>
        <View style={styles.instructionItem}>
          <Ionicons name="arrow-back" size={24} color={colors.softGray} />
          <Text style={styles.instructionText}>Archive</Text>
        </View>
        <View style={styles.instructionItem}>
          <Ionicons name="arrow-forward" size={24} color={colors.accent} />
          <Text style={[styles.instructionText, { color: colors.accent }]}>Keep</Text>
        </View>
      </View>

      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        <TouchableOpacity style={styles.archiveButton} onPress={swipeLeft}>
          <Ionicons name="close" size={32} color={colors.softGray} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.keepButton} onPress={swipeRight}>
          <Ionicons name="heart" size={32} color="#fff" />
        </TouchableOpacity>
      </View>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  headerTitle: {
    fontSize: typography.lg,
    fontWeight: typography.semibold,
    color: colors.deepBlue,
  },
  progressContainer: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.sm,
  },
  progressBar: {
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.5)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.accent,
    borderRadius: 3,
  },
  progressText: {
    fontSize: typography.sm,
    color: colors.softGray,
    textAlign: 'center',
    marginTop: spacing.xs,
  },
  miniStats: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.xl,
    marginBottom: spacing.md,
  },
  miniStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  miniStatText: {
    fontSize: typography.base,
    fontWeight: typography.semibold,
    color: colors.deepBlue,
  },
  cardsContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  card: {
    position: 'absolute',
    width: SCREEN_WIDTH - 48,
    height: 400,
    backgroundColor: colors.warmWhite,
    borderRadius: borderRadius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.lg,
  },
  nextCard: {
    top: 10,
  },
  overlay: {
    position: 'absolute',
    top: 20,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 3,
  },
  keepOverlay: {
    right: 20,
    borderColor: colors.accent,
    transform: [{ rotate: '15deg' }],
  },
  archiveOverlay: {
    left: 20,
    borderColor: colors.softGray,
    transform: [{ rotate: '-15deg' }],
  },
  overlayText: {
    fontSize: typography.lg,
    fontWeight: typography.bold,
    color: colors.deepBlue,
  },
  avatarPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.sky,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  avatarText: {
    fontSize: 48,
    fontWeight: typography.bold,
    color: colors.deepBlue,
  },
  friendName: {
    fontSize: typography['2xl'],
    fontWeight: typography.semibold,
    color: colors.deepBlue,
    textAlign: 'center',
    paddingHorizontal: spacing.lg,
  },
  friendSince: {
    fontSize: typography.base,
    color: colors.softGray,
    marginTop: spacing.sm,
  },
  instructions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xxl,
    marginBottom: spacing.lg,
  },
  instructionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  instructionText: {
    fontSize: typography.base,
    color: colors.softGray,
    fontWeight: typography.medium,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.xxl,
    paddingBottom: spacing.xl,
  },
  archiveButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.warmWhite,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.md,
  },
  keepButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.md,
  },
  // Complete screen styles
  completeContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  completeEmoji: {
    fontSize: 72,
    marginBottom: spacing.lg,
  },
  completeTitle: {
    fontSize: typography['3xl'],
    fontWeight: typography.bold,
    color: colors.deepBlue,
    marginBottom: spacing.sm,
  },
  completeSubtitle: {
    fontSize: typography.lg,
    color: colors.softGray,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.xl,
    marginBottom: spacing.xxl,
  },
  statBox: {
    backgroundColor: colors.warmWhite,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    alignItems: 'center',
    minWidth: 100,
    ...shadows.sm,
  },
  statNumber: {
    fontSize: 36,
    fontWeight: typography.bold,
    color: colors.accent,
  },
  statLabel: {
    fontSize: typography.sm,
    color: colors.softGray,
    marginTop: spacing.xs,
  },
  finishButton: {
    backgroundColor: colors.deepBlue,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xxl,
    borderRadius: borderRadius.lg,
    ...shadows.md,
  },
  finishButtonText: {
    fontSize: typography.lg,
    fontWeight: typography.semibold,
    color: '#fff',
  },
});
