import { useState, useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';

// Configure how notifications appear when app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export function usePushNotifications() {
  const { user } = useAuth();
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);
  const [notification, setNotification] = useState<Notifications.Notification | null>(null);
  const notificationListener = useRef<Notifications.Subscription>();
  const responseListener = useRef<Notifications.Subscription>();

  // Register for push notifications
  const registerForPushNotifications = async (): Promise<string | null> => {
    if (!Device.isDevice) {
      console.log('Push notifications require a physical device');
      return null;
    }

    try {
      // Check existing permissions
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      // Request permissions if not granted
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.log('Failed to get push token - permission denied');
        return null;
      }

      // Get Expo push token
      const projectId = Constants.expoConfig?.extra?.eas?.projectId;
      const token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
      
      console.log('Push token:', token);
      setExpoPushToken(token);

      // Save token to database
      if (user && token) {
        await savePushToken(token);
      }

      // Configure Android channel
      if (Platform.OS === 'android') {
        Notifications.setNotificationChannelAsync('default', {
          name: 'default',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#4a90b8',
        });
      }

      return token;
    } catch (error) {
      console.error('Error registering for push notifications:', error);
      return null;
    }
  };

  // Save push token to Supabase
  const savePushToken = async (token: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('push_tokens')
        .upsert({
          user_id: user.id,
          token,
          platform: Platform.OS,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id,token',
        });

      if (error) throw error;
      console.log('Push token saved successfully');
    } catch (error) {
      console.error('Error saving push token:', error);
    }
  };

  // Remove push token (on logout)
  const removePushToken = async () => {
    if (!user || !expoPushToken) return;

    try {
      await supabase
        .from('push_tokens')
        .delete()
        .eq('user_id', user.id)
        .eq('token', expoPushToken);
      
      setExpoPushToken(null);
    } catch (error) {
      console.error('Error removing push token:', error);
    }
  };

  // Schedule a local notification (for testing)
  const scheduleLocalNotification = async (
    title: string,
    body: string,
    data?: Record<string, any>
  ) => {
    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data,
        sound: true,
      },
      trigger: null, // Immediate
    });
  };

  // Handle notification tap
  const handleNotificationResponse = (response: Notifications.NotificationResponse) => {
    const data = response.notification.request.content.data;
    
    // Handle different notification types
    if (data?.type === 'message' && data?.conversationId) {
      // Navigate to chat - this would be handled by the navigation
      console.log('Navigate to conversation:', data.conversationId);
    } else if (data?.type === 'friend_request') {
      console.log('Navigate to friends');
    }
  };

  useEffect(() => {
    // Register for push notifications when user logs in
    if (user) {
      registerForPushNotifications();
    }

    // Listen for incoming notifications (foreground)
    notificationListener.current = Notifications.addNotificationReceivedListener(
      (notification) => {
        setNotification(notification);
      }
    );

    // Listen for notification taps
    responseListener.current = Notifications.addNotificationResponseReceivedListener(
      handleNotificationResponse
    );

    return () => {
      if (notificationListener.current) {
        Notifications.removeNotificationSubscription(notificationListener.current);
      }
      if (responseListener.current) {
        Notifications.removeNotificationSubscription(responseListener.current);
      }
    };
  }, [user]);

  return {
    expoPushToken,
    notification,
    registerForPushNotifications,
    removePushToken,
    scheduleLocalNotification,
  };
}

// Helper function to send push notification via Expo's push service
// This would typically be called from a server/Edge Function
export async function sendPushNotification(
  expoPushToken: string,
  title: string,
  body: string,
  data?: Record<string, any>
) {
  const message = {
    to: expoPushToken,
    sound: 'default',
    title,
    body,
    data,
  };

  await fetch('https://exp.host/--/api/v2/push/send', {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Accept-encoding': 'gzip, deflate',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(message),
  });
}
