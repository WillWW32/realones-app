import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  Alert,
  ActivityIndicator,
  Platform,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import { colors, spacing, borderRadius, typography, shadows } from '../../lib/theme';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../lib/supabase';

interface MemoryEntry {
  id: string;
  user_id: string;
  title: string;
  content: string;
  memory_date: string;
  media_urls?: string[];
  created_at: string;
}

export default function MemoryBookScreen({ navigation }: any) {
  const { user } = useAuth();
  const [memories, setMemories] = useState<MemoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form state
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [memoryDate, setMemoryDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedImages, setSelectedImages] = useState<string[]>([]);

  const fetchMemories = useCallback(async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('memory_book')
        .select('*')
        .eq('user_id', user.id)
        .order('memory_date', { ascending: false });

      if (error && error.code !== '42P01') throw error; // Ignore table doesn't exist error
      setMemories(data || []);
    } catch (err) {
      console.error('Error fetching memories:', err);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchMemories();
  }, [fetchMemories]);

  const pickImages = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'We need camera roll permission to add photos.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.8,
      selectionLimit: 4,
    });

    if (!result.canceled && result.assets) {
      const newImages = result.assets.map(asset => asset.uri);
      setSelectedImages([...selectedImages, ...newImages].slice(0, 4));
    }
  };

  const removeImage = (index: number) => {
    setSelectedImages(selectedImages.filter((_, i) => i !== index));
  };

  const onDateChange = (event: any, date?: Date) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (date) {
      setMemoryDate(date);
    }
  };

  const uploadImages = async (): Promise<string[]> => {
    const urls: string[] = [];

    for (const imageUri of selectedImages) {
      try {
        // Use folder structure: userId/filename for proper RLS policies
        const filename = `${user?.id}/memory_${Date.now()}_${urls.length}.jpg`;
        const response = await fetch(imageUri);
        const blob = await response.blob();

        const { data, error } = await supabase.storage
          .from('memory-book')
          .upload(filename, blob, {
            contentType: 'image/jpeg',
          });

        if (error) throw error;

        const { data: urlData } = supabase.storage
          .from('memory-book')
          .getPublicUrl(data.path);

        urls.push(urlData.publicUrl);
      } catch (err) {
        console.error('Error uploading image:', err);
      }
    }

    return urls;
  };

  const saveMemory = async () => {
    if (!user?.id) return;
    if (!title.trim() && !content.trim() && selectedImages.length === 0) {
      Alert.alert('Add content', 'Please add a title, description, or photos to your memory.');
      return;
    }

    try {
      setSaving(true);

      // Upload images first
      let mediaUrls: string[] = [];
      if (selectedImages.length > 0) {
        mediaUrls = await uploadImages();
      }

      // Save memory entry
      const { error } = await supabase.from('memory_book').insert({
        user_id: user.id,
        title: title.trim() || 'Untitled Memory',
        content: content.trim(),
        memory_date: memoryDate.toISOString(),
        media_urls: mediaUrls,
      });

      if (error) throw error;

      // Reset form
      setTitle('');
      setContent('');
      setMemoryDate(new Date());
      setSelectedImages([]);
      setShowAddForm(false);

      // Refresh list
      fetchMemories();

      Alert.alert('Memory saved!', 'Your memory has been added to your Memory Book.');
    } catch (err) {
      console.error('Error saving memory:', err);
      Alert.alert('Error', 'Failed to save memory. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const renderMemoryItem = ({ item }: { item: MemoryEntry }) => {
    const date = new Date(item.memory_date);
    return (
      <View style={styles.memoryItem}>
        <View style={styles.memoryItemDate}>
          <Text style={styles.memoryDay}>{date.getDate()}</Text>
          <Text style={styles.memoryMonth}>
            {date.toLocaleDateString('en-US', { month: 'short' })}
          </Text>
          <Text style={styles.memoryYear}>{date.getFullYear()}</Text>
        </View>
        <View style={styles.memoryItemContent}>
          <Text style={styles.memoryItemTitle}>{item.title}</Text>
          {item.content && (
            <Text style={styles.memoryItemText} numberOfLines={2}>
              {item.content}
            </Text>
          )}
          {item.media_urls && item.media_urls.length > 0 && (
            <View style={styles.memoryThumbnails}>
              {item.media_urls.slice(0, 3).map((url, idx) => (
                <Image key={idx} source={{ uri: url }} style={styles.thumbnail} />
              ))}
              {item.media_urls.length > 3 && (
                <View style={styles.moreBadge}>
                  <Text style={styles.moreText}>+{item.media_urls.length - 3}</Text>
                </View>
              )}
            </View>
          )}
        </View>
        <Ionicons name="chevron-forward" size={20} color={colors.softGray} />
      </View>
    );
  };

  const renderAddForm = () => (
    <ScrollView style={styles.formContainer} keyboardShouldPersistTaps="handled">
      <View style={styles.formHeader}>
        <TouchableOpacity onPress={() => setShowAddForm(false)} style={styles.cancelBtn}>
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
        <Text style={styles.formTitle}>Add Memory</Text>
        <TouchableOpacity
          onPress={saveMemory}
          style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator size="small" color={colors.warmWhite} />
          ) : (
            <Text style={styles.saveText}>Save</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Date Picker */}
      <TouchableOpacity
        style={styles.dateSelector}
        onPress={() => setShowDatePicker(true)}
      >
        <Ionicons name="calendar-outline" size={22} color={colors.accent} />
        <View style={styles.dateInfo}>
          <Text style={styles.dateLabel}>When did this happen?</Text>
          <Text style={styles.dateValue}>
            {memoryDate.toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </Text>
        </View>
        <Ionicons name="chevron-down" size={20} color={colors.softGray} />
      </TouchableOpacity>

      {showDatePicker && (
        <DateTimePicker
          value={memoryDate}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={onDateChange}
          maximumDate={new Date()}
        />
      )}

      {/* Title */}
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Title (optional)</Text>
        <TextInput
          style={styles.titleInput}
          placeholder="e.g., Beach trip with friends"
          placeholderTextColor={colors.softGray}
          value={title}
          onChangeText={setTitle}
        />
      </View>

      {/* Story */}
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>The story</Text>
        <TextInput
          style={styles.contentInput}
          placeholder="What happened? Who was there? Why does this memory matter?"
          placeholderTextColor={colors.softGray}
          value={content}
          onChangeText={setContent}
          multiline
          textAlignVertical="top"
        />
      </View>

      {/* Photos */}
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Photos</Text>
        <View style={styles.photoGrid}>
          {selectedImages.map((uri, index) => (
            <View key={index} style={styles.photoContainer}>
              <Image source={{ uri }} style={styles.selectedPhoto} />
              <TouchableOpacity
                style={styles.removePhotoBtn}
                onPress={() => removeImage(index)}
              >
                <Ionicons name="close-circle" size={24} color={colors.error} />
              </TouchableOpacity>
            </View>
          ))}
          {selectedImages.length < 4 && (
            <TouchableOpacity style={styles.addPhotoBtn} onPress={pickImages}>
              <Ionicons name="add" size={32} color={colors.accent} />
              <Text style={styles.addPhotoText}>Add photo</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Tips */}
      <View style={styles.tipsCard}>
        <Ionicons name="sparkles" size={20} color={colors.accent} />
        <View style={styles.tipsContent}>
          <Text style={styles.tipsTitle}>Memory Tips</Text>
          <Text style={styles.tipsText}>
            • Add old photos from your camera roll{'\n'}
            • Include the people who were there{'\n'}
            • Memories on this date will show in "On This Day"
          </Text>
        </View>
      </View>
    </ScrollView>
  );

  if (showAddForm) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        {renderAddForm()}
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.deepBlue} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Memory Book</Text>
        <TouchableOpacity onPress={() => setShowAddForm(true)} style={styles.headerAddBtn}>
          <Ionicons name="add" size={24} color={colors.accent} />
        </TouchableOpacity>
      </View>

      {/* Intro */}
      <View style={styles.introCard}>
        <Ionicons name="book" size={24} color={colors.accent} />
        <Text style={styles.introText}>
          Scrapbook your life's best moments - even from before REALones. These memories will appear in your "On This Day" feed.
        </Text>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.accent} />
        </View>
      ) : memories.length === 0 ? (
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIcon}>
            <Ionicons name="images-outline" size={64} color={colors.softGray} />
          </View>
          <Text style={styles.emptyTitle}>Start your Memory Book</Text>
          <Text style={styles.emptySubtitle}>
            Add photos and stories from your past - graduation, trips, special moments with friends.
          </Text>
          <TouchableOpacity
            style={styles.addFirstBtn}
            onPress={() => setShowAddForm(true)}
          >
            <Ionicons name="add-circle" size={20} color={colors.warmWhite} />
            <Text style={styles.addFirstText}>Add Your First Memory</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={memories}
          renderItem={renderMemoryItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListFooterComponent={
            <TouchableOpacity
              style={styles.addMoreBtn}
              onPress={() => setShowAddForm(true)}
            >
              <Ionicons name="add-circle-outline" size={20} color={colors.accent} />
              <Text style={styles.addMoreText}>Add another memory</Text>
            </TouchableOpacity>
          }
        />
      )}
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
  headerAddBtn: {
    padding: spacing.xs,
  },
  introCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.accent + '15',
    marginHorizontal: spacing.md,
    marginBottom: spacing.md,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    gap: spacing.sm,
  },
  introText: {
    flex: 1,
    fontSize: typography.sm,
    color: colors.deepBlue,
    lineHeight: 20,
  },
  listContent: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.xxl,
  },
  memoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.warmWhite,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    ...shadows.sm,
  },
  memoryItemDate: {
    alignItems: 'center',
    width: 50,
    marginRight: spacing.md,
  },
  memoryDay: {
    fontSize: typography.xl,
    fontWeight: typography.bold,
    color: colors.accent,
  },
  memoryMonth: {
    fontSize: typography.xs,
    color: colors.softGray,
    textTransform: 'uppercase',
  },
  memoryYear: {
    fontSize: typography.xs,
    color: colors.softGray,
  },
  memoryItemContent: {
    flex: 1,
  },
  memoryItemTitle: {
    fontSize: typography.base,
    fontWeight: typography.semibold,
    color: colors.deepBlue,
    marginBottom: 2,
  },
  memoryItemText: {
    fontSize: typography.sm,
    color: colors.softGray,
    lineHeight: 18,
  },
  memoryThumbnails: {
    flexDirection: 'row',
    marginTop: spacing.sm,
    gap: spacing.xs,
  },
  thumbnail: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.sm,
  },
  moreBadge: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.lightGray,
    alignItems: 'center',
    justifyContent: 'center',
  },
  moreText: {
    fontSize: typography.xs,
    fontWeight: typography.semibold,
    color: colors.softGray,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    paddingTop: spacing.xxl,
    paddingHorizontal: spacing.lg,
  },
  emptyIcon: {
    marginBottom: spacing.lg,
  },
  emptyTitle: {
    fontSize: typography.xl,
    fontWeight: typography.semibold,
    color: colors.deepBlue,
    marginBottom: spacing.sm,
  },
  emptySubtitle: {
    fontSize: typography.base,
    color: colors.softGray,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: spacing.xl,
  },
  addFirstBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.accent,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.full,
    gap: spacing.sm,
  },
  addFirstText: {
    fontSize: typography.base,
    fontWeight: typography.semibold,
    color: colors.warmWhite,
  },
  addMoreBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.lg,
    gap: spacing.xs,
  },
  addMoreText: {
    fontSize: typography.base,
    color: colors.accent,
    fontWeight: typography.medium,
  },
  // Form styles
  formContainer: {
    flex: 1,
    backgroundColor: colors.warmWhite,
  },
  formHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGray,
  },
  cancelBtn: {
    padding: spacing.xs,
  },
  cancelText: {
    fontSize: typography.base,
    color: colors.softGray,
  },
  formTitle: {
    fontSize: typography.lg,
    fontWeight: typography.semibold,
    color: colors.deepBlue,
  },
  saveBtn: {
    backgroundColor: colors.accent,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.full,
    minWidth: 70,
    alignItems: 'center',
  },
  saveBtnDisabled: {
    opacity: 0.6,
  },
  saveText: {
    fontSize: typography.base,
    fontWeight: typography.semibold,
    color: colors.warmWhite,
  },
  dateSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGray,
    gap: spacing.md,
  },
  dateInfo: {
    flex: 1,
  },
  dateLabel: {
    fontSize: typography.sm,
    color: colors.softGray,
  },
  dateValue: {
    fontSize: typography.base,
    fontWeight: typography.medium,
    color: colors.deepBlue,
    marginTop: 2,
  },
  inputGroup: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGray,
  },
  inputLabel: {
    fontSize: typography.sm,
    fontWeight: typography.medium,
    color: colors.softGray,
    marginBottom: spacing.sm,
  },
  titleInput: {
    fontSize: typography.lg,
    color: colors.deepBlue,
    padding: 0,
  },
  contentInput: {
    fontSize: typography.base,
    color: colors.deepBlue,
    minHeight: 120,
    padding: 0,
    lineHeight: 24,
  },
  photoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  photoContainer: {
    position: 'relative',
  },
  selectedPhoto: {
    width: 100,
    height: 100,
    borderRadius: borderRadius.md,
  },
  removePhotoBtn: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: colors.warmWhite,
    borderRadius: 12,
  },
  addPhotoBtn: {
    width: 100,
    height: 100,
    borderRadius: borderRadius.md,
    borderWidth: 2,
    borderColor: colors.accent,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addPhotoText: {
    fontSize: typography.xs,
    color: colors.accent,
    marginTop: 4,
  },
  tipsCard: {
    flexDirection: 'row',
    backgroundColor: colors.babyBlue,
    margin: spacing.md,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    gap: spacing.sm,
    alignItems: 'flex-start',
  },
  tipsContent: {
    flex: 1,
  },
  tipsTitle: {
    fontSize: typography.sm,
    fontWeight: typography.semibold,
    color: colors.deepBlue,
    marginBottom: 4,
  },
  tipsText: {
    fontSize: typography.sm,
    color: colors.softGray,
    lineHeight: 20,
  },
});
