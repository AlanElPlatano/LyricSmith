import type { ThemeClasses } from '../types';

export function useTheme(darkMode: boolean): ThemeClasses {
  return {
    background: darkMode ? 'bg-gray-900' : 'bg-white',
    text: darkMode ? 'text-gray-100' : 'text-gray-900',
    textMuted: darkMode ? 'text-gray-400' : 'text-gray-600',
    cardBackground: darkMode ? 'bg-gray-800' : 'bg-gray-50',
    border: darkMode ? 'border-gray-600' : 'border-gray-300',
    inputBackground: darkMode ? 'bg-gray-700' : 'bg-white',
    buttonSecondary: darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'
  };
}