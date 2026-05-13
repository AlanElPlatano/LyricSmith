import { useState } from 'react';
import type { ThemeClasses } from '../../types';
import { APP_VERSION } from '../../utils/version';
import { HelpModal } from '../HelpModal/HelpModal';

interface HeaderProps {
  theme: ThemeClasses;
}

export function Header({ theme }: HeaderProps) {
  const [isHelpOpen, setIsHelpOpen] = useState(false);

  return (
    <header className="mb-8 relative">
      <div className="absolute top-0 right-0 flex items-center gap-3">
        <button
          onClick={() => setIsHelpOpen(true)}
          className={`w-6 h-6 rounded-full border ${theme.border} ${theme.textMuted} hover:${theme.text} text-sm font-bold flex items-center justify-center transition-colors`}
          aria-label="Open help"
        >
          ?
        </button>
        <span className={`text-sm ${theme.textMuted} opacity-50`}>
          v{APP_VERSION}
        </span>
      </div>

      <h1 className="text-3xl font-bold mb-2">LyricSmith</h1>
      <p className={theme.textMuted}>
        Replace XML lyrics produced by EOF with characters from any alphabet
      </p>

      {isHelpOpen && (
        <HelpModal theme={theme} onClose={() => setIsHelpOpen(false)} />
      )}
    </header>
  );
}