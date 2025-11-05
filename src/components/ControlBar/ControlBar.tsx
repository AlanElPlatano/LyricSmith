import { Download, Undo, Redo, Moon, Sun } from 'lucide-react';
import { useTheme } from '../../hooks/useTheme';
import { SyllableCounter } from './SyllableCounter';

interface ControlBarProps {
  originalCount: number;
  currentCount: number;
  darkMode: boolean;
  onToggleDarkMode: () => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
}

export function ControlBar({ 
  originalCount, 
  currentCount, 
  darkMode, 
  onToggleDarkMode, 
  onUndo, 
  onRedo,
  canUndo,
  canRedo
}: ControlBarProps) {
  const theme = useTheme(darkMode);
  
  return (
    <div className={`p-4 ${theme.cardBackground} rounded-lg mb-6 flex items-center justify-between flex-wrap gap-4`}>
      <div className="flex gap-2">
        <button 
          onClick={onUndo}
          disabled={!canUndo}
          className={`px-4 py-2 ${theme.buttonSecondary} rounded ${theme.text} ${!canUndo ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <Undo size={18} className="inline mr-1" />
          Undo
        </button>
        <button 
          onClick={onRedo}
          disabled={!canRedo}
          className={`px-4 py-2 ${theme.buttonSecondary} rounded ${theme.text} ${!canRedo ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <Redo size={18} className="inline mr-1" />
          Redo
        </button>
      </div>
      
      <SyllableCounter 
        originalCount={originalCount} 
        currentCount={currentCount} 
        theme={theme}
      />
      
      <div className="flex gap-2">
        <button
          onClick={onToggleDarkMode}
          className={`px-4 py-2 ${theme.buttonSecondary} rounded ${theme.text}`}
          aria-label="Toggle dark mode"
        >
          {darkMode ? <Sun size={18} /> : <Moon size={18} />}
        </button>
        <button className="px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded">
          <Download size={18} className="inline mr-1" />
          Export XML
        </button>
      </div>
    </div>
  );
}