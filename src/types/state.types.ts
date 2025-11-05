import type { ParsedXMLData, AlphabetType } from './index';

export interface HistoryState {
  plainTextLines: string[][];
  xmlSyllables: string[];
  currentSyllableCount: number;
  xmlData: ParsedXMLData | null;
  lineGroups: number[][];
}

export interface AppState {
  xmlData: ParsedXMLData | null;
  plainTextRaw: string;
  lineGroups: number[][];
  plainTextLines: string[][];
  xmlSyllables: string[];
  alphabet: AlphabetType;
  originalSyllableCount: number;
  currentSyllableCount: number;
  darkMode: boolean;
  error: string | null;
  history: HistoryState[];
  historyIndex: number;
}

export type ActionType =
  | { type: 'import_xml'; payload: string }
  | { type: 'import_plain_text'; payload: string }
  | { type: 'toggle_dark_mode' }
  | { type: 'set_error'; payload: string }
  | { type: 'clear_error' }
  | { type: 'merge_syllables'; payload: { lineIndex: number; syllableIndex: number; rowType: 'xml' | 'plain' } }
  | { type: 'undo' }
  | { type: 'redo' };