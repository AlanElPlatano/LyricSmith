import type { AppState, HistoryState } from '../types/state.types';

export function createHistorySnapshot(state: AppState): HistoryState {
  return {
    plainTextLines: JSON.parse(JSON.stringify(state.plainTextLines)),
    xmlSyllables: [...state.xmlSyllables],
    currentSyllableCount: state.currentSyllableCount,
    xmlData: state.xmlData ? {
      ...state.xmlData,
      vocals: JSON.parse(JSON.stringify(state.xmlData.vocals))
    } : null,
    lineGroups: JSON.parse(JSON.stringify(state.lineGroups))
  };
}

export function addToHistory(state: AppState): AppState {
  const snapshot = createHistorySnapshot(state);
  const newHistory = state.history.slice(0, state.historyIndex + 1);
  newHistory.push(snapshot);
  
  const limitedHistory = newHistory.slice(-50);
  
  return {
    ...state,
    history: limitedHistory,
    historyIndex: limitedHistory.length - 1
  };
}

export function restoreFromHistory(state: AppState, snapshot: HistoryState): AppState {
  return {
    ...state,
    plainTextLines: JSON.parse(JSON.stringify(snapshot.plainTextLines)),
    xmlSyllables: [...snapshot.xmlSyllables],
    currentSyllableCount: snapshot.currentSyllableCount,
    xmlData: snapshot.xmlData ? {
      ...snapshot.xmlData,
      vocals: JSON.parse(JSON.stringify(snapshot.xmlData.vocals))
    } : null,
    lineGroups: JSON.parse(JSON.stringify(snapshot.lineGroups)),
    originalSyllableCount: snapshot.xmlData?.count || state.originalSyllableCount
  };
}