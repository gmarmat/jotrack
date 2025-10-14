/**
 * Standardized Color Palette for Jotrack
 * 
 * Light Theme (PRIMARY - must be perfect):
 * - Clean, professional blue-grey tones
 * - Inspired by "Add New Job Application" section
 * 
 * Dark Theme (SECONDARY - only when toggled):
 * - Consistent with light theme but darker
 * - Maintains readability and contrast
 */

export const COLORS = {
  // Backgrounds
  backgrounds: {
    main: 'bg-gradient-to-br from-blue-50 to-indigo-100 dark:bg-gradient-to-br dark:from-gray-900 dark:to-gray-800',
    card: 'bg-white dark:bg-gray-800',
    input: 'bg-white dark:bg-gray-800', // NOT gray-700!
    hover: 'bg-blue-50 dark:bg-gray-700/50',
  },

  // Text
  text: {
    header: 'text-gray-900 dark:text-gray-100',
    body: 'text-gray-700 dark:text-gray-300', // NOT gray-600 - too light
    secondary: 'text-gray-600 dark:text-gray-400',
  },

  // Borders
  borders: {
    standard: 'border-gray-200 dark:border-gray-700',
    focus: 'ring-blue-500', // same for both themes
  },

  // Interactive Elements
  interactive: {
    button: 'bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600',
    buttonSecondary: 'bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600',
  },
} as const;

/**
 * Standard form field styling
 * Use Job Title field as template
 */
export const FORM_FIELD_STYLES = `
  w-full px-3 py-2 
  border border-gray-300 dark:border-gray-600 
  rounded-md 
  focus:ring-2 focus:ring-blue-500 focus:border-transparent 
  bg-white dark:bg-gray-800 
  text-gray-900 dark:text-gray-100
`;

/**
 * Standard input classes for consistency
 */
export const INPUT_CLASSES = {
  base: FORM_FIELD_STYLES,
  textarea: `${FORM_FIELD_STYLES} resize-y`,
  select: `${FORM_FIELD_STYLES}`, // NO gradients!
} as const;

/**
 * Table styling
 */
export const TABLE_CLASSES = {
  cell: 'px-4 py-3 text-sm',
  companyText: 'text-gray-700 dark:text-gray-300', // Better readability
  rowHover: 'hover:bg-blue-50 dark:hover:bg-gray-700/30', // More subtle
} as const;

/**
 * Modal styling
 */
export const MODAL_CLASSES = {
  backdrop: 'fixed inset-0 z-50 bg-black/50',
  container: 'bg-white dark:bg-gray-800 rounded-lg shadow-lg max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col',
  header: 'flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700',
  content: 'flex-1 overflow-y-auto p-6',
} as const;

/**
 * Button variants
 */
export const BUTTON_CLASSES = {
  primary: `px-4 py-2 rounded-md text-white font-medium transition-colors ${COLORS.interactive.button}`,
  secondary: `px-4 py-2 rounded-md font-medium transition-colors ${COLORS.interactive.buttonSecondary} ${COLORS.text.body}`,
  icon: 'p-2 rounded-md transition-colors',
} as const;

/**
 * Skill Match specific colors
 */
export const SKILL_MATCH_COLORS = {
  resume: 'text-green-700 dark:text-green-400',
  profile: 'text-purple-700 dark:text-purple-400',
  bar: {
    resume: 'bg-gradient-to-b from-green-400 to-green-600 dark:from-green-500 dark:to-green-700',
    profile: 'bg-gradient-to-b from-purple-400 to-purple-600 dark:from-purple-500 dark:to-purple-700',
  },
} as const;
