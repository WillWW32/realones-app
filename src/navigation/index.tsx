import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../lib/theme';
import { useAuth } from '../hooks/useAuth';
import { usePioneer } from '../hooks/usePioneer';

// Auth Screens
import LoginScreen from '../screens/auth/LoginScreen';

// Onboarding Screens
import GotRealScreen from '../screens/onboarding/GotRealScreen';
import ClaimSpotScreen from '../screens/onboarding/ClaimSpotScreen';
import InviteFriendsScreen from '../screens/onboarding/InviteFriendsScreen';
import InvitesSentScreen from '../screens/onboarding/InvitesSentScreen';
import TierOnboardingScreen from '../screens/onboarding/TierOnboardingScreen';
import TieredOnboardingScreen from '../screens/onboarding/TieredOnboardingScreen';

// Main Screens
import FeedScreen from '../screens/main/FeedScreen';
import FriendsScreen from '../screens/main/FriendsScreen';
import ProfileScreen from '../screens/main/ProfileScreen';
import ComposeScreen from '../screens/main/ComposeScreen';
import BulkMessageScreen from '../screens/main/BulkMessageScreen';
import FacebookImportScreen from '../screens/main/FacebookImportScreen';
import SwipeCullScreen from '../screens/main/SwipeCullScreen';
import ConversationsScreen from '../screens/main/ConversationsScreen';
import ChatScreen from '../screens/main/ChatScreen';
import NewConversationScreen from '../screens/main/NewConversationScreen';
import AddFriendScreen from '../screens/main/AddFriendScreen';
import ContactImportScreen from '../screens/main/ContactImportScreen';
import EditProfileScreen from '../screens/main/EditProfileScreen';
import MemoriesScreen from '../screens/main/MemoriesScreen';
import MemoryBookScreen from '../screens/main/MemoryBookScreen';
import InviteScreen from '../screens/main/InviteScreen';
import PioneerScreen from '../screens/main/PioneerScreen';
import PioneerFeedScreen from '../screens/main/PioneerFeedScreen';
import PioneerChatScreen from '../screens/main/PioneerChatScreen';
import CommentsScreen from '../screens/main/CommentsScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// Pioneer tabs - shown before user earns 5 credits
function PioneerTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap = 'home';

          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Pioneer') {
            iconName = focused ? 'flag' : 'flag-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.softGray,
        tabBarStyle: {
          backgroundColor: colors.warmWhite,
          borderTopWidth: 1,
          borderTopColor: colors.lightGray,
          paddingTop: 8,
          paddingBottom: 8,
          height: 60,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
        },
      })}
    >
      <Tab.Screen name="Home" component={PioneerFeedScreen} />
      <Tab.Screen name="Pioneer" component={PioneerScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

// Main tabs - shown after user is activated
function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap = 'home';

          if (route.name === 'Feed') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Messages') {
            iconName = focused ? 'chatbubbles' : 'chatbubbles-outline';
          } else if (route.name === 'Friends') {
            iconName = focused ? 'people' : 'people-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.softGray,
        tabBarStyle: {
          backgroundColor: colors.warmWhite,
          borderTopWidth: 1,
          borderTopColor: colors.lightGray,
          paddingTop: 8,
          paddingBottom: 8,
          height: 60,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
        },
      })}
    >
      <Tab.Screen name="Feed" component={FeedScreen} />
      <Tab.Screen name="Messages" component={ConversationsScreen} />
      <Tab.Screen name="Friends" component={FriendsScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

function AuthStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ClaimSpot" component={ClaimSpotScreen} />
      <Stack.Screen name="Login" component={LoginScreen} />
    </Stack.Navigator>
  );
}

function PioneerStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="PioneerTabs" component={PioneerTabs} />
      <Stack.Screen name="MainTabs" component={MainTabs} />
      <Stack.Screen
        name="Compose"
        component={ComposeScreen}
        options={{ presentation: 'modal' }}
      />
      <Stack.Screen name="FacebookImport" component={FacebookImportScreen} />
      <Stack.Screen
        name="SwipeCull"
        component={SwipeCullScreen}
        options={{ gestureEnabled: false }}
      />
      <Stack.Screen
        name="EditProfile"
        component={EditProfileScreen}
        options={{ presentation: 'modal' }}
      />
      <Stack.Screen name="ContactImport" component={ContactImportScreen} />
      <Stack.Screen name="Invite" component={InviteScreen} />
      <Stack.Screen name="Chat" component={ChatScreen} />
      <Stack.Screen name="PioneerChat" component={PioneerChatScreen} />
      <Stack.Screen name="Comments" component={CommentsScreen} />
    </Stack.Navigator>
  );
}

function MainStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="MainTabs" component={MainTabs} />
      <Stack.Screen
        name="Compose"
        component={ComposeScreen}
        options={{ presentation: 'modal' }}
      />
      <Stack.Screen
        name="BulkMessage"
        component={BulkMessageScreen}
        options={{ presentation: 'modal' }}
      />
      <Stack.Screen
        name="GotReal"
        component={GotRealScreen}
        options={{ presentation: 'fullScreenModal' }}
      />
      <Stack.Screen name="FacebookImport" component={FacebookImportScreen} />
      <Stack.Screen 
        name="SwipeCull" 
        component={SwipeCullScreen}
        options={{ gestureEnabled: false }}
      />
      <Stack.Screen 
        name="InviteFriends" 
        component={InviteFriendsScreen}
        options={{ gestureEnabled: false }}
      />
      <Stack.Screen 
        name="InvitesSent" 
        component={InvitesSentScreen}
      />
      <Stack.Screen 
        name="TierOnboarding" 
        component={TierOnboardingScreen}
        options={{ gestureEnabled: false }}
      />
      <Stack.Screen 
        name="TieredOnboarding" 
        component={TieredOnboardingScreen}
        options={{ gestureEnabled: false }}
      />
      <Stack.Screen name="Chat" component={ChatScreen} />
      <Stack.Screen
        name="NewConversation"
        component={NewConversationScreen}
        options={{ presentation: 'modal' }}
      />
      <Stack.Screen
        name="AddFriend"
        component={AddFriendScreen}
        options={{ presentation: 'modal' }}
      />
      <Stack.Screen
        name="ContactImport"
        component={ContactImportScreen}
      />
      <Stack.Screen
        name="EditProfile"
        component={EditProfileScreen}
        options={{ presentation: 'modal' }}
      />
      <Stack.Screen name="Memories" component={MemoriesScreen} />
      <Stack.Screen
        name="MemoryBook"
        component={MemoryBookScreen}
        options={{ presentation: 'modal' }}
      />
      <Stack.Screen
        name="Invite"
        component={InviteScreen}
      />
      <Stack.Screen name="Comments" component={CommentsScreen} />
    </Stack.Navigator>
  );
}

function AppNavigator() {
  const { isActivated, loading: pioneerLoading } = usePioneer();

  if (pioneerLoading) {
    return null;
  }

  // Show Pioneer experience until activated, then MainStack
  return isActivated ? <MainStack /> : <PioneerStack />;
}

export default function Navigation() {
  const { session, loading } = useAuth();

  if (loading) {
    return null; // Or a splash screen
  }

  return (
    <NavigationContainer>
      {session ? <AppNavigator /> : <AuthStack />}
    </NavigationContainer>
  );
}
