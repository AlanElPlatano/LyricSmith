import React from 'react';
import { Upload } from 'lucide-react';
import type { ThemeClasses } from '../../types';
import { FileUploadButton } from './FileUploadButton';
import { TextImportArea } from './TextImportArea';

interface XMLImportPanelProps {
  onImport: (content: string) => void;
  theme: ThemeClasses;
  lineCount: number;
}

export function XMLImportPanel({ onImport, theme, lineCount }: XMLImportPanelProps) {
  const [xmlText, setXmlText] = React.useState('');

  const handleTextChange = (text: string) => {
    setXmlText(text);
    if (text.trim()) {
      onImport(text);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className={`text-lg font-semibold ${theme.text}`}>
          1. Import XML File (EOF Export)
        </h3>
        {lineCount > 0 && (
          <span className={`text-sm ${theme.textMuted}`}>
            Total lines: {lineCount}
          </span>
        )}
      </div>
      <FileUploadButton
        accept=".xml"
        onFileSelect={(content) => {
          setXmlText(content);
          onImport(content);
        }}
        className="mb-2 bg-blue-500 hover:bg-blue-600 text-white"
      >
        <Upload className="inline mr-2" size={18} />
        Choose XML File
      </FileUploadButton>
      <p className={`text-sm mb-2 ${theme.textMuted}`}>
        Or paste XML content:
      </p>
      <TextImportArea
        value={xmlText}
        onChange={handleTextChange}
        placeholder="Paste XML content here..."
        theme={theme}
      />
    </div>
  );
}