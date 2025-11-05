import type { ThemeClasses } from '../../types';
import { SyllableButton } from './SyllableButton';

interface SyllableRowProps {
  syllables: string[];
  variant: 'xml' | 'plain';
  theme: ThemeClasses;
  widths?: number[];
  onSyllableClick?: (index: number) => void;
}

export function SyllableRow({ syllables, variant, theme, widths, onSyllableClick }: SyllableRowProps) {
  return (
    <div className="flex flex-wrap gap-1">
      {syllables.map((syllable, index) => {
        const isLastSyllable = index === syllables.length - 1;
        
        return (
          <div 
            key={`${variant}-${index}`} 
            className="inline-flex justify-center items-center"
            style={widths ? { minWidth: `${widths[index]}px` } : undefined}
          >
            <SyllableButton 
              variant={variant} 
              theme={theme}
              onClick={onSyllableClick ? () => onSyllableClick(index) : undefined}
              disabled={isLastSyllable}
            >
              {syllable}
            </SyllableButton>
          </div>
        );
      })}
    </div>
  );
}