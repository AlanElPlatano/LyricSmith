import React from 'react';
import { Upload } from 'lucide-react';
import type { ThemeClasses } from '../../types';
import { FileUploadButton } from './FileUploadButton';
import { TextImportArea } from './TextImportArea';

interface PlainTextImportPanelProps {
  onImport: (content: string) => void;
  theme: ThemeClasses;
  lineCount: number;
  expectedLineCount: number;
}

export function PlainTextImportPanel({ onImport, theme, lineCount, expectedLineCount }: PlainTextImportPanelProps) {
  const [plainText, setPlainText] = React.useState('');

  const handleTextChange = (text: string) => {
    setPlainText(text);
    if (text.trim()) {
      onImport(text);
    }
  };

  const hasExpected = expectedLineCount > 0;
  const hasMismatch = hasExpected && lineCount > 0 && lineCount !== expectedLineCount;

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className={`text-lg font-semibold ${theme.text}`}>
          2. Import Correct Lyrics (Plain Text)
        </h3>
        {lineCount > 0 && (
          <span className={`text-sm ${hasMismatch ? 'text-red-500 font-semibold' : theme.textMuted}`}>
            Total lines: {lineCount}
            {hasExpected && ` (expected: ${expectedLineCount})`}
          </span>
        )}
      </div>
      <FileUploadButton
        // Accepted file types
        accept=".txt, .xml"
        onFileSelect={(content) => {
          setPlainText(content);
          onImport(content);
        }}
        className="mb-2 bg-green-500 hover:bg-green-600 text-white"
      >
        <Upload className="inline mr-2" size={18} />
        Choose TXT File
      </FileUploadButton>
      <p className={`text-sm mb-2 ${theme.textMuted}`}>
        Or paste plain text:
      </p>
      <TextImportArea
        value={plainText}
        onChange={handleTextChange}
        placeholder="Paste correct lyrics here (one line per lyric line)..."
        theme={theme}
      />
    </div>
  );
}