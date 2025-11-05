import type { AppState, ActionType } from '../types/state.types';
import { ALPHABET_TYPES, ACTION_TYPES } from '../constants';
import { handleXMLImport, handlePlainTextImport, handleMergeSyllables } from './handlers';
import { restoreFromHistory } from './history';

export function createInitialState(): AppState {
  return {
    xmlData: null,
    plainTextRaw: '',
    lineGroups: [],
    plainTextLines: [],
    xmlSyllables: [],
    alphabet: ALPHABET_TYPES.LATIN,
    originalSyllableCount: 0,
    currentSyllableCount: 0,
    darkMode: false,
    error: null,
    history: [],
    historyIndex: -1
  };
}

export function reducer(state: AppState, action: ActionType): AppState {
  switch (action.type) {
    case ACTION_TYPES.IMPORT_XML:
      return handleXMLImport(state, action.payload);
      
    case ACTION_TYPES.IMPORT_PLAIN_TEXT:
      return handlePlainTextImport(state, action.payload);
      
    case ACTION_TYPES.TOGGLE_DARK_MODE:
      return { ...state, darkMode: !state.darkMode };
      
    case ACTION_TYPES.SET_ERROR:
      return { ...state, error: action.payload };
      
    case ACTION_TYPES.CLEAR_ERROR:
      return { ...state, error: null };
      
    case 'merge_syllables':
      return handleMergeSyllables(
        state,
        action.payload.lineIndex,
        action.payload.syllableIndex,
        action.payload.rowType
      );
      
    case 'undo':
      if (state.historyIndex > 0) {
        const previousState = state.history[state.historyIndex - 1];
        return {
          ...restoreFromHistory(state, previousState),
          historyIndex: state.historyIndex - 1
        };
      }
      return state;
      
    case 'redo':
      if (state.historyIndex < state.history.length - 1) {
        const nextState = state.history[state.historyIndex + 1];
        return {
          ...restoreFromHistory(state, nextState),
          historyIndex: state.historyIndex + 1
        };
      }
      return state;
      
    default:
      return state;
  }
}