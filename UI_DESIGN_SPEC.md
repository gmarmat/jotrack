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

**Last Updated**: 2025-10-10
**Version**: 0.3.0

