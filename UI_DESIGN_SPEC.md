# JoTrack UI Design Specification

**CRITICAL**: This file defines the UI/UX design standards. DO NOT modify the UI appearance unless explicitly requested or if fixing a clear bug.

## Design Principles
1. **Consistency**: All similar components use the same styling
2. **Minimal Changes**: Only modify UI when adding new features or fixing bugs
3. **No Arbitrary Redesigns**: Don't change colors, spacing, layouts between iterations
4. **Preserve Working UI**: If it works and looks good, leave it alone

---

## Color Palette
- **Primary**: Blue (blue-600, blue-700 for hovers)
- **Secondary**: Gray (gray-600, gray-700, gray-800)
- **Success**: Green (green-600, green-700)
- **Danger**: Red (red-600, red-700)
- **Warning**: Yellow (yellow-600, yellow-700)
- **Background**: Gradient from blue-50 to indigo-100

## Typography
- **Headings**: font-bold, text-gray-900
- **Body**: text-gray-700 or text-gray-600
- **Small Text**: text-xs or text-sm
- **Code/Mono**: font-mono

---

## Component Specifications

### Buttons

#### Primary Button (Actions)
```
className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 font-medium"
```

#### Secondary Button
```
className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
```

#### Icon Button
```
className="inline-flex items-center justify-center h-8 w-8 rounded hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-300"
```

#### Danger Button (Delete)
```
className="px-3 py-1.5 bg-red-600 text-white rounded hover:bg-red-700 text-sm"
```

### Form Elements

#### Text Input
```
className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
```

#### Select Dropdown
```
className="min-w-[140px] px-3 py-1.5 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
```
**IMPORTANT**: Select dropdowns MUST have **min-w-[140px]** or wider to prevent collapsing
**NEVER**: Use auto-width selects that create empty space to the right

#### Textarea
```
className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
```

### Cards & Containers

#### White Card
```
className="bg-white rounded-2xl shadow-lg p-6"
```

#### Section Card
```
className="bg-white rounded-xl border shadow p-6"
```

#### Modal Backdrop
```
className="fixed inset-0 z-50 flex items-center justify-center"
Backdrop: className="absolute inset-0 bg-black/50"
```

### Status Badges & Filter Chips

```tsx
// Status badges - compact padding for better text fit
className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium"

// Filter chips (status/has filters) - same compact padding
className="rounded-full px-1.5 py-1 text-xs border"

// Color mapping for status badges:
ON_RADAR: bg-amber-100 text-amber-700
APPLIED: bg-blue-100 text-blue-700
PHONE_SCREEN: bg-indigo-100 text-indigo-700
ONSITE: bg-purple-100 text-purple-700
OFFER: bg-green-100 text-green-700
REJECTED: bg-red-100 text-red-700

// Filter chip states:
Active: bg-gray-200 border-gray-400
Inactive: hover:bg-gray-50 (with border)
```

**CRITICAL**: Use `px-1.5` (6px) horizontal padding, NOT `px-2` (8px) or `px-3` (12px)
- Prevents excessive empty space around text like "Phone Screen"
- Maintains visual balance for both short ("Applied") and long status names
- Consistent across StatusBadge and FiltersBar components

### Tables

#### Table Row
```
className="border-b hover:bg-gray-50"
```

#### Table Cell
```
className="px-4 py-3 text-sm text-gray-900"
```

---

## Layout Standards

### Homepage (/)
- **Container**: max-w-7xl mx-auto px-4
- **Background**: bg-gradient-to-br from-blue-50 to-indigo-100
- **Form Section**: bg-white rounded-2xl shadow-lg p-8
- **Table Section**: bg-white rounded-xl shadow p-6

### Job Detail Page (/jobs/[id])
- **Container**: max-w-4xl mx-auto px-4
- **Header**: bg-white rounded-2xl shadow-lg p-6
- **Details Section**: bg-white rounded-xl border shadow p-6
- **Attachments Section**: 
  - MUST be below details section
  - Full width: max-w-screen-lg mx-auto
  - scroll-mt-24 for anchor scrolling
  - data-testid="attachments-section"

### Attachments Panel
- **Drop Zones**: border-2 border-dashed rounded-lg p-6
- **File Cards**: bg-gray-50 rounded-lg p-4 border
- **Versions Toggle**: text-xs text-gray-600 hover:text-gray-900
- **Versions List**: bg-blue-50 rounded p-3 border border-blue-200

---

## Spacing Standards

- **Section Gap**: space-y-6 or gap-6
- **Card Internal**: p-6 or p-4 for smaller cards
- **Button Gap**: gap-2 or space-x-2
- **Form Element Gap**: space-y-4

---

## Known Issues to NEVER Reintroduce

### ❌ Select Dropdown Left-Aligned
**Problem**: Select with fixed width left-aligned with empty space on right
**Fix**: Use `w-full` or `min-w-[200px]` with proper container

### ❌ Buttons Without Proper States
**Problem**: No disabled, hover, or focus states
**Fix**: Always include disabled:, hover:, and focus-visible: variants

### ❌ Missing Accessibility
**Problem**: Buttons without aria-label or titles
**Fix**: Every icon button MUST have aria-label AND title

### ❌ Inconsistent Icon Sizes
**Problem**: Icons of different sizes (14, 16, 18, 20px) in same context
**Fix**: Use size={16} for most icons, size={14} for very small contexts

### ❌ Excessive Badge Padding
**Problem**: Status badges with px-2 or px-3 creating too much empty space around text
**Fix**: Use px-1.5 for compact, balanced appearance across all status text lengths

---

## Testing Standards

### E2E Selectors Priority
1. **data-testid** (highest priority - most stable)
2. **aria-label** (accessibility + testing)
3. **role** + text (semantic HTML)
4. **text content** (last resort, fragile)

### Required Test IDs
- All major sections: `data-testid="<feature>-section"`
- All action buttons: `data-testid="<action>-<entity>"`
- All modals: `data-testid="<name>-modal"`
- All forms: `data-testid="<name>-form"`

---

## Change Request Process

Before making ANY UI changes:
1. ✅ Check this file for existing standards
2. ✅ Verify the change is necessary (not just preferential)
3. ✅ Update this file if introducing new patterns
4. ✅ Run visual regression tests (if available)
5. ✅ Get user approval for visual changes

---

## Privacy & AI Governance

### AI Assist Feature
- AI Assist is **gated** by Settings → "Enable AI Assist"
- **Default**: OFF
- **Privacy First**: No external network calls unless explicitly enabled by user
- API keys stored **locally only**:
  - Masked version in `localStorage` (for UI display)
  - Full key in `sessionStorage` (cleared on tab close)
  - Keys never sent to backend or external services by default
- All AI features operate in **dry-run mode** with deterministic output
- User must take explicit action to trigger any AI functionality

### Implementation Requirements
1. Check `aiEnabled()` from `@/app/lib/aiGate` before showing AI UI
2. All AI endpoints must default to dry-run/stub mode
3. Display clear privacy notices on settings page
4. Never auto-enable AI features
5. Provide clear "local only" indicators in UI

---

---

## Coach Feature Cards

### Resume Coach & Interview Coach Cards

**Purpose**: Showcase our two flagship features with clear value propositions and prerequisites

#### Available State (Prerequisites Met)
```tsx
<div className="bg-gradient-to-br from-[color1] to-[color2] rounded-2xl p-8 text-white shadow-xl">
  {/* Header with Icon */}
  <div className="flex items-center gap-3 mb-3">
    <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
      <Icon size={28} />
    </div>
    <div>
      <h3 className="text-2xl font-bold">[Feature Name]</h3>
      <p className="text-white/80 text-sm">[Phase Label]</p>
    </div>
  </div>
  
  {/* Description */}
  <p className="text-white/90 text-base mb-4 leading-relaxed">
    [Feature description with key benefits]
  </p>
  
  {/* Feature List (2x2 grid) */}
  <div className="grid grid-cols-2 gap-3 mb-6">
    <div className="flex items-center gap-2 text-sm">
      <CheckCircle2 size={16} className="flex-shrink-0" />
      <span>[Feature 1]</span>
    </div>
    {/* 3 more features */}
  </div>
  
  {/* CTA Button - Full Width */}
  <button className="w-full px-6 py-4 bg-white text-purple-600 rounded-xl font-bold text-lg 
                     hover:bg-gray-50 transition-all shadow-lg flex items-center 
                     justify-center gap-3 group">
    <Icon size={24} className="group-hover:scale-110 transition-transform" />
    <span>[Action Text]</span>
    <span className="text-2xl">→</span>
  </button>
</div>
```

#### Locked State (Prerequisites Not Met)
```tsx
<div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900/50 
                dark:to-gray-800/50 rounded-2xl p-8 border-2 border-dashed 
                border-gray-300 dark:border-gray-700 shadow-lg">
  {/* Header */}
  <div className="flex items-center gap-3 mb-4">
    <div className="p-2 bg-gray-200 dark:bg-gray-700 rounded-lg">
      <Icon size={28} className="text-gray-400 dark:text-gray-500" />
    </div>
    <div>
      <h3 className="text-2xl font-bold text-gray-700 dark:text-gray-300">[Feature Name]</h3>
      <p className="text-gray-500 dark:text-gray-400 text-sm">[Phase Label]</p>
    </div>
  </div>
  
  {/* Teaser Description */}
  <p className="text-gray-600 dark:text-gray-400 text-base mb-4 leading-relaxed">
    [Feature teaser to educate and entice user]
  </p>
  
  {/* Feature Teaser List (2x2 grid) */}
  <div className="grid grid-cols-2 gap-3 mb-4">
    <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
      <Icon size={16} className="flex-shrink-0" />
      <span>[Feature 1]</span>
    </div>
    {/* 3 more features */}
  </div>
  
  {/* Prerequisites Checklist */}
  <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border 
                  border-gray-200 dark:border-gray-700 mb-4">
    <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
      🔒 Unlock Requirements:
    </p>
    <div className="space-y-2">
      {/* Checkboxes with conditional styling */}
      <div className="flex items-center gap-2 text-sm">
        {complete ? <CheckCircle2 className="text-green-500" /> : <div className="w-4 h-4 border-2 border-gray-300 rounded" />}
        <span className={complete ? "text-green-600" : "text-gray-600"}>[Requirement]</span>
      </div>
    </div>
  </div>
  
  {/* Locked Button */}
  <button disabled className="w-full px-6 py-4 bg-gray-200 dark:bg-gray-700 
                              text-gray-500 dark:text-gray-400 rounded-xl font-bold text-lg 
                              cursor-not-allowed flex items-center justify-center gap-3">
    <span className="text-2xl">🔒</span>
    <span>Locked - Complete Prerequisites</span>
  </button>
</div>
```

#### Waiting State (Prerequisites Met, But Not Yet Applicable)
```tsx
<div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/30 
                dark:to-indigo-900/30 rounded-2xl p-8 border-2 border-blue-300 
                dark:border-blue-700 shadow-lg">
  {/* Header */}
  <div className="flex items-center gap-3 mb-4">
    <div className="p-2 bg-blue-100 dark:bg-blue-800 rounded-lg">
      <Icon size={28} className="text-blue-600 dark:text-blue-300" />
    </div>
    <div>
      <h3 className="text-2xl font-bold text-blue-900 dark:text-blue-100">[Feature Name]</h3>
      <p className="text-blue-600 dark:text-blue-300 text-sm">[Phase Label]</p>
    </div>
  </div>
  
  {/* Almost Ready Message */}
  <div className="bg-blue-100 dark:bg-blue-900/50 rounded-lg p-4 mb-4">
    <p className="text-blue-800 dark:text-blue-200 text-base font-semibold mb-2">
      ✅ Prerequisites Complete!
    </p>
    <p className="text-blue-700 dark:text-blue-300 text-sm">
      [Next step instructions]
    </p>
  </div>
  
  {/* Feature Preview (2x2 grid with checkmarks) */}
  <div className="grid grid-cols-2 gap-3 mb-6">
    <div className="flex items-center gap-2 text-sm text-blue-700 dark:text-blue-300">
      <CheckCircle2 size={16} className="flex-shrink-0" />
      <span>[Feature 1]</span>
    </div>
  </div>
  
  {/* Waiting Button */}
  <button disabled className="w-full px-6 py-4 bg-blue-200 dark:bg-blue-800 
                              text-blue-600 dark:text-blue-300 rounded-xl font-bold text-lg 
                              cursor-not-allowed flex items-center justify-center gap-3">
    <span className="text-2xl">⏳</span>
    <span>[Waiting Message]</span>
  </button>
</div>
```

**Design Principles**:
- **Three Clear States**: Locked → Waiting → Available
- **Educational**: Locked state teases features and shows prerequisites
- **Encouraging**: Waiting state celebrates progress and shows next step
- **Actionable**: Available state has prominent CTA with hover animation
- **Consistent Layout**: All states use similar structure for familiarity
- **Visual Hierarchy**: Icon + Title → Description → Features → CTA
- **Full-Width Buttons**: Coach CTAs use full width for prominence

**Color Schemes**:
- Resume Coach (Available): `from-green-500 to-emerald-500` (success gradient)
- Interview Coach (Available): `from-purple-600 to-blue-600` (action gradient)
- Locked State: Gray with dashed border (neutral, disabled)
- Waiting State: Blue gradient with solid border (progress, almost ready)

### Question Management (Interview Coach)

#### Question Selection Checkboxes
```css
/* Selected question styling */
.ring-2.ring-yellow-400

/* Checkbox styling */
.w-4.h-4.text-yellow-400.bg-white/20.border-white/30.rounded
```

#### Custom Question Badges
```css
/* Custom badge */
.bg-purple-500.text-white.text-xs.rounded-full

/* Category badge */
.bg-blue-500.text-white.text-xs.rounded-full
```

#### Question Management Buttons
```css
/* Add Custom Question */
.bg-yellow-400.text-purple-600.hover:bg-yellow-300

/* Continue Button */
.bg-white.text-purple-600.hover:bg-purple-50
```

---

**Last Updated**: 2025-10-21
**Version**: 0.4.0

