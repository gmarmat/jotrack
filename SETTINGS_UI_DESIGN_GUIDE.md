# Settings UI Design Guide

**Version**: 2.7  
**Last Updated**: October 15, 2025  
**Purpose**: Consistent dark mode styling across all Settings tabs

---

## Design Principles

1. **Readability First**: High contrast in both light and dark modes
2. **Consistency**: Same patterns for similar elements
3. **Visual Hierarchy**: Clear headings, sections, and actions
4. **Accessibility**: Proper focus states and color contrast ratios

---

## Color Palette

### Light Mode
- **Background**: `bg-white`
- **Surface**: `bg-gray-50`
- **Borders**: `border-gray-200` / `border-gray-300`
- **Text Primary**: `text-gray-900`
- **Text Secondary**: `text-gray-600` / `text-gray-700`
- **Text Muted**: `text-gray-500`

### Dark Mode
- **Background**: `dark:bg-gray-800`
- **Surface**: `dark:bg-gray-700/30`
- **Borders**: `dark:border-gray-600` / `dark:border-gray-700`
- **Text Primary**: `dark:text-gray-100`
- **Text Secondary**: `dark:text-gray-300` / `dark:text-gray-400`
- **Text Muted**: `dark:text-gray-500`

---

## Component Patterns

### Modal Container
```tsx
<div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
```

### Modal Header
```tsx
<div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
  <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Settings</h2>
  <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors text-gray-600 dark:text-gray-400">
    <X size={24} />
  </button>
</div>
```

### Tab Buttons
```tsx
<button
  className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
    active
      ? 'border-blue-600 dark:border-blue-400 text-blue-600 dark:text-blue-400'
      : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:border-gray-300 dark:hover:border-gray-600'
  }`}
>
  Tab Name
</button>
```

### Section Header (h3)
```tsx
<h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2 flex items-center gap-2">
  <Icon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
  Section Title
</h3>
<p className="text-sm text-gray-600 dark:text-gray-400">
  Description text
</p>
```

### Subsection Header (h4)
```tsx
<h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">
  Subsection Title
</h4>
<p className="text-xs text-gray-600 dark:text-gray-400">
  Description
</p>
```

### Card/Panel Container
```tsx
<div className="p-4 bg-gray-50 dark:bg-gray-700/30 border border-gray-200 dark:border-gray-600 rounded-lg">
  {/* Content */}
</div>
```

### Colored Info Boxes

#### Blue (Info)
```tsx
<div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
  <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-300">Title</h4>
  <p className="text-xs text-blue-700 dark:text-blue-400">Description</p>
</div>
```

#### Purple (Special Action)
```tsx
<div className="p-4 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg">
  <h4 className="text-sm font-semibold text-purple-900 dark:text-purple-300">Title</h4>
  <p className="text-xs text-purple-700 dark:text-purple-400">Description</p>
</div>
```

#### Green (Success/Export)
```tsx
<div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
  <h4 className="text-sm font-semibold text-green-900 dark:text-green-300">Title</h4>
  <p className="text-xs text-green-700 dark:text-green-400">Description</p>
</div>
```

#### Red (Danger)
```tsx
<div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
  <h4 className="text-sm font-semibold text-red-900 dark:text-red-300">Title</h4>
  <p className="text-xs text-red-800 dark:text-red-300">Description</p>
</div>
```

#### Orange/Yellow (Warning)
```tsx
<div className="p-4 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg">
  <h4 className="text-sm font-semibold text-orange-900 dark:text-orange-300">Title</h4>
  <p className="text-xs text-orange-700 dark:text-orange-400">Description</p>
</div>
```

---

## Form Elements

### Text Input
```tsx
<input
  type="text"
  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
  placeholder="Enter text..."
/>
```

### Password Input (with mask for existing value)
```tsx
{/* When value exists */}
<div className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700/50 text-gray-600 dark:text-gray-400">
  ••••••••••••••••••••••••••
</div>

{/* When editing */}
<input
  type="password"
  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
/>
```

### Select Dropdown
```tsx
<select className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent">
  <option value="1">Option 1</option>
  <option value="2">Option 2</option>
</select>
```

### Checkbox
```tsx
<input 
  type="checkbox" 
  className="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-2 focus:ring-blue-500" 
/>
```

### Toggle Switch
```tsx
<button
  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
    enabled ? 'bg-green-600' : 'bg-gray-300 dark:bg-gray-600'
  }`}
>
  <span
    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
      enabled ? 'translate-x-6' : 'translate-x-1'
    }`}
  />
</button>
```

---

## Buttons

### Primary Button
```tsx
<button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
  Primary Action
</button>
```

### Secondary Button (Outline)
```tsx
<button className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50">
  Secondary Action
</button>
```

### Danger Button
```tsx
<button className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors">
  Delete
</button>
```

### Link Button
```tsx
<button className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300">
  Change
</button>
```

---

## Dividers

### Standard Divider
```tsx
<div className="border-t border-gray-200 dark:border-gray-700"></div>
```

### Section Divider (with spacing)
```tsx
<div className="pt-6 border-t border-gray-200 dark:border-gray-700">
  {/* Next section */}
</div>
```

### Danger Divider
```tsx
<div className="pt-6 border-t border-red-200 dark:border-red-800">
  {/* Danger zone */}
</div>
```

---

## Feedback Messages

### Success
```tsx
<div className="p-3 rounded-md bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-300 border border-green-200 dark:border-green-700">
  Success message
</div>
```

### Error
```tsx
<div className="p-3 rounded-md bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-300 border border-red-200 dark:border-red-700">
  Error message
</div>
```

### Warning
```tsx
<div className="p-3 rounded-md bg-orange-50 dark:bg-orange-900/20 text-orange-800 dark:text-orange-300 border border-orange-200 dark:border-orange-800">
  Warning message
</div>
```

### Info
```tsx
<div className="p-3 rounded-md bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-700">
  Info message
</div>
```

---

## Complete Example: New Settings Tab

```tsx
function ExampleTab() {
  const [setting, setSetting] = useState('');
  const [saveResult, setSaveResult] = useState<{ success: boolean; message: string } | null>(null);

  const handleSave = async () => {
    // Save logic
  };

  return (
    <div className="space-y-6">
      {/* Section Header */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2 flex items-center gap-2">
          <Icon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          Section Title
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Section description
        </p>
      </div>

      {/* Info Card */}
      <div className="p-4 bg-gray-50 dark:bg-gray-700/30 border border-gray-200 dark:border-gray-600 rounded-lg">
        <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">
          Card Title
        </h4>
        <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">
          Card description
        </p>
        
        {/* Form Element */}
        <input
          type="text"
          value={setting}
          onChange={(e) => setSetting(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="Enter value..."
        />
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3">
        <button
          onClick={handleSave}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          Save
        </button>
        <button className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
          Cancel
        </button>
      </div>

      {/* Feedback Message */}
      {saveResult && (
        <div className={`p-3 rounded-md ${
          saveResult.success 
            ? 'bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-300 border border-green-200 dark:border-green-700' 
            : 'bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-300 border border-red-200 dark:border-red-700'
        }`}>
          {saveResult.message}
        </div>
      )}

      {/* Section Divider */}
      <div className="pt-6 border-t border-gray-200 dark:border-gray-700">
        <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">
          Next Section
        </h4>
      </div>
    </div>
  );
}
```

---

## Quick Reference Table

| Element | Light Mode | Dark Mode |
|---------|-----------|-----------|
| **Backgrounds** |
| Modal | `bg-white` | `dark:bg-gray-800` |
| Panel/Card | `bg-gray-50` | `dark:bg-gray-700/30` |
| Input | `bg-white` | `dark:bg-gray-800` |
| Disabled Input | `bg-gray-50` | `dark:bg-gray-700/50` |
| **Borders** |
| Standard | `border-gray-200` | `dark:border-gray-700` |
| Input | `border-gray-300` | `dark:border-gray-600` |
| Colored (blue) | `border-blue-200` | `dark:border-blue-800` |
| **Text** |
| Heading (h3) | `text-gray-900` | `dark:text-gray-100` |
| Subheading (h4) | `text-gray-900` | `dark:text-gray-100` |
| Body | `text-gray-700` | `dark:text-gray-300` |
| Description | `text-gray-600` | `dark:text-gray-400` |
| Muted | `text-gray-500` | `dark:text-gray-500` |
| Placeholder | `text-gray-400` | `dark:text-gray-500` |
| **Icons** |
| Primary | `text-blue-600` | `dark:text-blue-400` |
| Secondary | `text-gray-700` | `dark:text-gray-400` |
| Success | `text-green-600` | `dark:text-green-400` |
| Danger | `text-red-600` | `dark:text-red-400` |

---

## Opacity Patterns

For colored backgrounds in dark mode, use `/20` opacity:
- `bg-blue-900/20` - Subtle blue tint
- `bg-purple-900/20` - Subtle purple tint
- `bg-green-900/20` - Subtle green tint
- `bg-red-900/20` - Subtle red tint

For neutral surfaces, use `/30`:
- `bg-gray-700/30` - Subtle gray panel

---

## Focus States

All interactive elements should have focus states:
```tsx
focus:ring-2 focus:ring-blue-500 focus:border-transparent
```

---

## Transition Effects

Add smooth transitions to all interactive elements:
```tsx
transition-colors
```

For buttons with multiple states:
```tsx
hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors
```

---

## Icon Colors

Match icon color to context:
- **Section headers**: Blue (`text-blue-600 dark:text-blue-400`)
- **Neutral actions**: Gray (`text-gray-700 dark:text-gray-400`)
- **Success actions**: Green (`text-green-600 dark:text-green-400`)
- **Danger actions**: Red (`text-red-600 dark:text-red-400`)
- **Special actions**: Purple (`text-purple-600 dark:text-purple-400`)

---

## Spacing Guidelines

### Vertical Spacing
- **Between sections**: `space-y-6`
- **Within section**: `space-y-4`
- **Within card**: `mb-2` (title), `mb-3` (description)
- **Before divider**: `pt-6`

### Padding
- **Modal content**: `p-6`
- **Card/Panel**: `p-4`
- **Small padding**: `p-3`
- **Input**: `px-3 py-2`
- **Button**: `px-4 py-2`

---

## Accessibility Checklist

When creating new components:
- [ ] All interactive elements have focus states
- [ ] Color contrast ratio ≥ 4.5:1 (text on background)
- [ ] Icon-only buttons have `aria-label`
- [ ] Form inputs have associated `<label>` or `aria-label`
- [ ] Disabled states are visually clear
- [ ] Loading states show appropriate feedback
- [ ] Error messages are clear and actionable

---

## Testing Checklist

Before committing new Settings UI:
- [ ] Test in light mode
- [ ] Test in dark mode
- [ ] Test hover states
- [ ] Test focus states (Tab navigation)
- [ ] Test disabled states
- [ ] Test on different screen sizes
- [ ] Verify readability (esp. dark mode)

---

## Common Mistakes to Avoid

❌ **Don't**: Mix light/dark styles
```tsx
<div className="bg-gray-50 text-gray-900">  {/* Missing dark: prefix */}
```

✅ **Do**: Always pair light and dark
```tsx
<div className="bg-gray-50 dark:bg-gray-700/30 text-gray-900 dark:text-gray-100">
```

❌ **Don't**: Use pure white text in dark mode
```tsx
<p className="text-white">  {/* Too harsh */}
```

✅ **Do**: Use gray-100 for softer look
```tsx
<p className="text-gray-900 dark:text-gray-100">
```

❌ **Don't**: Forget borders on dark backgrounds
```tsx
<div className="bg-gray-700">  {/* No visual separation */}
```

✅ **Do**: Always add borders for definition
```tsx
<div className="bg-gray-700/30 border border-gray-600">
```

---

## Copy-Paste Templates

### Standard Settings Card
```tsx
<div className="p-4 bg-gray-50 dark:bg-gray-700/30 border border-gray-200 dark:border-gray-600 rounded-lg">
  <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">
    Card Title
  </h4>
  <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">
    Description goes here
  </p>
  {/* Your content */}
</div>
```

### Form Field with Label
```tsx
<div>
  <label className="block text-sm font-medium text-gray-900 dark:text-gray-200 mb-2">
    Field Label
  </label>
  <input
    type="text"
    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
    placeholder="Enter value..."
  />
  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
    Helper text
  </p>
</div>
```

### Action Card with Button
```tsx
<div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
  <div className="flex items-start justify-between">
    <div>
      <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-300">Action Title</h4>
      <p className="text-xs text-blue-700 dark:text-blue-400 mt-1">
        What this action does
      </p>
    </div>
    <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
      <Icon size={16} />
      Action
    </button>
  </div>
</div>
```

---

## Implementation Notes

1. **Always pair light and dark classes** - Never add a style without its dark mode counterpart
2. **Use opacity for colored backgrounds** - `/20` for most, `/30` for neutral grays
3. **Add transitions** - Makes UI feel polished
4. **Test both modes** - Toggle dark mode while developing
5. **Use consistent spacing** - Follow the spacing guidelines above

---

## Future Enhancements

- [ ] Add motion/animation guidelines
- [ ] Add responsive breakpoint patterns
- [ ] Add loading skeleton patterns
- [ ] Add toast notification styles
- [ ] Add modal backdrop patterns

---

**Status**: ✅ Production Ready  
**Applied to**: AI, Data, Preferences, Developer tabs  
**Next**: Apply to any new tabs or settings panels

