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

  const matchStatus = React.useMemo(() => {
    if (!plainTextSyllables) {
      return {
        isMatched: false,
        xmlCount: xmlSyllables.length,
        plainCount: 0,
        status: 'no-plain-text'
      };
    }

    const xmlCount = xmlSyllables.length;
    const plainCount = plainTextSyllables.length;
    const isMatched = xmlCount === plainCount;

    return {
      isMatched,
      xmlCount,
      plainCount,
      status: isMatched ? 'merged' : 'unfinished'
    };
  }, [xmlSyllables, plainTextSyllables]);

  const widths = React.useMemo(() => {
    if (!plainTextSyllables) return undefined;

    // Calculate widths for the MAXIMUM number of syllables between both rows
    const maxLength = Math.max(xmlSyllables.length, plainTextSyllables.length);
    const calculatedWidths: number[] = [];

    for (let i = 0; i < maxLength; i++) {
      const xmlWidth = i < xmlSyllables.length ? calculateWidth(xmlSyllables[i]) : 50;
      const plainWidth = i < plainTextSyllables.length ? calculateWidth(plainTextSyllables[i]) : 50;
      // Use the maximum width needed for this column position
      calculatedWidths.push(Math.max(xmlWidth, plainWidth));
    }

    return calculatedWidths;
  }, [xmlSyllables, plainTextSyllables]);

  const ribbonColor = matchStatus.isMatched ? 'bg-green-500' : 'bg-red-500';
  const tooltipText = matchStatus.status === 'no-plain-text'
    ? 'No plain text line available'
    : matchStatus.isMatched
      ? `Merged: ${matchStatus.xmlCount} syllables match`
      : `Unfinished: XML has ${matchStatus.xmlCount} syllables, plain text has ${matchStatus.plainCount} syllables`;

  return (
    <div className={`relative p-4 border ${theme.border} rounded-lg`}>
      <div
        className={`absolute left-0 top-0 bottom-0 w-1 rounded-l-lg ${ribbonColor} group`}
        title={tooltipText}
      >
        <span className="invisible group-hover:visible absolute left-2 top-1/2 -translate-y-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap z-10 pointer-events-none">
          {tooltipText}
        </span>
      </div>

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