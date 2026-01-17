import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Animated,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, typography, shadows } from '../../lib/theme';
import { supabase } from '../../lib/supabase';

interface ClaimSpotScreenProps {
  navigation: any;
  route: {
    params: {
      inviterId: string;
    };
  };
}

interface InviterProfile {
  id: string;
  full_name: string;
  avatar_url?: string;
  spots_filled: number;
  spots_total: number;
}

export default function ClaimSpotScreen({ navigation, route }: ClaimSpotScreenProps) {
  const { inviterId } = route.params || {};
  const [loading, setLoading] = useState(true);
  const [inviter, setInviter] = useState<InviterProfile | null>(null);
  const [claiming, setClaiming] = useState(false);
  
  // Animation for urgency
  const pulseAnim = useState(new Animated.Value(1))[0];

  useEffect(() => {
    // Pulse animation for spots remaining
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    ).start();

    fetchInviter();
  }, []);

  const fetchInviter = async () => {
    if (!inviterId) {
      setLoading(false);
      return;
    }

    try {
      // Fetch inviter profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url')
        .eq('id', inviterId)
        .single();

      // Count their friends
      const { count } = await supabase
        .from('friends')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', inviterId)
        .eq('status', 'active');

      if (profile) {
        setInviter({
          ...profile,
          spots_filled: count || 0,
          spots_total: 200, // Free tier max
        });
      }
    } catch (error) {
      console.error('Error fetching inviter:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClaimSpot = () => {
    setClaiming(true);
    // Navigate to signup with inviter reference
    navigation.navigate('Login', { 
      inviterId,
      autoConnect: true 
    });
  };

  const handleJoinWithoutInvite = () => {
    navigation.navigate('Login');
  };

  const spotsLeft = inviter ? inviter.spots_total - inviter.spots_filled : 0;
  const urgencyLevel = spotsLeft <= 20 ? 'high' : spotsLeft <= 50 ? 'medium' : 'low';

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.accent} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Logo */}
        <Image 
          source={require('../../../assets/logo.png')} 
          style={styles.logoImage}
          resizeMode="contain"
        />

        {inviter ? (
          <>
            {/* Inviter Card */}
            <View style={styles.inviterCard}>
              <View style={styles.inviterAvatar}>
                <Text style={styles.inviterAvatarText}>
                  {inviter.full_name.charAt(0).toUpperCase()}
                </Text>
              </View>
              <Text style={styles.inviterName}>{inviter.full_name}</Text>
              <Text style={styles.inviterMessage}>
                saved you a spot in their top 200
              </Text>
            </View>

            {/* Urgency Indicator */}
            <Animated.View 
              style={[
                styles.urgencyCard,
                urgencyLevel === 'high' && styles.urgencyHigh,
                { transform: [{ scale: urgencyLevel === 'high' ? pulseAnim : 1 }] }
              ]}
            >
              <Ionicons 
                name={urgencyLevel === 'high' ? 'warning' : 'people'} 
                size={24} 
                color={urgencyLevel === 'high' ? '#fff' : colors.deepBlue} 
              />
              <View style={styles.urgencyTextContainer}>
                <Text style={[
                  styles.urgencyNumber,
                  urgencyLevel === 'high' && styles.urgencyTextWhite
                ]}>
                  {spotsLeft} spots left
                </Text>
                <Text style={[
                  styles.urgencySubtext,
                  urgencyLevel === 'high' && styles.urgencyTextWhite
                ]}>
                  {urgencyLevel === 'high' 
                    ? 'Almost full! Claim now' 
                    : `${inviter.spots_filled} friends already in`}
                </Text>
              </View>
            </Animated.View>

            {/* Value Props */}
            <View style={styles.valueProps}>
              <View style={styles.valueProp}>
                <Ionicons name="heart" size={20} color={colors.accent} />
                <Text style={styles.valuePropText}>Your actual friends, not followers</Text>
              </View>
              <View style={styles.valueProp}>
                <Ionicons name="shuffle-outline" size={20} color={colors.accent} />
                <Text style={styles.valuePropText}>No algorithm — just chronological</Text>
              </View>
              <View style={styles.valueProp}>
                <Ionicons name="shield-checkmark" size={20} color={colors.accent} />
                <Text style={styles.valuePropText}>Limited to 200 real connections</Text>
              </View>
            </View>

            {/* CTA */}
            <TouchableOpacity 
              style={styles.claimBtn}
              onPress={handleClaimSpot}
              disabled={claiming}
            >
              {claiming ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Ionicons name="hand-left" size={22} color="#fff" />
                  <Text style={styles.claimBtnText}>Claim Your Spot</Text>
                </>
              )}
            </TouchableOpacity>

            <Text style={styles.mutualNote}>
              You'll both be in each other's top 200
            </Text>
          </>
        ) : (
          <>
            {/* Generic Join (no invite) */}
            <View style={styles.genericJoin}>
              <Ionicons name="people" size={64} color={colors.accent} />
              <Text style={styles.genericTitle}>Your Real Friends Only</Text>
              <Text style={styles.genericSubtitle}>
                No algorithm. No ads. Just the 200 people who actually matter.
              </Text>
            </View>

            <TouchableOpacity 
              style={styles.claimBtn}
              onPress={handleJoinWithoutInvite}
            >
              <Text style={styles.claimBtnText}>Get Started</Text>
            </TouchableOpacity>
          </>
        )}
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Already have an account?{' '}
          <Text 
            style={styles.footerLink}
            onPress={() => navigation.navigate('Login')}
          >
            Sign in
          </Text>
        </Text>
      </View>
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
  content: {
    flex: 1,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xxl,
    alignItems: 'center',
  },
  logoImage: {
    width: 180,
    height: 80,
    marginBottom: spacing.xl,
  },
  inviterCard: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  inviterAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
    ...shadows.md,
  },
  inviterAvatarText: {
    fontSize: 32,
    fontWeight: typography.bold,
    color: '#fff',
  },
  inviterName: {
    fontSize: typography.xl,
    fontWeight: typography.bold,
    color: colors.deepBlue,
  },
  inviterMessage: {
    fontSize: typography.base,
    color: colors.softGray,
    marginTop: spacing.xs,
  },
  urgencyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.warmWhite,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.xl,
    gap: spacing.md,
    ...shadows.sm,
  },
  urgencyHigh: {
    backgroundColor: '#e74c3c',
  },
  urgencyTextContainer: {
    flex: 1,
  },
  urgencyNumber: {
    fontSize: typography.lg,
    fontWeight: typography.bold,
    color: colors.deepBlue,
  },
  urgencySubtext: {
    fontSize: typography.sm,
    color: colors.softGray,
  },
  urgencyTextWhite: {
    color: '#fff',
  },
  valueProps: {
    alignSelf: 'stretch',
    marginBottom: spacing.xl,
  },
  valueProp: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  valuePropText: {
    fontSize: typography.base,
    color: colors.deepBlue,
  },
  claimBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.deepBlue,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xxl,
    borderRadius: borderRadius.lg,
    gap: spacing.sm,
    alignSelf: 'stretch',
    ...shadows.md,
  },
  claimBtnText: {
    color: '#fff',
    fontSize: typography.lg,
    fontWeight: typography.bold,
  },
  mutualNote: {
    fontSize: typography.sm,
    color: colors.softGray,
    marginTop: spacing.md,
    textAlign: 'center',
  },
  genericJoin: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  genericTitle: {
    fontSize: typography['2xl'],
    fontWeight: typography.bold,
    color: colors.deepBlue,
    marginTop: spacing.lg,
  },
  genericSubtitle: {
    fontSize: typography.base,
    color: colors.softGray,
    textAlign: 'center',
    marginTop: spacing.sm,
    lineHeight: 22,
  },
  footer: {
    padding: spacing.lg,
    alignItems: 'center',
  },
  footerText: {
    fontSize: typography.base,
    color: colors.softGray,
  },
  footerLink: {
    color: colors.accent,
    fontWeight: typography.semibold,
  },
});
