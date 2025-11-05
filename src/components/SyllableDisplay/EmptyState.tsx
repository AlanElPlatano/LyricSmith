import type { ThemeClasses } from '../../types';

interface EmptyStateProps {
  theme: ThemeClasses;
}

export function EmptyState({ theme }: EmptyStateProps) {
  return (
    <div className={`text-center py-12 ${theme.textMuted}`}>
      <p className="text-lg">Import XML and plain text files to begin</p>
    </div>
  );
}