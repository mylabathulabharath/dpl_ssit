import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Modal } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors, Spacing, Typography, Radius } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { ThemedText } from '@/components/themed-text';
import { useAuth } from '@/contexts/auth-context';
import { IconSymbol } from '@/components/ui/icon-symbol';

interface UserMenuProps {
  trigger?: React.ReactNode;
}

export function UserMenu({ trigger }: UserMenuProps) {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'dark'];
  const { userProfile, logout } = useAuth();
  const [showMenu, setShowMenu] = useState(false);
  
  const handleLogout = async () => {
    try {
      await logout();
      router.replace('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };
  
  return (
    <>
      <TouchableOpacity onPress={() => setShowMenu(true)}>
        {trigger || (
          <View style={[styles.avatar, { backgroundColor: colors.accent }]}>
            <ThemedText
              style={[
                Typography.body,
                {
                  color: '#FFFFFF',
                  fontWeight: '600',
                },
              ]}
            >
              {userProfile?.displayName?.[0]?.toUpperCase() || 'U'}
            </ThemedText>
          </View>
        )}
      </TouchableOpacity>
      
      <Modal
        visible={showMenu}
        transparent
        animationType="fade"
        onRequestClose={() => setShowMenu(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowMenu(false)}
        >
          <View style={[styles.menu, { backgroundColor: colors.surface }]}>
            <View style={styles.menuHeader}>
              <View style={[styles.menuAvatar, { backgroundColor: colors.accent }]}>
                <ThemedText
                  style={[
                    Typography.h3,
                    {
                      color: '#FFFFFF',
                      fontWeight: '700',
                    },
                  ]}
                >
                  {userProfile?.displayName?.[0]?.toUpperCase() || 'U'}
                </ThemedText>
              </View>
              <View style={styles.menuUserInfo}>
                <ThemedText
                  style={[
                    Typography.body,
                    {
                      color: colors.text,
                      fontWeight: '600',
                    },
                  ]}
                >
                  {userProfile?.displayName || 'User'}
                </ThemedText>
                <ThemedText
                  style={[
                    Typography.bodySmall,
                    {
                      color: colors.textSecondary,
                    },
                  ]}
                >
                  {userProfile?.email}
                </ThemedText>
                <View style={[styles.roleBadge, { backgroundColor: colors.surfaceElevated }]}>
                  <ThemedText
                    style={[
                      Typography.caption,
                      {
                        color: colors.accent,
                        fontWeight: '600',
                        textTransform: 'capitalize',
                      },
                    ]}
                  >
                    {userProfile?.role || 'student'}
                  </ThemedText>
                </View>
              </View>
            </View>
            
            <View style={styles.menuDivider} />
            
            <TouchableOpacity
              style={styles.menuItem}
              onPress={handleLogout}
            >
              <IconSymbol name="xmark" size={20} color={colors.textSecondary} />
              <ThemedText
                style={[
                  Typography.body,
                  {
                    color: colors.text,
                    marginLeft: Spacing.md,
                  },
                ]}
              >
                Sign Out
              </ThemedText>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  menu: {
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    padding: Spacing.lg,
    paddingBottom: Spacing.xl,
  },
  menuHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  menuAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  menuUserInfo: {
    flex: 1,
  },
  roleBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.sm,
    marginTop: Spacing.xs,
  },
  menuDivider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
    marginVertical: Spacing.md,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
  },
});

