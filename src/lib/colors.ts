/**
 * DentaBase Color Palette
 * 
 * Use these color values consistently throughout the application
 */

export const colors = {
  // Primary Colors
  primary: {
    DEFAULT: '#573d82',      // Deep Purple - Main brand color
    foreground: '#ffffff',   // White text on primary
  },
  
  // Secondary Colors  
  secondary: {
    DEFAULT: '#9b89b3',      // Light Purple - Secondary actions, borders
    foreground: '#ffffff',   // White text on secondary
  },
  
  // Accent Colors
  accent: {
    DEFAULT: '#e8d5b5',      // Light Beige - Highlights, cards
    foreground: '#573d82',   // Primary text on accent
  },
  
  // Warning/Alert Colors
  warning: {
    DEFAULT: '#dfaf38',      // Golden Yellow - Important alerts
    foreground: '#ffffff',   // White text on warning
  },
  
  // Background Colors
  background: {
    DEFAULT: '#ffffff',      // White - Main background
    secondary: '#fff6ff',    // Very Light Pink - Card backgrounds
  },
  
  // Text Colors
  foreground: {
    DEFAULT: '#573d82',      // Primary text color
    muted: '#9b89b3',        // Secondary text color
  },
  
  // Border Colors
  border: {
    DEFAULT: '#9b89b3',      // Light Purple - Default borders
    light: '#9b89b3/30',     // Light Purple with opacity
  }
} as const;

/**
 * Tailwind CSS class utilities for consistent styling
 */
export const colorClasses = {
  // Backgrounds
  'bg-primary': 'bg-[#573d82]',
  'bg-secondary': 'bg-[#9b89b3]', 
  'bg-accent': 'bg-[#e8d5b5]',
  'bg-warning': 'bg-[#dfaf38]',
  'bg-card': 'bg-[#fff6ff]',
  
  // Text Colors
  'text-primary': 'text-[#573d82]',
  'text-secondary': 'text-[#9b89b3]',
  'text-accent': 'text-[#e8d5b5]', 
  'text-warning': 'text-[#dfaf38]',
  'text-white': 'text-white',
  
  // Border Colors
  'border-primary': 'border-[#573d82]',
  'border-secondary': 'border-[#9b89b3]',
  'border-light': 'border-[#9b89b3]/30',
  
  // Gradients
  'gradient-primary': 'bg-gradient-to-br from-[#fff6ff] via-[#ffffff] to-[#e8d5b5]/20',
  'gradient-card': 'bg-gradient-to-br from-[#fff6ff]/80 to-[#ffffff]',
} as const;