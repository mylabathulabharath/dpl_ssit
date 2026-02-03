# 🚀 Cohort Launchpad – Brand Theme & Design System

> **Design Concept:**  
> **Launch-Control Interface** – a mission-control style UI for careers.  
> Dark-first, glow-driven, icon-led, futuristic yet professional.

---

## 🎨 Brand Color System

### Primary Colors
- **Rocket Red**: `#F44336` - CTAs, progress, launch moments only
- **Electric Cyan**: `#29B6F6` - Identity, navigation, highlights
- **Deep Sky Blue**: `#4FC3F7` - Supporting blue
- **Ink Black**: `#1F1F1F` - Text on light backgrounds
- **Pure White**: `#FFFFFF` - Primary text

### Supporting / Accent Colors
- **Soft Cyan Glow**: `#81D4FA` - Soft glow effects
- **Steel Grey**: `#374151` - Secondary text
- **Muted Slate**: `#0F172A` - App Background
- **Highlight Yellow**: `#FFD54F` - Rare use, warnings

### Color Usage Rules
- **Red** → CTAs, progress, launch moments only  
- **Cyan / Blue** → identity, navigation, highlights  
- **Slate / Black** → professional base  
- **Glow only for interactive elements**

---

## 🧠 Design Philosophy

- **Dark-first UI** - Mission control aesthetic
- **Glow-based hierarchy** - No heavy shadows, cyan glow replaces elevation
- **Icon-first navigation** - Visual over text
- **Motion > decoration** - Purposeful animations
- **Rounded geometry with purpose** - 18px radius for cards, 14px for buttons
- **Minimal text, maximum clarity**

> *"I'm not just learning — I'm preparing for launch."*

---

## ✨ Glow System

The glow system replaces traditional shadows for interactive elements:

```typescript
// Available glows from theme
Glows.primary      // Cyan glow for primary buttons
Glows.primarySoft  // Soft cyan for subtle highlights
Glows.accent       // Red glow for launch moments
Glows.card         // Subtle glow for interactive cards
```

**Glow Rule**: Only interactive elements glow. Static elements use minimal shadows.

---

## 🎨 Component Design

### Button Design (Glow-Based)
```tsx
<Button 
  title="Launch Career" 
  variant="primary" // or "accent" for red
  size="large"
/>
```

**Primary Button:**
- Background: `#29B6F6` (Electric Cyan)
- Text: `#001018` (Dark on bright)
- Border Radius: `14px`
- Padding: `14px vertical`
- Glow: Cyan glow effect

**Accent Button (Launch Moments):**
- Background: `#F44336` (Rocket Red)
- Text: `#001018` (Dark on bright)
- Glow: Red glow effect

### Card System (Signature Look)
```tsx
// Cards automatically use the signature look
<CourseCard course={course} />
```

**Card Styling:**
- Background: `#111827` (Surface)
- Border: `1px solid #1E293B`
- Border Radius: `18px`
- Padding: `16px`
- Glow: Subtle cyan glow for interactive cards

---

## 📐 Theme Tokens

### Colors
Access via `Colors[colorScheme].primary`, `Colors[colorScheme].accent`, etc.

### Typography
- Display: 42px, bold
- H1: 32px, bold
- H2: 24px, semibold
- Body: 16px, regular
- Button: 16px, bold (700)

### Spacing
- xs: 4px
- sm: 8px
- md: 16px
- lg: 24px
- xl: 32px
- xxl: 48px

### Border Radius
- sm: 8px
- md: 12px
- lg: 16px
- xl: 24px
- full: 9999px
- Card: 18px (signature)
- Button: 14px (signature)

---

## 🚀 Micro-Branding (Trademark Elements)

### Launch Moments
- Rocket animation on milestone completion
- Temporary red accent flash
- Subtle vibration feedback

### Progress Rings
- Cyan circular progress (`#29B6F6`)
- Red indicator for current stage (`#F44336`)
- Dark muted base (`#1E293B`)

### Glow Rule
**Only interactive elements glow** - This is the signature look of the Launch Control Interface.

---

## 📝 Implementation Notes

1. **Dark-first**: All components default to dark mode
2. **Glow over shadows**: Use `Glows` instead of `Shadows` for interactive elements
3. **Brand colors**: Always use `BrandColors` constants, never hardcode
4. **Consistent radius**: Cards use 18px, buttons use 14px
5. **Text contrast**: Dark text (`#001018`) on bright backgrounds, white text on dark

---

## 🎯 Usage Examples

### Primary Button with Glow
```tsx
import { Button } from '@/components/ui/button';

<Button 
  title="Start Learning" 
  variant="primary" 
  onPress={handlePress}
/>
```

### Card with Signature Look
```tsx
import { CourseCard } from '@/components/course-card';

<CourseCard course={course} featured />
```

### Using Brand Colors
```tsx
import { BrandColors } from '@/constants/theme';

<View style={{ backgroundColor: BrandColors.electricCyan }}>
  <Text style={{ color: BrandColors.inkBlack }}>Launch</Text>
</View>
```

---

## ✅ Checklist for New Components

- [ ] Uses brand colors from `BrandColors` or `Colors`
- [ ] Interactive elements use `Glows` instead of `Shadows`
- [ ] Border radius follows design spec (18px cards, 14px buttons)
- [ ] Text contrast meets accessibility (dark on bright, white on dark)
- [ ] Follows dark-first approach
- [ ] Uses theme tokens (Spacing, Radius, Typography)

---

**Last Updated**: Brand theme implementation complete
**Version**: 1.0.0

