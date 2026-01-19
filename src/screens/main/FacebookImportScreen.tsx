import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  ScrollView,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import { colors, spacing, borderRadius, typography, shadows } from '../../lib/theme';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';
import { FacebookFriendData, CONSTANTS } from '../../types';

interface ParsedFriend {
  name: string;
  timestamp?: number;
}

export default function FacebookImportScreen({ navigation }: any) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  // Parse Facebook friends JSON - handles multiple possible structures
  const parseFacebookFriends = (jsonData: any): ParsedFriend[] => {
    try {
      const friends: ParsedFriend[] = [];

      // Facebook export structure varies:
      // - friends_v2: newer format
      // - friends: older format  
      // - Could also be direct array
      let friendsList = jsonData.friends_v2 || jsonData.friends || jsonData;

      // Sometimes it's nested in a "friends" property
      if (friendsList.friends) {
        friendsList = friendsList.friends;
      }

      if (Array.isArray(friendsList)) {
        for (const friend of friendsList) {
          if (friend.name) {
            friends.push({
              name: friend.name,
              timestamp: friend.timestamp,
            });
          }
        }
      }

      return friends;
    } catch (error) {
      console.error('Error parsing Facebook friends:', error);
      return [];
    }
  };

  const handlePickFile = async () => {
    try {
      setLoading(true);

      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/json', 'application/zip'],
        copyToCacheDirectory: true,
      });

      if (result.canceled) {
        setLoading(false);
        return;
      }

      const file = result.assets[0];
      
      // Read the file
      let jsonData: any;
      
      if (file.name.endsWith('.zip')) {
        // TODO: Handle ZIP extraction
        // For now, ask user to extract and upload JSON directly
        Alert.alert(
          'Extract ZIP First',
          'Please extract the ZIP file and upload the friends.json file directly.',
          [{ text: 'OK' }]
        );
        setLoading(false);
        return;
      }

      // Read JSON file
      const content = await FileSystem.readAsStringAsync(file.uri);
      jsonData = JSON.parse(content);

      // Parse friends
      const friends = parseFacebookFriends(jsonData);

      if (friends.length === 0) {
        Alert.alert(
          'No Friends Found',
          'Could not find any friends in this file. Make sure you uploaded the correct Facebook export file.',
          [{ text: 'OK' }]
        );
        setLoading(false);
        return;
      }

      // Navigate to SwipeCull to sort friends (gamified!)
      setLoading(false);
      navigation.navigate('SwipeCull', { friends });

    } catch (error) {
      console.error('File pick error:', error);
      Alert.alert(
        'Error Reading File',
        'There was a problem reading the file. Please make sure it\'s a valid JSON file.',
        [{ text: 'OK' }]
      );
      setLoading(false);
    }
  };

  // Demo import with sample data
  const handleDemoImport = () => {
    const sampleFriends = [
      { name: 'Sarah Johnson', timestamp: 1609459200 },
      { name: 'Mike Chen', timestamp: 1612137600 },
      { name: 'Emily Davis', timestamp: 1614556800 },
      { name: 'Alex Thompson', timestamp: 1617235200 },
      { name: 'Jessica Williams', timestamp: 1619827200 },
      { name: 'David Kim', timestamp: 1622505600 },
      { name: 'Rachel Green', timestamp: 1625097600 },
      { name: 'Chris Martinez', timestamp: 1627776000 },
      { name: 'Amanda Lee', timestamp: 1630454400 },
      { name: 'Ryan O\'Connor', timestamp: 1633046400 },
    ];

    navigation.navigate('SwipeCull', { friends: sampleFriends });
  };

  const openTutorial = () => {
    Linking.openURL('https://real-ones.app/import');
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.deepBlue} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Import from Facebook</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.heroCard}>
          <Ionicons name="people" size={48} color={colors.accent} />
          <Text style={styles.heroTitle}>Bring Your Friends Along</Text>
          <Text style={styles.heroText}>
            Import your Facebook friends and swipe to decide who belongs in your circle.
          </Text>
        </View>

        <View style={styles.stepsCard}>
          <Text style={styles.stepsTitle}>Quick Steps:</Text>
          
          <View style={styles.step}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>1</Text>
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Export from Facebook</Text>
              <Text style={styles.stepText}>
                Download your friends list as JSON from Facebook settings
              </Text>
            </View>
          </View>

          <View style={styles.step}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>2</Text>
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Upload the file</Text>
              <Text style={styles.stepText}>
                Select the friends.json file from your download
              </Text>
            </View>
          </View>

          <View style={styles.step}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>3</Text>
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Swipe to sort</Text>
              <Text style={styles.stepText}>
                Swipe right to keep, left to archive — Tinder style!
              </Text>
            </View>
          </View>

          <TouchableOpacity style={styles.tutorialLink} onPress={openTutorial}>
            <Ionicons name="help-circle-outline" size={18} color={colors.accent} />
            <Text style={styles.tutorialLinkText}>View detailed tutorial</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity 
          style={styles.primaryBtn} 
          onPress={handlePickFile}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={colors.warmWhite} />
          ) : (
            <>
              <Ionicons name="document" size={20} color={colors.warmWhite} />
              <Text style={styles.primaryBtnText}>Select friends.json</Text>
            </>
          )}
        </TouchableOpacity>

        {/* Demo button for testing */}
        <TouchableOpacity style={styles.secondaryBtn} onPress={handleDemoImport}>
          <Text style={styles.secondaryBtnText}>Try Demo (10 sample friends)</Text>
        </TouchableOpacity>
      </ScrollView>
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
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  headerTitle: {
    fontSize: typography.lg,
    fontWeight: typography.semibold,
    color: colors.deepBlue,
  },
  content: {
    padding: spacing.md,
    paddingBottom: spacing.xxl,
  },
  heroCard: {
    backgroundColor: colors.warmWhite,
    borderRadius: borderRadius.lg,
    padding: spacing.xl,
    alignItems: 'center',
    marginBottom: spacing.md,
    ...shadows.sm,
  },
  heroTitle: {
    fontSize: typography.xl,
    fontWeight: typography.semibold,
    color: colors.deepBlue,
    marginTop: spacing.md,
    textAlign: 'center',
  },
  heroText: {
    fontSize: typography.base,
    color: colors.softGray,
    textAlign: 'center',
    marginTop: spacing.sm,
    lineHeight: 22,
  },
  stepsCard: {
    backgroundColor: colors.warmWhite,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    ...shadows.sm,
  },
  stepsTitle: {
    fontSize: typography.base,
    fontWeight: typography.semibold,
    color: colors.deepBlue,
    marginBottom: spacing.md,
  },
  step: {
    flexDirection: 'row',
    marginBottom: spacing.md,
  },
  stepNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  stepNumberText: {
    fontSize: typography.sm,
    fontWeight: typography.bold,
    color: colors.warmWhite,
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: typography.base,
    fontWeight: typography.medium,
    color: colors.deepBlue,
    marginBottom: 4,
  },
  stepText: {
    fontSize: typography.sm,
    color: colors.softGray,
    lineHeight: 20,
  },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.accent,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    gap: spacing.sm,
    ...shadows.md,
  },
  primaryBtnText: {
    fontSize: typography.base,
    fontWeight: typography.semibold,
    color: colors.warmWhite,
  },
  secondaryBtn: {
    alignItems: 'center',
    paddingVertical: spacing.md,
    marginTop: spacing.md,
  },
  secondaryBtnText: {
    fontSize: typography.sm,
    color: colors.softGray,
  },
  tutorialLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.lightGray,
  },
  tutorialLinkText: {
    fontSize: typography.sm,
    color: colors.accent,
    fontWeight: typography.medium,
  },
});
