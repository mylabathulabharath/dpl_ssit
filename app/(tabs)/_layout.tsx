import { Tabs } from 'expo-router';
import React from 'react';

import { HapticTab } from '@/components/haptic-tab';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'dark'] || Colors.dark;

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#1C1D1F',
        tabBarInactiveTintColor: '#6A6F73',
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopColor: '#D1D7DC',
          borderTopWidth: 1,
          paddingTop: 8,
          paddingBottom: 8,
          height: 60,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '400',
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Featured',
          tabBarIcon: ({ color, focused }) => (
            <IconSymbol 
              size={24} 
              name="star.fill" 
              color={focused ? '#1C1D1F' : '#6A6F73'} 
            />
          ),
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: 'Search',
          tabBarIcon: ({ color, focused }) => (
            <IconSymbol 
              size={24} 
              name="magnifyingglass" 
              color={focused ? '#1C1D1F' : '#6A6F73'} 
            />
          ),
        }}
      />
      <Tabs.Screen
        name="my-learning"
        options={{
          title: 'My learning',
          tabBarIcon: ({ color, focused }) => (
            <IconSymbol 
              size={24} 
              name="play.circle.fill" 
              color={focused ? '#1C1D1F' : '#6A6F73'} 
            />
          ),
        }}
      />
      <Tabs.Screen
        name="wishlist"
        options={{
          title: 'Wishlist',
          tabBarIcon: ({ color, focused }) => (
            <IconSymbol 
              size={24} 
              name="heart.fill" 
              color={focused ? '#1C1D1F' : '#6A6F73'} 
            />
          ),
        }}
      />
      <Tabs.Screen
        name="account"
        options={{
          title: 'Account',
          tabBarIcon: ({ color, focused }) => (
            <IconSymbol 
              size={24} 
              name="house.fill" 
              color={focused ? '#1C1D1F' : '#6A6F73'} 
            />
          ),
        }}
      />
    </Tabs>
  );
}
