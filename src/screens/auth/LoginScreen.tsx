import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, typography, shadows } from '../../lib/theme';
import { useAuth } from '../../hooks/useAuth';

export default function LoginScreen() {
  const { signInWithApple, signInWithGoogle } = useAuth();
  const [loading, setLoading] = useState<'apple' | 'google' | null>(null);

  const handleAppleSignIn = async () => {
    try {
      setLoading('apple');
      await signInWithApple();
    } catch (error: any) {
      Alert.alert('Sign In Failed', error.message || 'Please try again');
    } finally {
      setLoading(null);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setLoading('google');
      await signInWithGoogle();
    } catch (error: any) {
      Alert.alert('Sign In Failed', error.message || 'Please try again');
    } finally {
      setLoading(null);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Logo */}
        <View style={styles.logoContainer}>
          <Text style={styles.logoText}>
            REAL<Text style={styles.logoAccent}>ones</Text>
          </Text>
          <Text style={styles.tagline}>Sometimes a Step Back is a Step Forward</Text>
        </View>

        {/* Hero text */}
        <View style={styles.heroContainer}>
          <Text style={styles.heroText}>
            Your real friends.{'\n'}Your real memories.{'\n'}No noise.
          </Text>
        </View>

        {/* Auth buttons */}
        <View style={styles.authContainer}>
          <TouchableOpacity
            style={[styles.authButton, styles.appleButton]}
            onPress={handleAppleSignIn}
            disabled={loading !== null}
          >
            {loading === 'apple' ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons name="logo-apple" size={22} color="#fff" />
                <Text style={[styles.authButtonText, styles.appleButtonText]}>
                  Continue with Apple
                </Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.authButton, styles.googleButton]}
            onPress={handleGoogleSignIn}
            disabled={loading !== null}
          >
            {loading === 'google' ? (
              <ActivityIndicator color={colors.deepBlue} />
            ) : (
              <>
                <Ionicons name="logo-google" size={20} color={colors.deepBlue} />
                <Text style={[styles.authButtonText, styles.googleButtonText]}>
                  Continue with Google
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Terms */}
        <Text style={styles.termsText}>
          By continuing, you agree to our Terms of Service and Privacy Policy
        </Text>
      </View>

      {/* Decorative circles */}
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
  logoContainer: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  logoText: {
    fontSize: 48,
    fontWeight: '400',
    color: colors.deepBlue,
    letterSpacing: -1,
  },
  logoAccent: {
    fontStyle: 'italic',
    color: colors.accent,
  },
  tagline: {
    fontSize: typography.lg,
    fontStyle: 'italic',
    color: colors.softGray,
    marginTop: spacing.sm,
  },
  heroContainer: {
    marginBottom: spacing.xxl,
  },
  heroText: {
    fontSize: typography['2xl'],
    fontWeight: typography.light,
    color: colors.deepBlue,
    textAlign: 'center',
    lineHeight: 36,
  },
  authContainer: {
    width: '100%',
    maxWidth: 320,
    gap: spacing.md,
  },
  authButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md + 2,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.lg,
    gap: spacing.sm,
    ...shadows.md,
  },
  appleButton: {
    backgroundColor: '#000',
  },
  googleButton: {
    backgroundColor: colors.warmWhite,
  },
  authButtonText: {
    fontSize: typography.base,
    fontWeight: typography.medium,
  },
  appleButtonText: {
    color: '#fff',
  },
  googleButtonText: {
    color: colors.deepBlue,
  },
  termsText: {
    fontSize: typography.xs,
    color: colors.softGray,
    textAlign: 'center',
    marginTop: spacing.xl,
    paddingHorizontal: spacing.lg,
  },
  circle: {
    position: 'absolute',
    borderRadius: 9999,
    backgroundColor: 'rgba(184, 223, 245, 0.5)',
    zIndex: -1,
  },
  circle1: {
    width: 250,
    height: 250,
    top: -80,
    right: -60,
  },
  circle2: {
    width: 180,
    height: 180,
    bottom: 60,
    left: -70,
  },
});
