import React from 'react';
import type { ThemeClasses } from '../../types';
import { SyllableRow } from './SyllableRow';

interface LyricLineProps {
  lineNumber: number;
  lineIndex: number;
  xmlSyllables: string[];
  plainTextSyllables: string[] | undefined;
  theme: ThemeClasses;
  onMergeSyllables: (lineIndex: number, syllableIndex: number, rowType: 'xml' | 'plain') => void;
}

export function LyricLine({ lineNumber, lineIndex, xmlSyllables, plainTextSyllables, theme, onMergeSyllables }: LyricLineProps) {
  const calculateWidth = (text: string) => {
    return Math.max(50, text.length * 8 + 24);
  };

  const widths = React.useMemo(() => {
    if (!plainTextSyllables) return undefined;
    
    const maxLength = Math.max(xmlSyllables.length, plainTextSyllables.length);
    const calculatedWidths: number[] = [];
    
    for (let i = 0; i < maxLength; i++) {
      const xmlWidth = i < xmlSyllables.length ? calculateWidth(xmlSyllables[i]) : 50;
      const plainWidth = i < plainTextSyllables.length ? calculateWidth(plainTextSyllables[i]) : 50;
      calculatedWidths.push(Math.max(xmlWidth, plainWidth));
    }
    
    return calculatedWidths;
  }, [xmlSyllables, plainTextSyllables]);

  return (
    <div className={`p-4 border ${theme.border} rounded-lg`}>
      <div className={`text-xs ${theme.textMuted} mb-2`}>
        Line {lineNumber}
      </div>
      
      <SyllableRow 
        syllables={xmlSyllables} 
        variant="xml" 
        theme={theme} 
        widths={widths}
        onSyllableClick={(syllableIndex) => onMergeSyllables(lineIndex, syllableIndex, 'xml')}
      />
      
      <div className="mb-2" />
      
      {plainTextSyllables ? (
        <SyllableRow 
          syllables={plainTextSyllables} 
          variant="plain" 
          theme={theme} 
          widths={widths}
          onSyllableClick={(syllableIndex) => onMergeSyllables(lineIndex, syllableIndex, 'plain')}
        />
      ) : (
        <span className={`${theme.textMuted} italic text-sm`}>
          No matching plain text line
        </span>
      )}
    </div>
  );
}