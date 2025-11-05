import React from 'react';
import { Upload } from 'lucide-react';
import type { ThemeClasses } from '../../types';
import { FileUploadButton } from './FileUploadButton';
import { TextImportArea } from './TextImportArea';

interface XMLImportPanelProps {
  onImport: (content: string) => void;
  theme: ThemeClasses;
}

export function XMLImportPanel({ onImport, theme }: XMLImportPanelProps) {
  const [xmlText, setXmlText] = React.useState('');

  const handleTextChange = (text: string) => {
    setXmlText(text);
    if (text.trim()) {
      onImport(text);
    }
  };

  return (
    <div>
      <h3 className={`text-lg font-semibold mb-3 ${theme.text}`}>
        1. Import XML File (EOF Export)
      </h3>
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