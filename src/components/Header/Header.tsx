import type { ThemeClasses } from '../../types';

interface HeaderProps {
  theme: ThemeClasses;
}

export function Header({ theme }: HeaderProps) {
  return (
    <header className="mb-8">
      <h1 className="text-3xl font-bold mb-2">RS2014 LyricSmith</h1>
      <p className={theme.textMuted}>
        Replace XML lyrics produced by EOF with characters from any alphabet
      </p>
    </header>
  );
}