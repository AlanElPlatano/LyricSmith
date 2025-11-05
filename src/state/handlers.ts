import type { AppState } from '../types/state.types';
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
    
    const newState = {
      ...state,
      plainTextRaw: plainText,
      plainTextLines,
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

  const stateWithHistory = addToHistory(state);

  if (rowType === 'xml') {
    const vocalIndices = state.lineGroups[lineIndex];

    if (syllableIndex >= vocalIndices.length - 1) {
      return stateWithHistory;
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

    let newPlainTextLines = stateWithHistory.plainTextLines;

    if (state.plainTextRaw) {
      newPlainTextLines = parseTextIntoSyllablesWithXMLReference(
        state.plainTextRaw,
        newXmlData,
        newLineGroups,
        (text) => parseTextIntoSyllables(text, state.alphabet)
      );
    }

    return {
      ...stateWithHistory,
      xmlData: newXmlData,
      lineGroups: newLineGroups,
      xmlSyllables: newXmlSyllables,
      plainTextLines: newPlainTextLines,
      currentSyllableCount: newVocals.length,
      originalSyllableCount: state.originalSyllableCount
    };
  } else {
    if (lineIndex >= state.plainTextLines.length) {
      return stateWithHistory;
    }

    const currentLineSyllables = state.plainTextLines[lineIndex];
    const mergedLineSyllables = mergeSyllablesInArray(currentLineSyllables, syllableIndex, false);

    const newPlainTextLines = [...stateWithHistory.plainTextLines];
    newPlainTextLines[lineIndex] = mergedLineSyllables;

    const newCount = calculateTotalSyllableCount(newPlainTextLines);

    return {
      ...stateWithHistory,
      plainTextLines: newPlainTextLines,
      currentSyllableCount: newCount
    };
  }
}