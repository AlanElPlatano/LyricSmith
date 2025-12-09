import React from 'react';
import type { ThemeClasses } from '../../types';

interface SyllableButtonProps {
  children: React.ReactNode;
  variant: 'xml' | 'plain';
  theme: ThemeClasses;
  onClick?: () => void;
  disabled?: boolean;
  showHyphen?: boolean;
}

export function SyllableButton({ children, variant, theme, onClick, disabled, showHyphen }: SyllableButtonProps) {
  const variantClasses = {
    xml: (isDark: boolean) => isDark ? 'bg-gray-700 hover:bg-gray-600' : 'bg-blue-100 hover:bg-blue-200',
    plain: (isDark: boolean) => isDark ? 'bg-gray-800 hover:bg-gray-700' : 'bg-green-100 hover:bg-green-200'
  };

  const isDarkMode = theme.background.includes('gray-900');
  const bgClass = variantClasses[variant](isDarkMode);
  const cursorClass = disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer';

  const displayText = variant === 'plain' && showHyphen
    ? `${children}-`
    : children;

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`px-3 py-2 ${bgClass} ${theme.text} rounded border ${theme.border} font-mono text-sm whitespace-nowrap ${cursorClass} transition-colors`}
    >
      {displayText}
    </button>
  );
}