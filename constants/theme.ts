/**
 * 🚀 Cohort Launchpad – Brand Theme & Design System
 * Launch-Control Interface – a mission-control style UI for careers.
 * Dark-first, glow-driven, icon-led, futuristic yet professional.
 */

import { Platform } from 'react-native';

// 🎨 Brand Color System (Extracted from Logo)
export const BrandColors = {
  // Primary Colors
  rocketRed: '#F44336',
  electricCyan: '#29B6F6',
  deepSkyBlue: '#4FC3F7',
  inkBlack: '#1F1F1F',
  pureWhite: '#FFFFFF',
  
  // Supporting / Accent Colors
  softCyanGlow: '#81D4FA',
  steelGrey: '#374151',
  mutedSlate: '#0F172A', // App Background
  highlightYellow: '#FFD54F',
};

// Premium color palette - dark-first with brand colors
export const Colors = {
  // Dark mode (primary) - Launch Control Interface
  dark: {
    // Backgrounds - mission control dark
    background: BrandColors.mutedSlate, // #0F172A - App Background
    surface: '#111827', // Card/surface background
    surfaceElevated: '#1F2937', // Elevated surfaces
    
    // Text - pure white, high contrast
    text: BrandColors.pureWhite, // #FFFFFF - Primary text
    textPrimary: BrandColors.pureWhite,
    textSecondary: '#94A3B8', // Secondary text
    textTertiary: '#64748B', // Tertiary/muted text
    
    // Brand Accents
    primary: BrandColors.electricCyan, // #29B6F6 - Identity, navigation, highlights
    primarySoft: BrandColors.softCyanGlow, // #81D4FA - Soft cyan glow
    accent: BrandColors.rocketRed, // #F44336 - CTAs, progress, launch moments only
    
    // Legacy support (mapped to brand)
    accentHover: BrandColors.deepSkyBlue,
    
    // Progress & status
    progress: BrandColors.electricCyan, // Cyan circular progress
    progressBackground: '#1E293B',
    completed: '#22C55E', // Success green
    current: BrandColors.rocketRed, // Red indicator for current stage
    warning: BrandColors.highlightYellow, // Rare use
    
    // Borders - minimal, only when necessary
    border: '#1E293B', // Border color
    borderSubtle: '#0F172A',
    
    // Overlays
    overlay: 'rgba(0, 0, 0, 0.6)',
    overlayLight: 'rgba(0, 0, 0, 0.3)',
    
    // Status colors
    success: '#22C55E',
    
    // Legacy support
    tint: BrandColors.electricCyan,
    icon: '#94A3B8',
    tabIconDefault: '#64748B',
    tabIconSelected: BrandColors.electricCyan,
  },
  
  // Light mode (secondary, minimal support)
  light: {
    background: '#FAFAFA',
    surface: BrandColors.pureWhite,
    surfaceElevated: BrandColors.pureWhite,
    text: BrandColors.inkBlack,
    textPrimary: BrandColors.inkBlack,
    textSecondary: '#374151',
    textTertiary: '#6B7280',
    primary: BrandColors.electricCyan,
    primarySoft: BrandColors.softCyanGlow,
    accent: BrandColors.rocketRed,
    accentHover: BrandColors.deepSkyBlue,
    progress: BrandColors.electricCyan,
    progressBackground: '#E2E8F0',
    completed: '#22C55E',
    current: BrandColors.rocketRed,
    warning: BrandColors.highlightYellow,
    border: '#E2E8F0',
    borderSubtle: '#F1F5F9',
    overlay: 'rgba(255, 255, 255, 0.8)',
    overlayLight: 'rgba(255, 255, 255, 0.5)',
    success: '#22C55E',
    tint: BrandColors.electricCyan,
    icon: '#374151',
    tabIconDefault: '#6B7280',
    tabIconSelected: BrandColors.electricCyan,
  },
};

// Typography - large, generous, premium
export const Typography = {
  // Display - for hero sections
  display: {
    fontSize: 42,
    lineHeight: 52,
    fontWeight: '700' as const,
    letterSpacing: -0.5,
  },
  
  // Headings
  h1: {
    fontSize: 32,
    lineHeight: 40,
    fontWeight: '700' as const,
    letterSpacing: -0.3,
  },
  h2: {
    fontSize: 24,
    lineHeight: 32,
    fontWeight: '600' as const,
    letterSpacing: -0.2,
  },
  h3: {
    fontSize: 20,
    lineHeight: 28,
    fontWeight: '600' as const,
    letterSpacing: -0.1,
  },
  
  // Body - generous spacing
  bodyLarge: {
    fontSize: 18,
    lineHeight: 28,
    fontWeight: '400' as const,
  },
  body: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '400' as const,
  },
  bodySmall: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '400' as const,
  },
  
  // UI elements
  button: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '600' as const,
    letterSpacing: 0.2,
  },
  caption: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '400' as const,
    letterSpacing: 0.1,
  },
};

// Spacing system - generous, intentional
export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  xxxl: 64,
};

// Border radius - soft, rounded
export const Radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
  button: 14, // As per design spec
  card: 18, // Card system signature look
};

// ✨ Glow-Based Shadow System (Replaces traditional shadows)
// Only interactive elements glow - this is the signature look
export const Glows = {
  // Primary Cyan Glow - for interactive elements
  primary: {
    shadowColor: BrandColors.electricCyan,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.35,
    shadowRadius: 20,
    elevation: 8,
  },
  // Soft Cyan Glow - for subtle highlights
  primarySoft: {
    shadowColor: BrandColors.softCyanGlow,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 15,
    elevation: 6,
  },
  // Rocket Red Glow - for launch moments, CTAs
  accent: {
    shadowColor: BrandColors.rocketRed,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 8,
  },
  // Subtle glow for cards
  card: {
    shadowColor: BrandColors.electricCyan,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 4,
  },
};

// Legacy shadows (for non-interactive elements that need depth)
export const Shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
};

export const Fonts = Platform.select({
  ios: {
    sans: 'system-ui',
    serif: 'ui-serif',
    rounded: 'ui-rounded',
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
