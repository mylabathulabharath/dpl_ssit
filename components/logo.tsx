import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ViewStyle, Image } from 'react-native';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuth } from '@/contexts/auth-context';
import { getCollege } from '@/services/admin-service';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors, Typography } from '@/constants/theme';

interface LogoProps {
  size?: number;
  style?: ViewStyle;
  variant?: 'default' | 'small' | 'large';
}

const COLLEGE_LOGO_KEY = '@college_logo';
const COLLEGE_LOGO_ID_KEY = '@college_logo_id';

export function Logo({ size, style, variant = 'default' }: LogoProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'dark'] || Colors.dark;
  const { userProfile } = useAuth();
  const [collegeLogo, setCollegeLogo] = useState<string | null>(null);
  
  // Determine size based on variant if size not provided
  const iconSize = size || (variant === 'small' ? 32 : variant === 'large' ? 48 : 40);
  const fontSize = variant === 'small' ? 20 : variant === 'large' ? 32 : 24;
  const subtitleSize = variant === 'small' ? 10 : variant === 'large' ? 14 : 12;
  
  useEffect(() => {
    loadCollegeLogo();
  }, [userProfile?.college_id]);
  
  const loadCollegeLogo = async () => {
    if (!userProfile?.college_id) {
      setCollegeLogo(null);
      return;
    }
    
    try {
      // Check if we have a stored logo for this college
      const storedLogoId = await AsyncStorage.getItem(COLLEGE_LOGO_ID_KEY);
      const storedLogo = await AsyncStorage.getItem(COLLEGE_LOGO_KEY);
      
      if (storedLogoId === userProfile.college_id && storedLogo) {
        setCollegeLogo(storedLogo);
        return;
      }
      
      // Fetch college data to check if it's partnered and get logo
      const college = await getCollege(userProfile.college_id);
      if (college && college.is_partnered && college.logo) {
        // Store the logo locally
        await AsyncStorage.setItem(COLLEGE_LOGO_KEY, college.logo);
        await AsyncStorage.setItem(COLLEGE_LOGO_ID_KEY, userProfile.college_id);
        setCollegeLogo(college.logo);
      } else {
        // Clear stored logo if college is not partnered
        await AsyncStorage.removeItem(COLLEGE_LOGO_KEY);
        await AsyncStorage.removeItem(COLLEGE_LOGO_ID_KEY);
        setCollegeLogo(null);
      }
    } catch (error) {
      console.error('Error loading college logo:', error);
      setCollegeLogo(null);
    }
  };
  
  // If college logo is available, show it as image
  if (collegeLogo) {
    return (
      <View style={[styles.logoImageContainer, style]}>
        <Image
          source={{ uri: collegeLogo }}
          style={[
            styles.logoImage,
            {
              width: size || (variant === 'small' ? 120 : variant === 'large' ? 200 : 160),
              height: (size || (variant === 'small' ? 120 : variant === 'large' ? 200 : 160)) * 0.25,
            },
          ]}
          resizeMode="contain"
        />
      </View>
    );
  }
  
  // Default: Show Material icon with DPL text
  return (
    <View style={[styles.logoContainer, style]}>
      <IconSymbol
        name="book.fill"
        size={iconSize}
        color={colors.primary}
      />
      <View style={styles.textContainer}>
        <Text style={[styles.logoText, { color: colors.text, fontSize }]}>
          DPL
        </Text>
        <Text style={[styles.subtitleText, { color: colors.textSecondary, fontSize: subtitleSize }]}>
          Digital Pocket Library
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    justifyContent: 'center',
    height: 44,
  },
  logoImageContainer: {
    justifyContent: 'center',
    alignItems: 'flex-start',
    height: 44,
    marginLeft: 4,
  },
  logoImage: {
    maxHeight: 36,
    alignSelf: 'center',
  },
  textContainer: {
    flexDirection: 'column',
    alignItems: 'flex-start',
  },
  logoText: {
    ...Typography.h2,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  subtitleText: {
    ...Typography.caption,
    fontWeight: '400',
    letterSpacing: 0.3,
  },
});

