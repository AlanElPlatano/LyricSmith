import { AlertCircle } from 'lucide-react';
import { useTheme } from '../../hooks/useTheme';

interface ErrorBannerProps {
  message: string;
  onDismiss: () => void;
  darkMode: boolean;
}

export function ErrorBanner({ message, onDismiss, darkMode }: ErrorBannerProps) {
  const theme = useTheme(darkMode);
  
  return (
    <div className={`p-4 mb-6 rounded-lg border-2 border-red-500 ${darkMode ? 'bg-red-900/20' : 'bg-red-50'}`}>
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3">
          <AlertCircle className="text-red-500 flex-shrink-0 mt-0.5" size={20} />
          <p className={`${theme.text}`}>{message}</p>
        </div>
        <button
          onClick={onDismiss}
          className={`${theme.text} hover:opacity-70 font-bold`}
          aria-label="Dismiss error"
        >
          ×
        </button>
      </div>
    </div>
  );
}