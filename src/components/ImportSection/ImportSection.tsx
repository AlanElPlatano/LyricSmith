import { useTheme } from '../../hooks/useTheme';
import { XMLImportPanel } from './XMLImportPanel';
import { PlainTextImportPanel } from './PlainTextImportPanel';

interface ImportSectionProps {
  onImportXML: (content: string) => void;
  onImportPlainText: (content: string) => void;
  darkMode: boolean;
}

export function ImportSection({ onImportXML, onImportPlainText, darkMode }: ImportSectionProps) {
  const theme = useTheme(darkMode);

  return (
    <div className={`p-6 ${theme.cardBackground} rounded-lg mb-6`}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <XMLImportPanel onImport={onImportXML} theme={theme} />
        <PlainTextImportPanel onImport={onImportPlainText} theme={theme} />
      </div>
    </div>
  );
}