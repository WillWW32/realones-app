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
  Image,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { colors, spacing, borderRadius, typography, shadows } from '../../lib/theme';
import { usePosts } from '../../hooks/usePosts';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../lib/supabase';

const MAX_PHOTOS = 4;

export default function ComposeScreen({ navigation }: any) {
  const { profile, user } = useAuth();
  const { createPost } = usePosts();
  const [content, setContent] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);

  const pickImage = async () => {
    if (photos.length >= MAX_PHOTOS) {
      Alert.alert('Limit Reached', `You can only add up to ${MAX_PHOTOS} photos per post.`);
      return;
    }

    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Please allow access to your photos to add images to your post.'
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
        allowsMultipleSelection: false,
      });

      if (!result.canceled && result.assets[0]) {
        setPhotos([...photos, result.assets[0].uri]);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image. Please try again.');
    }
  };

  const removePhoto = (index: number) => {
    setPhotos(photos.filter((_, i) => i !== index));
  };

  const uploadPhotos = async (): Promise<string[]> => {
    if (!user?.id || photos.length === 0) return [];

    const uploadedUrls: string[] = [];

    for (const photoUri of photos) {
      try {
        const ext = photoUri.split('.').pop()?.toLowerCase() || 'jpg';
        const fileName = `${user.id}/${Date.now()}-${Math.random().toString(36).substring(7)}.${ext}`;
        const filePath = fileName;

        const response = await fetch(photoUri);
        const blob = await response.blob();

        const { error: uploadError } = await supabase.storage
          .from('posts')
          .upload(filePath, blob, {
            contentType: `image/${ext}`,
          });

        if (uploadError) {
          console.error('Upload error:', uploadError);
          continue;
        }

        const { data: { publicUrl } } = supabase.storage
          .from('posts')
          .getPublicUrl(filePath);

        uploadedUrls.push(publicUrl);
      } catch (error) {
        console.error('Error uploading photo:', error);
      }
    }

    return uploadedUrls;
  };

  const handlePost = async () => {
    if (!content.trim() && photos.length === 0) {
      Alert.alert('Empty Post', 'Write something or add a photo to share with your circle!');
      return;
    }

    try {
      setLoading(true);

      let mediaUrls: string[] = [];

      if (photos.length > 0) {
        setUploading(true);
        mediaUrls = await uploadPhotos();
        setUploading(false);

        if (mediaUrls.length === 0 && photos.length > 0) {
          Alert.alert('Upload Failed', 'Failed to upload photos. Please try again.');
          setLoading(false);
          return;
        }
      }

      const postType = mediaUrls.length > 0 ? 'photo' : 'text';
      await createPost(content.trim(), mediaUrls, postType);
      navigation.goBack();
    } catch (error: any) {
      console.error('Post creation error:', error);
      Alert.alert(
        'Failed to Create Post',
        error?.message || 'Something went wrong. Please try again.'
      );
    } finally {
      setLoading(false);
      setUploading(false);
    }
  };

  const canPost = content.trim().length > 0 || photos.length > 0;

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

        <ScrollView style={styles.scrollView} keyboardShouldPersistTaps="handled">
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

          {/* Photo Preview */}
          {photos.length > 0 && (
            <View style={styles.photoPreviewContainer}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {photos.map((uri, index) => (
                  <View key={index} style={styles.photoWrapper}>
                    <Image source={{ uri }} style={styles.photoPreview} />
                    <TouchableOpacity
                      style={styles.removePhotoBtn}
                      onPress={() => removePhoto(index)}
                    >
                      <Ionicons name="close-circle" size={24} color={colors.error} />
                    </TouchableOpacity>
                  </View>
                ))}
                {photos.length < MAX_PHOTOS && (
                  <TouchableOpacity style={styles.addMoreBtn} onPress={pickImage}>
                    <Ionicons name="add" size={32} color={colors.softGray} />
                  </TouchableOpacity>
                )}
              </ScrollView>
              <Text style={styles.photoCount}>{photos.length}/{MAX_PHOTOS} photos</Text>
            </View>
          )}

          {/* Uploading indicator */}
          {uploading && (
            <View style={styles.uploadingBar}>
              <ActivityIndicator size="small" color={colors.accent} />
              <Text style={styles.uploadingText}>Uploading photos...</Text>
            </View>
          )}

          {/* Character count */}
          <View style={styles.footer}>
            <Text style={styles.charCount}>{content.length}/2000</Text>
          </View>
        </ScrollView>

        {/* Action buttons */}
        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={pickImage}
            disabled={photos.length >= MAX_PHOTOS}
          >
            <Ionicons
              name="image-outline"
              size={24}
              color={photos.length >= MAX_PHOTOS ? colors.mediumGray : colors.accent}
            />
            <Text style={[
              styles.actionText,
              photos.length >= MAX_PHOTOS && styles.actionTextDisabled
            ]}>
              Photo {photos.length > 0 ? `(${photos.length})` : ''}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="location-outline" size={24} color={colors.mediumGray} />
            <Text style={[styles.actionText, styles.actionTextDisabled]}>Check In</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="stats-chart-outline" size={24} color={colors.mediumGray} />
            <Text style={[styles.actionText, styles.actionTextDisabled]}>Poll</Text>
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
  scrollView: {
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
    flexDirection: 'row',
    padding: spacing.md,
    minHeight: 120,
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
  photoPreviewContainer: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
  },
  photoWrapper: {
    position: 'relative',
    marginRight: spacing.sm,
  },
  photoPreview: {
    width: 120,
    height: 120,
    borderRadius: borderRadius.md,
  },
  removePhotoBtn: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: colors.warmWhite,
    borderRadius: 12,
  },
  addMoreBtn: {
    width: 120,
    height: 120,
    borderRadius: borderRadius.md,
    borderWidth: 2,
    borderColor: colors.lightGray,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.warmWhite,
  },
  photoCount: {
    fontSize: typography.xs,
    color: colors.softGray,
    marginTop: spacing.sm,
  },
  uploadingBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  uploadingText: {
    fontSize: typography.sm,
    color: colors.accent,
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
  actionTextDisabled: {
    color: colors.mediumGray,
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
