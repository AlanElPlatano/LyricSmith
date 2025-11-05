import type { ThemeClasses } from '../../types';

interface TextImportAreaProps {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  theme: ThemeClasses;
}

export function TextImportArea({ value, onChange, placeholder, theme }: TextImportAreaProps) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={`w-full h-32 p-2 border ${theme.border} rounded text-sm ${theme.inputBackground} ${theme.text}`}
      placeholder={placeholder}
    />
  );
}