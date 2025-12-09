import type { AppState, MergeAction } from '../types/state.types';
import { parseXML, groupVocalsIntoLines, mergeVocalsInXMLData, updateLineGroupsAfterMerge } from '../utils/xml.utils';
import { detectAlphabet } from '../utils/alphabet.utils';
import { parseTextIntoSyllables } from '../utils/text.utils';
import { parseTextIntoSyllablesWithXMLReference } from '../utils/matching.utils';
import { mergeSyllablesInArray, calculateTotalSyllableCount } from '../utils/syllable.utils';
import { addToHistory } from './history';

export function handleXMLImport(state: AppState, xmlString: string): AppState {
  try {
    const xmlData = parseXML(xmlString);
    const lineGroups = groupVocalsIntoLines(xmlData.vocals);
    const xmlSyllables = xmlData.vocals.map(vocal => vocal.lyric);
    
    const newState = {
      ...state,
      xmlData,
      lineGroups,
      xmlSyllables,
      originalSyllableCount: xmlData.count,
      currentSyllableCount: xmlData.count,
      error: null
    };
    
    if (state.plainTextLines.length > 0) {
      return addToHistory(newState);
    }
    
    return newState;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return {
      ...state,
      error: `XML Import Error: ${errorMessage}`
    };
  }
}

export function handlePlainTextImport(state: AppState, plainText: string): AppState {
  try {
    const alphabet = detectAlphabet(plainText);

    const plainTextLines = state.xmlData
      ? parseTextIntoSyllablesWithXMLReference(
          plainText,
          state.xmlData,
          state.lineGroups,
          (text) => parseTextIntoSyllables(text, alphabet)
        )
      : parseTextIntoSyllables(plainText, alphabet);

    // Store a deep copy of the original lines for reset functionality
    const originalPlainTextLines = plainTextLines.map(line => [...line]);

    const newState = {
      ...state,
      plainTextRaw: plainText,
      plainTextLines,
      originalPlainTextLines,
      alphabet,
      error: null
    };

    if (state.xmlData !== null) {
      return addToHistory(newState);
    }

    return newState;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return {
      ...state,
      error: `Text Import Error: ${errorMessage}`
    };
  }
}

export function handleMergeSyllables(
  state: AppState,
  lineIndex: number,
  syllableIndex: number,
  rowType: 'xml' | 'plain'
): AppState {
  if (!state.xmlData || lineIndex >= state.lineGroups.length) {
    return state;
  }

  // Capture merge action if recording mode is active
  let newRecordedActions = state.recordedActions;
  let newUndoStack = state.recordingUndoStack;

  if (state.recordingMode) {
    const mergeAction: MergeAction = {
      step: state.recordedActions.length + 1,
      description: `Merge ${rowType} syllable at line ${lineIndex + 1}, position ${syllableIndex + 1}`,
      lineIndex,
      syllableIndex,
      rowType
    };
    newRecordedActions = [...state.recordedActions, mergeAction];

    // Clear the undo stack when a new action is performed
    // This is standard undo/redo behavior: new actions invalidate the redo history
    newUndoStack = [];
  }

  if (rowType === 'xml') {
    const vocalIndices = state.lineGroups[lineIndex];

    if (syllableIndex >= vocalIndices.length - 1) {
      return state;
    }

    const actualVocalIndex = vocalIndices[syllableIndex];
    const newVocals = mergeVocalsInXMLData(state.xmlData.vocals, actualVocalIndex);
    const newLineGroups = updateLineGroupsAfterMerge(state.lineGroups, lineIndex, actualVocalIndex);
    const newXmlSyllables = newVocals.map(vocal => vocal.lyric);

    const newXmlData = {
      ...state.xmlData,
      vocals: newVocals,
      count: newVocals.length
    };

    const mergedState = {
      ...state,
      xmlData: newXmlData,
      lineGroups: newLineGroups,
      xmlSyllables: newXmlSyllables,
      currentSyllableCount: newVocals.length,
      originalSyllableCount: state.originalSyllableCount,
      recordedActions: newRecordedActions,
      recordingUndoStack: newUndoStack
    };

    return addToHistory(mergedState);
  } else {
    if (lineIndex >= state.plainTextLines.length) {
      return state;
    }

    const currentLineSyllables = state.plainTextLines[lineIndex];
    const mergedLineSyllables = mergeSyllablesInArray(currentLineSyllables, syllableIndex, false);

    const newPlainTextLines = [...state.plainTextLines];
    newPlainTextLines[lineIndex] = mergedLineSyllables;

    const newCount = calculateTotalSyllableCount(newPlainTextLines);

    const mergedState = {
      ...state,
      plainTextLines: newPlainTextLines,
      currentSyllableCount: newCount,
      recordedActions: newRecordedActions,
      recordingUndoStack: newUndoStack
    };

    return addToHistory(mergedState);
  }
}

export function handleResetLine(state: AppState, lineIndex: number): AppState {
  if (lineIndex >= state.originalPlainTextLines.length || lineIndex >= state.plainTextLines.length) {
    return state;
  }

  const originalLine = state.originalPlainTextLines[lineIndex];
  if (!originalLine) {
    return state;
  }

  const newPlainTextLines = [...state.plainTextLines];
  newPlainTextLines[lineIndex] = [...originalLine];

  const newCount = calculateTotalSyllableCount(newPlainTextLines);

  const resetState = {
    ...state,
    plainTextLines: newPlainTextLines,
    currentSyllableCount: newCount
  };

  return addToHistory(resetState);
}