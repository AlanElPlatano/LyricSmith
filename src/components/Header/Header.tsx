import type { ThemeClasses } from '../../types';
import { APP_VERSION } from '../../utils/version';

interface HeaderProps {
  theme: ThemeClasses;
}

export function Header({ theme }: HeaderProps) {
  return (
    <header className="mb-8 relative">
      <div className="absolute top-0 right-0">
        <span className={`text-sm ${theme.textMuted} opacity-50`}>
          v{APP_VERSION}
        </span>
      </div>
      <h1 className="text-3xl font-bold mb-2">LyricSmith</h1>
      <p className={theme.textMuted}>
        Replace XML lyrics produced by EOF with characters from any alphabet
      </p>
    </header>
  );
}