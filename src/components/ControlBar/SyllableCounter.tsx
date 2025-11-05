import type { ThemeClasses } from '../../types';

interface SyllableCounterProps {
  originalCount: number;
  currentCount: number;
  theme: ThemeClasses;
}

export function SyllableCounter({ originalCount, currentCount, theme }: SyllableCounterProps) {
  return (
    <div className={`text-sm ${theme.text}`}>
      Original: <span className="font-bold">{originalCount}</span> | 
      Current: <span className="font-bold">{currentCount}</span>
    </div>
  );
}