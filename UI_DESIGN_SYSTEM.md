# JoTrack UI Design System - v2.7

## 🎨 Color Palette & Theme Guidelines

### Section-Specific Gradient Backgrounds

Each analysis section has a unique, tasteful gradient that matches its icon and purpose:

```tsx
// 1. Match Score - Purple/Blue (Target icon)
className="bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 
           border border-purple-200 dark:border-purple-800"

// 2. Skill Match - Amber/Yellow (Lightbulb icon 💡)
className="bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-amber-900/20 dark:to-yellow-900/20 
           border border-amber-200 dark:border-amber-800"

// 3. Company Intelligence - Indigo/Blue (Building icon 🏢)
className="bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-indigo-900/20 dark:to-blue-900/20 
           border border-indigo-200 dark:border-indigo-800"

// 4. Company Ecosystem - Emerald/Green (Growth/Market theme 📈)
className="bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-900/20 dark:to-green-900/20 
           border border-emerald-200 dark:border-emerald-800"

// 5. People Profiles - Cyan/Blue (Users icon 👥)
// Main container:
className="bg-gradient-to-br from-cyan-50 to-blue-50 dark:from-cyan-900/20 dark:to-blue-900/20 
           border border-cyan-200 dark:border-cyan-800"

// Individual profile cards (rotate through 4 colors):
const bgColors = [
  'bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/10 dark:to-indigo-900/10 border-blue-200 dark:border-blue-900/30',
  'bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/10 dark:to-pink-900/10 border-purple-200 dark:border-purple-900/30',
  'bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/10 dark:to-emerald-900/10 border-green-200 dark:border-green-900/30',
  'bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/10 dark:to-orange-900/10 border-amber-200 dark:border-amber-900/30',
];

// 6. Match Matrix - Neutral (uses FitTable's own bg-white/dark)
className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700"
```

### Universal Text Colors (Ecosystem Standard)

**Use these across ALL sections for consistency:**

```tsx
// Headers (h1, h2, h3, h4, h5)
className="text-gray-900 dark:text-gray-100"

// Body text (paragraphs, labels)
className="text-gray-700 dark:text-gray-300"

// Muted/secondary text (descriptions, metadata)
className="text-gray-600 dark:text-gray-400"

// Disabled/placeholder text
className="text-gray-500 dark:text-gray-400"
```

### Border Colors

```tsx
// Standard borders
className="border-gray-200 dark:border-gray-700"

// Gradient-specific borders (match section background)
className="border-purple-200 dark:border-purple-800"  // Match Score
className="border-amber-200 dark:border-amber-800"    // Skill Match
className="border-indigo-200 dark:border-indigo-800"  // Company Intelligence
className="border-emerald-200 dark:border-emerald-800" // Ecosystem
className="border-cyan-200 dark:border-cyan-800"      // People Profiles
```

### Background Colors for Sub-Elements

```tsx
// Neutral sub-sections
className="bg-gray-50 dark:bg-gray-900/50"

// Colored badges/pills
className="bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400"
className="bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400"
className="bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400"
className="bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400"
className="bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400"

// Provider/status badges
className="bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400"  // AI Powered
className="bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300"        // Non-AI
```

---

## 📐 Standard Section Structure

### Template for All Analysis Sections

```tsx
<div className="bg-gradient-to-br from-{color}-50 to-{color2}-50 dark:from-{color}-900/20 dark:to-{color2}-900/20 
                rounded-lg border border-{color}-200 dark:border-{color}-800 p-6">
  
  {/* 1. HEADER - Always */}
  <div className="flex items-center justify-between mb-4">
    <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
      <Icon size={18} className="text-{color}-600" />
      Section Title
    </h3>
    
    <div className="flex items-center gap-2">
      {/* Sample Data Badge (if not AI-powered) */}
      {!isAiPowered && (
        <span className="text-xs bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 px-2 py-1 rounded">
          Sample Data
        </span>
      )}
      
      {/* Action Buttons */}
      <AnalyzeButton onAnalyze={handleAnalyze} isAnalyzing={isAnalyzing} label="Analyze {Section}" />
      <PromptViewer promptKind="{kind}" version="v1" buttonLabel="" 
                    className="px-2 py-1.5 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700" />
      <SourcesButton onClick={() => setShowSourcesModal(true)} />
    </div>
  </div>

  {/* 2. ERROR STATE (if applicable) */}
  {error && (
    <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 
                    rounded-md text-sm text-red-800 dark:text-red-400">
      <strong>Error:</strong> {error}
    </div>
  )}

  {/* 3. LOADING STATE (if applicable) */}
  {isAnalyzing && !data && <LoadingShimmerCard />}

  {/* 4. MAIN CONTENT */}
  {(!isAnalyzing || data) && (
    <>
      {/* Your section-specific content here */}
      <div>
        {/* Tables, cards, charts, etc. */}
      </div>

      {/* 5. ANALYSIS EXPLANATION - Always 2nd Last */}
      <AnalysisExplanation>
        <p>
          Overview of what this section does and why it's useful...
        </p>
        
        <div>
          <p className="font-semibold mb-2">Our Analysis Methodology:</p>
          <ul className="space-y-1 text-xs">
            <li>• Data source 1: Description</li>
            <li>• Data source 2: Description</li>
            <li>• Data source 3: Description</li>
          </ul>
        </div>
        
        <div>
          <p className="font-semibold mb-2">What Each Metric Means:</p>
          <ul className="space-y-1 text-xs">
            <li>• <strong>Metric 1</strong>: Explanation</li>
            <li>• <strong>Metric 2</strong>: Explanation</li>
          </ul>
        </div>
        
        <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">
          Note: Additional context or disclaimers...
        </p>
      </AnalysisExplanation>

      {/* 6. WHY THIS MATTERS - Always Last */}
      <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
        <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Why this matters:</p>
        <p className="text-xs text-gray-600 dark:text-gray-400">
          High-level explanation of business value and how user should use this information...
        </p>
      </div>
    </>
  )}
</div>
```

---

## 🔤 Typography Standards

### Font Sizes

```tsx
// Page title (h1)
className="text-2xl font-bold"

// Section title (h2)
className="text-lg font-semibold"

// Subsection title (h3)
className="text-base font-semibold"

// Card/component title (h4, h5)
className="text-sm font-semibold"

// Body text
className="text-sm"

// Detail/metadata text
className="text-xs"

// Why this matters / explanations
className="text-xs"
```

### Font Weights

```tsx
// Titles: font-bold or font-semibold
// Body: (default) or font-medium
// Emphasis: font-semibold
// Muted: (default)
```

---

## 🌙 Dark Mode Pattern

### Core Principle
Every color class MUST have a dark mode variant. Never use single colors without `dark:` prefix.

### Standard Patterns

```tsx
// Backgrounds
bg-white → bg-white dark:bg-gray-800
bg-gray-50 → bg-gray-50 dark:bg-gray-900/50
bg-gray-100 → bg-gray-100 dark:bg-gray-800

// Gradients (use /20 opacity for dark)
from-purple-50 to-blue-50 → dark:from-purple-900/20 dark:to-blue-900/20

// Borders
border-gray-200 → border-gray-200 dark:border-gray-700
border-purple-200 → border-purple-200 dark:border-purple-800

// Text
text-gray-900 → text-gray-900 dark:text-gray-100
text-gray-700 → text-gray-700 dark:text-gray-300
text-gray-600 → text-gray-600 dark:text-gray-400
text-gray-500 → text-gray-500 dark:text-gray-400

// Colored text
text-blue-700 → text-blue-700 dark:text-blue-400
text-green-700 → text-green-700 dark:text-green-400
text-red-800 → text-red-800 dark:text-red-400

// Colored backgrounds
bg-blue-50 → bg-blue-50 dark:bg-blue-900/20
bg-green-100 → bg-green-100 dark:bg-green-900/30
```

### Testing Checklist
- [ ] Toggle dark mode in browser
- [ ] Check all text is readable (contrast ratio ≥ 4.5:1)
- [ ] Verify borders are visible but subtle
- [ ] Ensure gradients don't overpower content
- [ ] Test all interactive states (hover, disabled, active)

---

## 🧩 Reusable Components

### AnalysisExplanation

**Location**: `app/components/ui/AnalysisExplanation.tsx`

**Usage**:
```tsx
import AnalysisExplanation from '@/app/components/ui/AnalysisExplanation';

<AnalysisExplanation defaultExpanded={false}>
  <p>Overview paragraph...</p>
  
  <div>
    <p className="font-semibold mb-2">Section Title:</p>
    <ul className="space-y-1 text-xs">
      <li>• Item 1</li>
      <li>• Item 2</li>
    </ul>
  </div>
  
  <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">
    Note: Additional context...
  </p>
</AnalysisExplanation>
```

**Position**: Always 2nd last (before "Why this matters" footer)

**Features**:
- Collapsible by default
- Blue background box
- Standard "Explain: Our analysis approach" label
- Full dark mode support

---

## 📊 Standard Section Components

### 1. Header Pattern

```tsx
<div className="flex items-center justify-between mb-4">
  {/* Left: Title + Badge */}
  <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
    <Icon size={18} className="text-{color}-600" />
    Section Title
  </h3>
  
  {/* Right: Actions */}
  <div className="flex items-center gap-2">
    {!isAiPowered && (
      <span className="text-xs bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 px-2 py-1 rounded">
        Sample Data
      </span>
    )}
    <AnalyzeButton onAnalyze={handleAnalyze} isAnalyzing={isAnalyzing} label="Analyze Section" />
    <PromptViewer promptKind="section" version="v1" buttonLabel="" 
                  className="px-2 py-1.5 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700" />
  </div>
</div>
```

### 2. Footer Pattern

```tsx
{/* Analysis Explanation - 2nd Last */}
<AnalysisExplanation>
  {/* Content as shown above */}
</AnalysisExplanation>

{/* Why This Matters - Last */}
<div className="pt-4 border-t border-gray-200 dark:border-gray-700">
  <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Why this matters:</p>
  <p className="text-xs text-gray-600 dark:text-gray-400">
    Business value explanation...
  </p>
</div>
```

### 3. Tables Pattern

```tsx
<div className="overflow-x-auto">
  <table className="w-full text-sm border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
    <thead className="bg-gray-50 dark:bg-gray-800">
      <tr>
        <th className="px-4 py-3 text-left font-semibold text-gray-900 dark:text-gray-100">Column 1</th>
        <th className="px-4 py-3 text-left font-semibold text-gray-900 dark:text-gray-100">Column 2</th>
      </tr>
    </thead>
    <tbody>
      <tr className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-900">
        <td className="px-4 py-3 text-gray-700 dark:text-gray-300">Data 1</td>
        <td className="px-4 py-3 text-gray-700 dark:text-gray-300">Data 2</td>
      </tr>
    </tbody>
  </table>
</div>
```

### 4. Modal Pattern

```tsx
{/* Prevent body scroll when open */}
useEffect(() => {
  if (isOpen) {
    document.body.style.overflow = 'hidden';
  } else {
    document.body.style.overflow = 'unset';
  }
  
  return () => {
    document.body.style.overflow = 'unset';
  };
}, [isOpen]);

// Modal container
<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
  <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl w-[95vw] h-[90vh] overflow-hidden flex flex-col">
    {/* Header */}
    <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Modal Title</h2>
      <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg">
        <X size={24} />
      </button>
    </div>
    
    {/* Content (scrollable) */}
    <div className="flex-1 overflow-y-auto p-6">
      {/* Content here */}
    </div>
  </div>
</div>
```

---

## 🎯 Icon Guidelines

### Section Icons

Match icon to section theme and use appropriate color:

```tsx
<Target size={18} className="text-purple-600" />      // Match Score (aim/goal)
<Lightbulb size={18} className="text-amber-600" />    // Skill Match (insight)
<Building2 size={18} className="text-indigo-600" />   // Company Intelligence (business)
<TrendingUp size={18} className="text-emerald-600" /> // Ecosystem (growth/market)
<Users size={18} className="text-cyan-600" />         // People Profiles (team)
```

### Standard Icons Library

```tsx
import { 
  // Section headers
  Target, Lightbulb, Building2, TrendingUp, Users,
  
  // Actions
  RefreshCw, Download, ExternalLink, Maximize2,
  
  // States
  ChevronDown, ChevronUp, Info, AlertCircle,
  
  // Special
  Sparkles, Settings, Zap, Clock
} from 'lucide-react';
```

---

## 📏 Spacing & Layout

### Standard Spacing

```tsx
// Section padding
p-6  // Main sections

// Vertical spacing between elements
space-y-3  // Related items
space-y-4  // Subsections
space-y-6  // Major sections

// Margins
mb-4  // After headers
mb-6  // Between major sections
mt-4  // Before footers

// Grid gaps
gap-4  // Standard grid gap
gap-6  // Larger sections
```

### Responsive Layout

```tsx
// Two-column layouts
className="grid grid-cols-1 md:grid-cols-2 gap-6"

// Flexible wrapping
className="flex flex-wrap gap-3"

// Full-width sections
className="w-full"
```

---

## 🔘 Interactive Elements

### Buttons

```tsx
// Primary action button (handled by AnalyzeButton component)
<AnalyzeButton 
  onAnalyze={handleAnalyze}
  isAnalyzing={isAnalyzing}
  label="Analyze Section"
/>

// Secondary button
className="px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-md 
           hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"

// Icon-only button
className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"

// Text button (links)
className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
```

### Form Elements

```tsx
// Input fields
className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md 
           bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100
           focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"

// Select dropdowns
className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md 
           bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
```

---

## 📊 Data Visualization

### Score Display

```tsx
// Large score (72%)
<div className="text-5xl font-bold text-{color}-600">
  {score}%
</div>

// Small score with color coding
<span className={`text-lg font-bold ${
  score >= 85 ? 'text-green-600 dark:text-green-400' :
  score >= 70 ? 'text-blue-600 dark:text-blue-400' :
  'text-yellow-600 dark:text-yellow-400'
}`}>
  {score}%
</span>
```

### Badges & Pills

```tsx
// Status badge
className="px-2 py-1 rounded text-xs font-medium 
           bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400"

// Category badge
className="px-2 py-1 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 
           text-xs rounded-md border border-blue-200 dark:border-blue-800"
```

### Stars/Ratings

```tsx
// 5-star rating
const renderStars = (score: number) => '★'.repeat(score) + '☆'.repeat(5 - score);

<div className="text-orange-600 dark:text-orange-400 font-mono">
  {renderStars(score)}
</div>
```

---

## 🎨 Choosing Colors for New Sections

### Decision Framework

1. **Match Icon**: Choose gradient that complements the section's icon
2. **Color Psychology**:
   - Purple/Blue: Analysis, intelligence, data
   - Green/Emerald: Growth, success, progress
   - Amber/Yellow: Learning, insight, caution
   - Indigo/Blue: Business, professional, trust
   - Cyan/Teal: Communication, people, collaboration
   - Red/Pink: Warnings, errors, alerts

3. **Avoid Conflicts**: Don't reuse existing section colors
4. **Test Readability**: Ensure `text-gray-700 dark:text-gray-300` is readable on chosen background
5. **Keep Subtle**: Use 50-level colors in light mode, 900/20 in dark mode

### Available Gradient Combinations (Not Yet Used)

```tsx
// Warm tones
from-rose-50 to-pink-50 dark:from-rose-900/20 dark:to-pink-900/20
from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20

// Cool tones  
from-teal-50 to-cyan-50 dark:from-teal-900/20 dark:to-cyan-900/20
from-sky-50 to-blue-50 dark:from-sky-900/20 dark:to-blue-900/20

// Neutral with accent
from-slate-50 to-gray-50 dark:from-slate-900/20 dark:to-gray-900/20
```

---

## 📋 Component Checklist

When creating a new analysis section, ensure:

- [ ] Uses gradient background (section-specific color)
- [ ] Header with icon + title + actions (AnalyzeButton + PromptViewer)
- [ ] "Sample Data" badge when `!isAiPowered`
- [ ] Error state with red background
- [ ] Loading state with shimmer
- [ ] Main content area
- [ ] **AnalysisExplanation** component (2nd last position)
- [ ] **Why this matters** footer (last position)
- [ ] All text has dark mode variants
- [ ] All borders have dark mode variants
- [ ] All backgrounds have dark mode variants
- [ ] Tested in both light and dark modes
- [ ] Icons match color theme
- [ ] Spacing follows standards (p-6, mb-4, etc.)

---

## 🚀 Examples in Codebase

### Reference Implementations

1. **Match Matrix** (`app/components/coach/tables/FitTable.tsx`)
   - ✅ Perfect example of table with expand/collapse categories
   - ✅ Uses AnalysisExplanation with signal explanations
   - ✅ Neutral background (no gradient)

2. **Company Ecosystem** (`app/components/ai/CompanyEcosystemTableCompact.tsx`)
   - ✅ Perfect example of compact table + full modal pattern
   - ✅ Emerald/green gradient
   - ✅ Clean 5-column design
   - ✅ AnalysisExplanation with methodology

3. **Company Intelligence** (`app/components/ai/CompanyIntelligenceCard.tsx`)
   - ✅ Perfect example of two-column card layout
   - ✅ Indigo/blue gradient
   - ✅ Nested subsections with icons

4. **People Profiles** (`app/components/ai/PeopleProfilesCard.tsx`)
   - ✅ Perfect example of grid layout with rotating colors
   - ✅ Cyan/blue main, 4 gradient variants for cards
   - ✅ Two-column responsive grid

---

## 🎯 Quick Reference: Color Mapping

| Section | Icon | Gradient Colors | Border | Theme |
|---------|------|----------------|--------|-------|
| Match Score | 🎯 Target | Purple → Blue | purple-200/800 | Analysis/Data |
| Skill Match | 💡 Lightbulb | Amber → Yellow | amber-200/800 | Learning/Insight |
| Company Intelligence | 🏢 Building2 | Indigo → Blue | indigo-200/800 | Business/Trust |
| Company Ecosystem | 📈 TrendingUp | Emerald → Green | emerald-200/800 | Growth/Market |
| People Profiles | 👥 Users | Cyan → Blue | cyan-200/800 | Communication |
| Match Matrix | 📊 TrendingUp | Neutral | gray-200/700 | Data/Table |

---

## 💡 Design Principles

### 1. Consistency Over Creativity
- Follow established patterns exactly
- Don't introduce new patterns without documentation
- Reuse existing components whenever possible

### 2. Dark Mode First
- Always consider dark mode when choosing colors
- Test in dark mode immediately
- Never ship without dark mode support

### 3. Accessibility
- Maintain 4.5:1 contrast ratio minimum
- Use semantic HTML
- Include ARIA labels where needed
- Keyboard navigation support

### 4. Progressive Disclosure
- Start with compact views
- Expand to show more details
- Use modals for deep dives
- Keep critical info visible

### 5. Cost Transparency
- Always show AI cost estimates
- Display cache status when relevant
- Indicate when using sample vs. real data

---

## 📝 Version History

**v2.7 (Oct 16, 2024)**:
- ✅ Created `AnalysisExplanation` standard component
- ✅ Applied to all 4 sections
- ✅ Added gradient backgrounds to all sections
- ✅ Standardized dark mode colors
- ✅ Fixed Match Matrix duplicate frame
- ✅ Fixed prompt viewer for ecosystem + match-signals
- ✅ Updated modal scrolling behavior
- ✅ Rotating colors for People Profile cards

**Previous versions**: See `CHANGELOG.md` for full history

---

## 🔧 Maintenance

### When to Update This Guide
- Adding new section types
- Introducing new color combinations
- Creating new reusable components
- Changing typography standards
- Updating dark mode patterns

### How to Update
1. Document the change here first
2. Apply consistently across all sections
3. Test in light and dark modes
4. Update component checklist if needed
5. Add example to codebase reference

---

## 🎓 Learning Resources

### Internal Documentation
- `UI_EXPLANATION_SECTIONS_GUIDE.md` - AnalysisExplanation pattern
- `ARCHITECTURE.md` - Overall system architecture
- `UI_DESIGN_SPEC.md` - Original design specifications

### Tailwind CSS References
- [Gradients](https://tailwindcss.com/docs/gradient-color-stops)
- [Dark Mode](https://tailwindcss.com/docs/dark-mode)
- [Colors](https://tailwindcss.com/docs/customizing-colors)

---

**Last Updated**: Oct 16, 2024
**Maintained By**: Development Team
**Status**: ✅ Active - All sections standardized

