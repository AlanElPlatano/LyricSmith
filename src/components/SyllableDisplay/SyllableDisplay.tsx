import type { AppState } from '../../types/state.types';
import { useTheme } from '../../hooks/useTheme';
import { LyricLine } from './LyricLine';
import { EmptyState } from './EmptyState';

interface SyllableDisplayProps {
  state: AppState;
  onMergeSyllables: (lineIndex: number, syllableIndex: number, rowType: 'xml' | 'plain') => void;
  onSplitSyllable: (lineIndex: number, syllableIndex: number, rowType: 'xml' | 'plain') => void;
  onResetLine: (lineIndex: number) => void;
}

export function SyllableDisplay({ state, onMergeSyllables, onSplitSyllable, onResetLine }: SyllableDisplayProps) {
  const { xmlData, lineGroups, plainTextLines, darkMode, xmlMergeHistory, plainTextMergeHistory } = state;
  const theme = useTheme(darkMode);

  if (!xmlData || lineGroups.length === 0) {
    return <EmptyState theme={theme} />;
  }

  return (
    <div className="space-y-6">
      {lineGroups.map((vocalIndices, lineIndex) => {
        const xmlSyllables = vocalIndices.map(idx => state.xmlSyllables[idx]);
        const plainTextSyllables = plainTextLines[lineIndex];

        const xmlCanSplitFlags = vocalIndices.map(idx => {
          const node = xmlMergeHistory[idx];
          return node ? node.children !== null : false;
        });

        const plainCanSplitFlags = plainTextMergeHistory[lineIndex]
          ? plainTextMergeHistory[lineIndex].map(node => node.children !== null)
          : [];

        return (
          <LyricLine
            key={lineIndex}
            lineNumber={lineIndex + 1}
            lineIndex={lineIndex}
            xmlSyllables={xmlSyllables}
            plainTextSyllables={plainTextSyllables}
            theme={theme}
            onMergeSyllables={onMergeSyllables}
            onSplitSyllable={onSplitSyllable}
            onResetLine={onResetLine}
            xmlCanSplitFlags={xmlCanSplitFlags}
            plainCanSplitFlags={plainCanSplitFlags}
          />
        );
      })}
    </div>
  );
}
