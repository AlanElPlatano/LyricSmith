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
    darkMode: true,
    error: null,
    history: [],
    historyIndex: -1,
    recordingMode: false,
    recordedActions: [],
    recordingTestName: '',
    recordingUndoStack: []
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
        const newState = {
          ...restoreFromHistory(state, previousState),
          historyIndex: state.historyIndex - 1
        };

        // If recording mode is active, pop the last action and push it to undo stack
        if (state.recordingMode && state.recordedActions.length > 0) {
          const lastAction = state.recordedActions[state.recordedActions.length - 1];
          return {
            ...newState,
            recordedActions: state.recordedActions.slice(0, -1),
            recordingUndoStack: [...state.recordingUndoStack, lastAction]
          };
        }

        return newState;
      }
      return state;

    case 'redo':
      if (state.historyIndex < state.history.length - 1) {
        const nextState = state.history[state.historyIndex + 1];
        const newState = {
          ...restoreFromHistory(state, nextState),
          historyIndex: state.historyIndex + 1
        };

        // If recording mode is active, pop from undo stack and add back to recorded actions
        if (state.recordingMode && state.recordingUndoStack.length > 0) {
          const actionToRestore = state.recordingUndoStack[state.recordingUndoStack.length - 1];
          return {
            ...newState,
            recordedActions: [...state.recordedActions, actionToRestore],
            recordingUndoStack: state.recordingUndoStack.slice(0, -1)
          };
        }

        return newState;
      }
      return state;

    case 'start_recording':
      return {
        ...state,
        recordingMode: true,
        recordedActions: [],
        recordingTestName: action.payload,
        recordingUndoStack: []
      };

    case 'stop_recording':
      return {
        ...state,
        recordingMode: false
      };

    case 'clear_recording':
      return {
        ...state,
        recordedActions: [],
        recordingTestName: '',
        recordingUndoStack: []
      };

    case 'set_recording_test_name':
      return {
        ...state,
        recordingTestName: action.payload
      };

    default:
      return state;
  }
}