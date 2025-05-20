export const theme = {
  colors: {
    primary: '#008080', // Teal
    primaryLight: '#E0F2F1',
    secondary: '#10B981',
    secondaryLight: '#E6F7EF',
    warning: '#F59E0B',
    error: '#EF4444',
    gray: {
      50: '#FAFAFA',
      100: '#F3F4F6',
      200: '#E5E7EB',
      300: '#D1D5DB',
      400: '#9CA3AF',
      500: '#6B7280',
      600: '#4B5563',
      700: '#374151',
      800: '#1A1A1A',
    },
    background: '#FFFFFF',
    surface: '#FAFAFA',
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
  },
  borderRadius: {
    sm: 4,
    md: 8,
    lg: 12,
    full: 9999,
  },
  typography: {
    fontFamily: {
      regular: 'System',
      medium: 'System',
      semibold: 'System', 
      bold: 'System',
    },
    fontSize: {
      xs: 10,
      sm: 13,
      base: 15,
      lg: 17,
      xl: 20,
      '2xl': 24,
    },
  },
} as const;

export type Theme = typeof theme;