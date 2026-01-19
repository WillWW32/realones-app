import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Alert,
  ActivityIndicator,
  Linking,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Contacts from 'expo-contacts';
import * as SMS from 'expo-sms';
import { colors, spacing, borderRadius, typography, shadows } from '../../lib/theme';
import { useAuth } from '../../hooks/useAuth';

interface Contact {
  id: string;
  name: string;
  phoneNumber?: string;
  selected: boolean;
}

export default function InviteScreen({ navigation }: any) {
  const { profile, user } = useAuth();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCount, setSelectedCount] = useState(0);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    loadContacts();
  }, []);

  const loadContacts = async () => {
    try {
      const { status } = await Contacts.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'We need access to your contacts to send invitations.',
          [{ text: 'OK', onPress: () => navigation.goBack() }]
        );
        return;
      }

      const { data } = await Contacts.getContactsAsync({
        fields: [Contacts.Fields.PhoneNumbers, Contacts.Fields.Name],
        sort: Contacts.SortTypes.FirstName,
      });

      // Filter contacts with phone numbers and format them
      const validContacts: Contact[] = data
        .filter(contact => contact.name && contact.phoneNumbers?.length > 0)
        .map(contact => ({
          id: contact.id || Math.random().toString(),
          name: contact.name || 'Unknown',
          phoneNumber: contact.phoneNumbers?.[0]?.number,
          selected: false,
        }))
        .slice(0, 100); // Limit to first 100

      setContacts(validContacts);
    } catch (error) {
      console.error('Error loading contacts:', error);
      Alert.alert('Error', 'Failed to load contacts');
    } finally {
      setLoading(false);
    }
  };

  const toggleContact = (id: string) => {
    setContacts(prev => prev.map(c => {
      if (c.id === id) {
        const newSelected = !c.selected;
        setSelectedCount(count => newSelected ? count + 1 : count - 1);
        return { ...c, selected: newSelected };
      }
      return c;
    }));
  };

  const getInviteLink = () => {
    const userId = user?.id || 'join';
    return `https://real-ones.app/invite/${userId}`;
  };

  const getInviteMessage = () => {
    const name = profile?.full_name || 'A friend';
    return `${name} saved you a spot in their top 200 on REALones 🎯\n\nNo algorithm, no ads — just your actual friends.\n\nClaim your spot: ${getInviteLink()}`;
  };

  const sendSMSInvites = async () => {
    const selectedContacts = contacts.filter(c => c.selected);
    if (selectedContacts.length === 0) {
      Alert.alert('Select Contacts', 'Please select at least one contact to invite.');
      return;
    }

    setSending(true);

    try {
      const isAvailable = await SMS.isAvailableAsync();
      if (!isAvailable) {
        // Fallback to share
        Alert.alert(
          'SMS Not Available',
          'SMS is not available on this device. Use the share button instead.',
          [{ text: 'OK' }]
        );
        setSending(false);
        return;
      }

      const phoneNumbers = selectedContacts
        .map(c => c.phoneNumber)
        .filter(Boolean) as string[];

      const { result } = await SMS.sendSMSAsync(
        phoneNumbers,
        getInviteMessage()
      );

      if (result === 'sent') {
        Alert.alert(
          'Invites Sent! 🎉',
          `You invited ${selectedContacts.length} friends to claim their spot.`,
          [{ text: 'Awesome!', onPress: () => navigation.goBack() }]
        );
      }
    } catch (error) {
      console.error('SMS error:', error);
      Alert.alert('Error', 'Failed to send SMS invitations');
    } finally {
      setSending(false);
    }
  };

  const copyInviteLink = async () => {
    // Use Clipboard if available, otherwise show the link
    Alert.alert(
      'Share Your Link',
      getInviteLink(),
      [{ text: 'OK' }]
    );
  };

  const renderContact = ({ item }: { item: Contact }) => (
    <TouchableOpacity
      style={[styles.contactRow, item.selected && styles.contactRowSelected]}
      onPress={() => toggleContact(item.id)}
    >
      <View style={styles.contactAvatar}>
        <Text style={styles.contactAvatarText}>
          {item.name.charAt(0).toUpperCase()}
        </Text>
      </View>
      <View style={styles.contactInfo}>
        <Text style={styles.contactName}>{item.name}</Text>
        <Text style={styles.contactPhone}>{item.phoneNumber}</Text>
      </View>
      <View style={[styles.checkbox, item.selected && styles.checkboxSelected]}>
        {item.selected && (
          <Ionicons name="checkmark" size={16} color="#fff" />
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.deepBlue} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Invite Friends</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Hero Card */}
      <View style={styles.heroCard}>
        <View style={styles.heroIcon}>
          <Ionicons name="paper-plane" size={32} color={colors.accent} />
        </View>
        <Text style={styles.heroTitle}>Save Your Spots</Text>
        <Text style={styles.heroSubtitle}>
          Invite your real friends before their 200 fill up — and claim your spot in theirs!
        </Text>
      </View>

      {/* Quick Share */}
      <TouchableOpacity style={styles.linkCard} onPress={copyInviteLink}>
        <Ionicons name="link" size={20} color={colors.accent} />
        <View style={styles.linkInfo}>
          <Text style={styles.linkLabel}>Your personal invite link</Text>
          <Text style={styles.linkText} numberOfLines={1}>
            {getInviteLink()}
          </Text>
        </View>
        <Ionicons name="copy-outline" size={20} color={colors.softGray} />
      </TouchableOpacity>

      {/* Contact List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.accent} />
          <Text style={styles.loadingText}>Loading contacts...</Text>
        </View>
      ) : (
        <>
          <View style={styles.listHeader}>
            <Text style={styles.listTitle}>Select from Contacts</Text>
            <Text style={styles.selectedCount}>{selectedCount} selected</Text>
          </View>

          <FlatList
            data={contacts}
            renderItem={renderContact}
            keyExtractor={item => item.id}
            style={styles.list}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          />
        </>
      )}

      {/* Bottom Action */}
      <View style={styles.bottomAction}>
        <TouchableOpacity
          style={[styles.sendBtn, selectedCount === 0 && styles.sendBtnDisabled]}
          onPress={sendSMSInvites}
          disabled={selectedCount === 0 || sending}
        >
          {sending ? (
            <ActivityIndicator color={colors.warmWhite} />
          ) : (
            <>
              <Ionicons name="chatbubble" size={20} color={colors.warmWhite} />
              <Text style={styles.sendBtnText}>
                Send {selectedCount > 0 ? `${selectedCount} ` : ''}SMS Invite{selectedCount !== 1 ? 's' : ''}
              </Text>
            </>
          )}
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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  backBtn: {
    padding: spacing.xs,
  },
  headerTitle: {
    fontSize: typography.xl,
    fontWeight: typography.semibold,
    color: colors.deepBlue,
  },
  heroCard: {
    alignItems: 'center',
    backgroundColor: colors.warmWhite,
    marginHorizontal: spacing.md,
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.md,
    ...shadows.sm,
  },
  heroIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.accent + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  heroTitle: {
    fontSize: typography.lg,
    fontWeight: typography.semibold,
    color: colors.deepBlue,
    marginBottom: spacing.xs,
  },
  heroSubtitle: {
    fontSize: typography.sm,
    color: colors.softGray,
    textAlign: 'center',
    lineHeight: 20,
  },
  linkCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.warmWhite,
    marginHorizontal: spacing.md,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.md,
    gap: spacing.sm,
    ...shadows.sm,
  },
  linkInfo: {
    flex: 1,
  },
  linkLabel: {
    fontSize: typography.xs,
    color: colors.softGray,
  },
  linkText: {
    fontSize: typography.sm,
    color: colors.accent,
    fontWeight: typography.medium,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: spacing.md,
    fontSize: typography.base,
    color: colors.softGray,
  },
  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    marginBottom: spacing.sm,
  },
  listTitle: {
    fontSize: typography.base,
    fontWeight: typography.semibold,
    color: colors.deepBlue,
  },
  selectedCount: {
    fontSize: typography.sm,
    color: colors.softGray,
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.lg,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.warmWhite,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.sm,
  },
  contactRowSelected: {
    backgroundColor: colors.accent + '15',
    borderWidth: 2,
    borderColor: colors.accent,
  },
  contactAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.sky,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contactAvatarText: {
    fontSize: typography.lg,
    fontWeight: typography.semibold,
    color: colors.deepBlue,
  },
  contactInfo: {
    flex: 1,
    marginLeft: spacing.md,
  },
  contactName: {
    fontSize: typography.base,
    fontWeight: typography.medium,
    color: colors.deepBlue,
  },
  contactPhone: {
    fontSize: typography.sm,
    color: colors.softGray,
    marginTop: 2,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.softGray,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxSelected: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  bottomAction: {
    padding: spacing.md,
    paddingBottom: spacing.xl,
    backgroundColor: colors.babyBlue,
  },
  sendBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.deepBlue,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    gap: spacing.sm,
    ...shadows.md,
  },
  sendBtnDisabled: {
    backgroundColor: colors.softGray,
  },
  sendBtnText: {
    color: colors.warmWhite,
    fontSize: typography.lg,
    fontWeight: typography.semibold,
  },
});
