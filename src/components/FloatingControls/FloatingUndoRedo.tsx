import { Undo2, Redo2 } from 'lucide-react';

interface FloatingUndoRedoProps {
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  darkMode: boolean;
  isVisible: boolean;
}

export function FloatingUndoRedo({
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  darkMode,
  isVisible
}: FloatingUndoRedoProps) {
  if (!isVisible) {
    return null;
  }

  const buttonBase = `p-3 rounded-full shadow-lg transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed`;
  const undoColor = darkMode
    ? 'bg-gray-700 hover:bg-gray-600 text-gray-100'
    : 'bg-white hover:bg-gray-50 text-gray-900';
  const redoColor = darkMode
    ? 'bg-gray-700 hover:bg-gray-600 text-gray-100'
    : 'bg-white hover:bg-gray-50 text-gray-900';

  return (
    <div className="fixed left-4 top-1/2 -translate-y-1/2 z-40 flex flex-col gap-2 animate-in fade-in slide-in-from-left-4 duration-300">
      <button
        onClick={onUndo}
        disabled={!canUndo}
        className={`${buttonBase} ${undoColor}`}
        title="Undo (Ctrl+Z)"
        aria-label="Undo"
      >
        <Undo2 size={20} />
      </button>

      <button
        onClick={onRedo}
        disabled={!canRedo}
        className={`${buttonBase} ${redoColor}`}
        title="Redo (Ctrl+Y)"
        aria-label="Redo"
      >
        <Redo2 size={20} />
      </button>

      <div className={`text-xs text-center mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'} font-medium`}>
        <div>{canUndo ? '↑' : '·'}</div>
        <div>{canRedo ? '↓' : '·'}</div>
      </div>
    </div>
  );
}
