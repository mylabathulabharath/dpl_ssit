# 🏛 Admin Panel Documentation

## Overview

The Admin Panel is a comprehensive web-first interface for managing the multi-tenant education platform. It provides complete control over universities, colleges, courses, and white-label partner behavior.

---

## 🎯 Key Features

### 1. **Universities Management**
- Create, edit, and view universities
- Manage university details (name, logo, chairman, contacts)
- View and manage courses under each university

### 2. **Courses Management**
- Courses are scoped to universities (no global courses)
- Add, edit, activate/deactivate courses
- Courses belong ONLY to their parent university

### 3. **Colleges Management**
- Step-based flow for adding colleges:
  1. **Select University** - Choose parent university
  2. **College Details** - Enter name, logo, chairman, contacts
  3. **Select Courses** - Choose from university's course list
- Edit existing colleges
- View partnership status

### 4. **Partnered Colleges (White-Label)**
- **MOST IMPORTANT FEATURE**
- Toggle partnership status for colleges
- Preview white-label experience
- When partnered, platform transforms:
  - App logo → College logo
  - App name → "{College Name} Digital Library"
  - Courses → Only that college's courses
  - No reloads, no duplicate apps

---

## 🏗 Architecture

### Data Model

```
University
├── id
├── name
├── logo
├── chairman_name
├── chairman_photo
├── contact_numbers[]
└── courses[] (Course)

Course
├── id
├── university_id (required)
├── name
├── description
├── duration
└── status (active/inactive)

College
├── id
├── university_id (required)
├── name
├── logo
├── chairman_name
├── chairman_photo
├── contact_numbers[]
├── offered_courses[] (subset of university courses)
└── is_partnered (boolean)
```

### Key Rules

1. **Courses belong ONLY to universities** - No global courses
2. **Colleges can ONLY select courses from their university**
3. **Partner status enables white-label behavior**
4. **No duplicate branding apps** - Single platform, dynamic branding

---

## 🧩 Components

### Admin Components (`components/admin/`)

- **`sidebar.tsx`** - Icon-first, collapsible navigation
- **`data-table.tsx`** - Reusable data table with sorting/filtering
- **`modal.tsx`** - Modal dialogs for forms
- **`stepper.tsx`** - Multi-step form navigation
- **`button.tsx`** - Consistent button styling

### Context

- **`partner-context.tsx`** - Manages white-label behavior
  - `partnerContext` - Current partner state
  - `setPartnerCollege()` - Activate partner mode
  - `clearPartnerContext()` - Exit partner mode
  - `isPartnerMode` - Boolean flag

---

## 🚀 Usage

### Accessing Admin Panel

1. Navigate to `/admin` (requires admin role)
2. Sidebar navigation provides access to all modules

### Adding a University

1. Go to **Universities** → Click **Add University**
2. Fill in university details
3. Upload logo (drag & drop)
4. Add chairman details and contact numbers
5. Save

### Adding Courses to University

1. Go to **Universities** → Select university → **Courses** tab
2. Click **Add Course**
3. Enter course details (name, description, duration)
4. Set status (active/inactive)
5. Save

### Adding a College (Step-Based)

1. Go to **Colleges** → Click **Add College**
2. **Step 1**: Select parent university
3. **Step 2**: Enter college details (name, logo, chairman, contacts)
4. **Step 3**: Select courses from university's course list
5. Save

### Enabling White-Label (Partner Mode)

1. Go to **Partnered Colleges**
2. Toggle partnership status for a college
3. Click **Preview as College** to see white-label experience
4. Platform transforms dynamically:
   - Logo changes
   - App name changes
   - Only college's courses shown
5. Click **Exit Preview** to return to admin view

---

## 🎨 Design System

### Colors
- **Primary**: `#29B6F6` (Cyan) - Interactive elements
- **Accent**: `#F44336` (Red) - CTAs, launch moments
- **Background**: `#0F172A` (Dark slate)
- **Surface**: `#111827` (Card backgrounds)

### Typography
- **Headings**: Inter / Sora
- **Body**: Inter
- **Metrics**: Space Grotesk (optional)

### Visual Rules
- Dark-first UI
- Cyan glow for interactive elements
- Red only for launch moments/CTAs
- No heavy shadows, use glow instead
- Rounded corners with intent
- Hover = glow, Press = subtle scale

---

## 📱 Mobile Compatibility

The admin panel is optimized for **web** but maintains React Native compatibility:

- Responsive layouts
- Touch-friendly targets (44px minimum)
- Mobile-optimized modals
- Adaptive sidebar (collapsible on mobile)

---

## 🔐 Security Considerations

1. **Role-Based Access**: Admin panel should require admin role
2. **Firestore Rules**: Implement proper security rules
3. **Data Validation**: Validate all inputs server-side
4. **File Uploads**: Secure logo/photo uploads

---

## 🛠 Services

### `services/admin-service.ts`

Provides Firebase operations:
- `getUniversities()`, `createUniversity()`, `updateUniversity()`
- `getCoursesByUniversity()`, `createCourse()`, `updateCourse()`
- `getColleges()`, `createCollege()`, `updateCollege()`
- `toggleCollegePartnership()` - Enable/disable white-label

---

## 🔄 Partner Context Flow

```
1. Admin marks college as partnered
   ↓
2. Admin clicks "Preview as College"
   ↓
3. PartnerContext.setPartnerCollege() called
   ↓
4. Context updates:
   - partnerContext.college
   - partnerContext.university
   - partnerContext.courses (filtered)
   ↓
5. Student UI reads context:
   - PartnerBranding component shows college logo
   - App name changes to "{College} Digital Library"
   - Course list filters to college's courses
   ↓
6. Admin clicks "Exit Preview"
   ↓
7. PartnerContext.clearPartnerContext()
   ↓
8. Returns to default branding
```

---

## 📝 Future Enhancements

- [ ] Bulk operations (import/export)
- [ ] Analytics dashboard
- [ ] User management
- [ ] Advanced filtering and search
- [ ] Audit logs
- [ ] Email notifications
- [ ] Custom branding themes per college
- [ ] Multi-language support

---

## 🐛 Troubleshooting

### Partner mode not working?
- Check that `PartnerProvider` wraps the app in `_layout.tsx`
- Verify `is_partnered` flag is `true` in Firestore
- Ensure college has `offered_courses` array populated

### Courses not showing for college?
- Verify college's `university_id` matches course's `university_id`
- Check that course IDs in `offered_courses` exist
- Ensure courses have `status: 'active'`

### Sidebar not appearing?
- Check that you're in `/(admin)` route group
- Verify `AdminLayout` is properly configured
- Check for console errors

---

## 📚 Related Files

- `types/admin.ts` - TypeScript interfaces
- `contexts/partner-context.tsx` - White-label context
- `services/admin-service.ts` - Firebase operations
- `components/admin/` - Admin UI components
- `app/(admin)/` - Admin routes

---

**Built with ❤️ for Cohort Launchpad**

