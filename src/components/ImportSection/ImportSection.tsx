import { useTheme } from '../../hooks/useTheme';
import { XMLImportPanel } from './XMLImportPanel';
import { PlainTextImportPanel } from './PlainTextImportPanel';
import { AlertTriangle } from 'lucide-react';

interface ImportSectionProps {
  onImportXML: (content: string) => void;
  onImportPlainText: (content: string) => void;
  darkMode: boolean;
  xmlLineCount: number;
  plainTextLineCount: number;
}

export function ImportSection({
  onImportXML,
  onImportPlainText,
  darkMode,
  xmlLineCount,
  plainTextLineCount
}: ImportSectionProps) {
  const theme = useTheme(darkMode);

  const hasXML = xmlLineCount > 0;
  const hasPlainText = plainTextLineCount > 0;
  const hasMismatch = hasXML && hasPlainText && xmlLineCount !== plainTextLineCount;

  return (
    <div className={`p-6 ${theme.cardBackground} rounded-lg mb-6`}>
      {hasMismatch && (
        <div className={`mb-4 p-4 border-2 ${darkMode ? 'border-yellow-700 bg-yellow-900/20' : 'border-yellow-400 bg-yellow-100'} rounded-lg`}>
          <div className="flex items-start gap-3">
            <AlertTriangle className={`${darkMode ? 'text-yellow-500' : 'text-yellow-600'} flex-shrink-0`} size={20} />
            <div>
              <p className={`font-semibold ${darkMode ? 'text-yellow-300' : 'text-yellow-800'}`}>
                Line Count Mismatch
              </p>
              <p className={`text-sm mt-1 ${darkMode ? 'text-yellow-400' : 'text-yellow-700'}`}>
                Lyric line counts between texts don't match. Adjust the plain text field to match the amount of lines ({xmlLineCount}) in your imported XML.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <XMLImportPanel
          onImport={onImportXML}
          theme={theme}
          lineCount={xmlLineCount}
        />
        <PlainTextImportPanel
          onImport={onImportPlainText}
          theme={theme}
          lineCount={plainTextLineCount}
          expectedLineCount={xmlLineCount}
        />
      </div>
    </div>
  );
}