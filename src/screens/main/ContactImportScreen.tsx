import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Animated,
  PanResponder,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Contacts from 'expo-contacts';
import { colors, spacing, borderRadius, typography, shadows } from '../../lib/theme';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.25;

interface Contact {
  id: string;
  name: string;
}

interface ContactImportScreenProps {
  navigation: any;
}

export default function ContactImportScreen({ navigation }: ContactImportScreenProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedContacts, setSelectedContacts] = useState<Contact[]>([]);
  const [skippedCount, setSkippedCount] = useState(0);
  const [saving, setSaving] = useState(false);

  // Animation values
  const position = useRef(new Animated.ValueXY()).current;
  const rotation = position.x.interpolate({
    inputRange: [-SCREEN_WIDTH / 2, 0, SCREEN_WIDTH / 2],
    outputRange: ['-10deg', '0deg', '10deg'],
  });
  const likeOpacity = position.x.interpolate({
    inputRange: [0, SCREEN_WIDTH / 4],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });
  const nopeOpacity = position.x.interpolate({
    inputRange: [-SCREEN_WIDTH / 4, 0],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  useEffect(() => {
    loadContacts();
  }, []);

  const loadContacts = async () => {
    try {
      const { status } = await Contacts.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Please allow access to contacts to import friends.',
          [{ text: 'OK', onPress: () => navigation.goBack() }]
        );
        return;
      }

      const { data } = await Contacts.getContactsAsync({
        fields: [Contacts.Fields.Name],
        sort: Contacts.SortTypes.FirstName,
      });

      // Filter contacts with names and deduplicate
      const validContacts: Contact[] = [];
      const seenNames = new Set<string>();

      data.forEach((contact) => {
        const name = contact.name?.trim();
        if (name && !seenNames.has(name.toLowerCase())) {
          seenNames.add(name.toLowerCase());
          validContacts.push({
            id: contact.id || `contact-${validContacts.length}`,
            name,
          });
        }
      });

      setContacts(validContacts);
    } catch (error) {
      console.error('Error loading contacts:', error);
      Alert.alert('Error', 'Failed to load contacts');
    } finally {
      setLoading(false);
    }
  };

  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onPanResponderMove: (_, gesture) => {
      position.setValue({ x: gesture.dx, y: gesture.dy });
    },
    onPanResponderRelease: (_, gesture) => {
      if (gesture.dx > SWIPE_THRESHOLD) {
        swipeRight();
      } else if (gesture.dx < -SWIPE_THRESHOLD) {
        swipeLeft();
      } else {
        resetPosition();
      }
    },
  });

  const resetPosition = () => {
    Animated.spring(position, {
      toValue: { x: 0, y: 0 },
      useNativeDriver: false,
    }).start();
  };

  const swipeRight = () => {
    const contact = contacts[currentIndex];
    Animated.timing(position, {
      toValue: { x: SCREEN_WIDTH + 100, y: 0 },
      duration: 250,
      useNativeDriver: false,
    }).start(() => {
      setSelectedContacts((prev) => [...prev, contact]);
      nextCard();
    });
  };

  const swipeLeft = () => {
    Animated.timing(position, {
      toValue: { x: -SCREEN_WIDTH - 100, y: 0 },
      duration: 250,
      useNativeDriver: false,
    }).start(() => {
      setSkippedCount((prev) => prev + 1);
      nextCard();
    });
  };

  const nextCard = () => {
    position.setValue({ x: 0, y: 0 });
    setCurrentIndex((prev) => prev + 1);
  };

  const handleSaveSelected = async () => {
    if (selectedContacts.length === 0) {
      Alert.alert('No Friends Selected', 'Swipe right on contacts to add them as friends.');
      return;
    }

    if (!user?.id) {
      Alert.alert('Error', 'You must be logged in');
      return;
    }

    setSaving(true);

    try {
      // Insert all selected contacts as friends
      const friendsToInsert = selectedContacts.map((contact) => ({
        user_id: user.id,
        status: 'active',
        source: 'contacts_import',
        facebook_data: {
          name: contact.name,
        },
        tier: 'realones',
      }));

      const { error } = await supabase.from('friends').insert(friendsToInsert);

      if (error) throw error;

      Alert.alert(
        'Friends Added!',
        `${selectedContacts.length} friends have been added to your circle.`,
        [{ text: 'Done', onPress: () => navigation.goBack() }]
      );
    } catch (error: any) {
      console.error('Error saving friends:', error);
      Alert.alert('Error', error.message || 'Failed to save friends');
    } finally {
      setSaving(false);
    }
  };

  const currentContact = contacts[currentIndex];
  const isFinished = currentIndex >= contacts.length;
  const progress = contacts.length > 0 ? (currentIndex / contacts.length) * 100 : 0;

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.accent} />
          <Text style={styles.loadingText}>Loading contacts...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="close" size={28} color={colors.deepBlue} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Import Contacts</Text>
        <TouchableOpacity onPress={handleSaveSelected} disabled={saving}>
          <Text style={[styles.doneText, saving && styles.doneTextDisabled]}>
            {saving ? 'Saving...' : 'Done'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <View style={[styles.progressBar, { width: `${progress}%` }]} />
      </View>

      {/* Stats */}
      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Ionicons name="checkmark-circle" size={20} color={colors.success} />
          <Text style={styles.statText}>{selectedContacts.length} added</Text>
        </View>
        <View style={styles.statItem}>
          <Ionicons name="close-circle" size={20} color={colors.softGray} />
          <Text style={styles.statText}>{skippedCount} skipped</Text>
        </View>
        <View style={styles.statItem}>
          <Ionicons name="people" size={20} color={colors.accent} />
          <Text style={styles.statText}>{contacts.length - currentIndex} left</Text>
        </View>
      </View>

      {/* Card Area */}
      <View style={styles.cardContainer}>
        {isFinished ? (
          <View style={styles.finishedContainer}>
            <Ionicons name="checkmark-circle" size={64} color={colors.success} />
            <Text style={styles.finishedTitle}>All Done!</Text>
            <Text style={styles.finishedSubtitle}>
              You've reviewed all {contacts.length} contacts
            </Text>
            <Text style={styles.finishedStats}>
              {selectedContacts.length} friends selected
            </Text>
            <TouchableOpacity
              style={styles.saveButton}
              onPress={handleSaveSelected}
              disabled={saving}
            >
              <Text style={styles.saveButtonText}>
                {saving ? 'Saving...' : `Add ${selectedContacts.length} Friends`}
              </Text>
            </TouchableOpacity>
          </View>
        ) : currentContact ? (
          <>
            {/* Next card preview */}
            {contacts[currentIndex + 1] && (
              <View style={[styles.card, styles.nextCard]}>
                <View style={styles.avatarLarge}>
                  <Text style={styles.avatarLargeText}>
                    {contacts[currentIndex + 1].name.charAt(0).toUpperCase()}
                  </Text>
                </View>
                <Text style={styles.cardName}>{contacts[currentIndex + 1].name}</Text>
              </View>
            )}

            {/* Current card */}
            <Animated.View
              style={[
                styles.card,
                {
                  transform: [
                    { translateX: position.x },
                    { translateY: position.y },
                    { rotate: rotation },
                  ],
                },
              ]}
              {...panResponder.panHandlers}
            >
              {/* Like overlay */}
              <Animated.View style={[styles.overlay, styles.likeOverlay, { opacity: likeOpacity }]}>
                <Ionicons name="checkmark-circle" size={80} color={colors.success} />
                <Text style={styles.overlayText}>ADD</Text>
              </Animated.View>

              {/* Nope overlay */}
              <Animated.View style={[styles.overlay, styles.nopeOverlay, { opacity: nopeOpacity }]}>
                <Ionicons name="close-circle" size={80} color={colors.error} />
                <Text style={[styles.overlayText, styles.nopeText]}>SKIP</Text>
              </Animated.View>

              <View style={styles.avatarLarge}>
                <Text style={styles.avatarLargeText}>
                  {currentContact.name.charAt(0).toUpperCase()}
                </Text>
              </View>
              <Text style={styles.cardName}>{currentContact.name}</Text>
            </Animated.View>
          </>
        ) : null}
      </View>

      {/* Instructions */}
      {!isFinished && (
        <View style={styles.instructions}>
          <View style={styles.instructionItem}>
            <Ionicons name="arrow-back" size={24} color={colors.error} />
            <Text style={styles.instructionText}>Swipe left to skip</Text>
          </View>
          <View style={styles.instructionItem}>
            <Ionicons name="arrow-forward" size={24} color={colors.success} />
            <Text style={styles.instructionText}>Swipe right to add</Text>
          </View>
        </View>
      )}

      {/* Action Buttons */}
      {!isFinished && (
        <View style={styles.actionButtons}>
          <TouchableOpacity style={[styles.actionBtn, styles.skipBtn]} onPress={swipeLeft}>
            <Ionicons name="close" size={32} color={colors.error} />
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionBtn, styles.addBtn]} onPress={swipeRight}>
            <Ionicons name="checkmark" size={32} color={colors.success} />
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.babyBlue,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: spacing.md,
    fontSize: typography.base,
    color: colors.softGray,
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
  doneText: {
    fontSize: typography.base,
    fontWeight: typography.semibold,
    color: colors.accent,
  },
  doneTextDisabled: {
    color: colors.softGray,
  },
  progressContainer: {
    height: 4,
    backgroundColor: colors.lightGray,
    marginHorizontal: spacing.lg,
    borderRadius: 2,
  },
  progressBar: {
    height: '100%',
    backgroundColor: colors.accent,
    borderRadius: 2,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  statText: {
    fontSize: typography.sm,
    color: colors.deepBlue,
  },
  cardContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  card: {
    position: 'absolute',
    width: SCREEN_WIDTH - spacing.xl * 2,
    backgroundColor: colors.warmWhite,
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.lg,
  },
  nextCard: {
    transform: [{ scale: 0.95 }],
    opacity: 0.5,
  },
  avatarLarge: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.sky,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  avatarLargeText: {
    fontSize: 48,
    fontWeight: typography.bold,
    color: colors.deepBlue,
  },
  cardName: {
    fontSize: typography['2xl'],
    fontWeight: typography.semibold,
    color: colors.deepBlue,
    textAlign: 'center',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: borderRadius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  likeOverlay: {
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
  },
  nopeOverlay: {
    backgroundColor: 'rgba(244, 67, 54, 0.1)',
  },
  overlayText: {
    fontSize: typography.xl,
    fontWeight: typography.bold,
    color: colors.success,
    marginTop: spacing.sm,
  },
  nopeText: {
    color: colors.error,
  },
  finishedContainer: {
    alignItems: 'center',
    padding: spacing.xl,
  },
  finishedTitle: {
    fontSize: typography['2xl'],
    fontWeight: typography.bold,
    color: colors.deepBlue,
    marginTop: spacing.md,
  },
  finishedSubtitle: {
    fontSize: typography.base,
    color: colors.softGray,
    marginTop: spacing.sm,
  },
  finishedStats: {
    fontSize: typography.lg,
    fontWeight: typography.semibold,
    color: colors.accent,
    marginTop: spacing.md,
  },
  saveButton: {
    backgroundColor: colors.deepBlue,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xxl,
    borderRadius: borderRadius.lg,
    marginTop: spacing.xl,
    ...shadows.md,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: typography.lg,
    fontWeight: typography.semibold,
  },
  instructions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
  },
  instructionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  instructionText: {
    fontSize: typography.sm,
    color: colors.softGray,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.xxl,
    paddingBottom: spacing.xl,
  },
  actionBtn: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.md,
  },
  skipBtn: {
    backgroundColor: colors.warmWhite,
    borderWidth: 2,
    borderColor: colors.error,
  },
  addBtn: {
    backgroundColor: colors.warmWhite,
    borderWidth: 2,
    borderColor: colors.success,
  },
});
