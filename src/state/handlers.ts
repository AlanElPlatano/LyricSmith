import type { AppState, MergeAction } from '../types/state.types';
import { parseXML, groupVocalsIntoLines, mergeVocalsInXMLData, updateLineGroupsAfterMerge, updateLineGroupsAfterSplit } from '../utils/xml.utils';
import { detectAlphabet } from '../utils/alphabet.utils';
import { parseTextIntoSyllables } from '../utils/text.utils';
import { parseTextIntoSyllablesWithXMLReference } from '../utils/matching.utils';
import { mergeSyllablesInArray, calculateTotalSyllableCount } from '../utils/syllable.utils';
import { tryAutoMergeRemainingLine } from '../utils/auto-match.utils';
import { createXmlLeafArray, createPlainTextLeafArray, createPlainTextLeaf, mergeXmlNodes, mergePlainTextNodes, expandXmlToLeaves } from '../utils/merge-tree.utils';
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
      xmlMergeHistory: createXmlLeafArray(xmlData.vocals),
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
      plainTextMergeHistory: plainTextLines.map(line => createPlainTextLeafArray(line)),
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

    const newXmlMergeHistory = [...state.xmlMergeHistory];
    const firstXmlNode = newXmlMergeHistory[actualVocalIndex];
    const secondXmlNode = newXmlMergeHistory[actualVocalIndex + 1];
    newXmlMergeHistory[actualVocalIndex] = mergeXmlNodes(firstXmlNode, secondXmlNode, newVocals[actualVocalIndex]);
    newXmlMergeHistory.splice(actualVocalIndex + 1, 1);

    const mergedState = {
      ...state,
      xmlData: newXmlData,
      lineGroups: newLineGroups,
      xmlSyllables: newXmlSyllables,
      xmlMergeHistory: newXmlMergeHistory,
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

    // Try to auto-merge remaining syllables on this line
    const vocalIndices = state.lineGroups[lineIndex];
    const xmlSyllablesForLine = vocalIndices.map(index => state.xmlSyllables[index]);
    const finalLineSyllables = tryAutoMergeRemainingLine(
      mergedLineSyllables,
      xmlSyllablesForLine,
      syllableIndex
    );

    const newPlainTextLines = [...state.plainTextLines];
    newPlainTextLines[lineIndex] = finalLineSyllables;

    const currentLineMergeHistory = [...state.plainTextMergeHistory[lineIndex]];
    const firstPlainNode = currentLineMergeHistory[syllableIndex];
    const secondPlainNode = currentLineMergeHistory[syllableIndex + 1];
    currentLineMergeHistory[syllableIndex] = mergePlainTextNodes(
      firstPlainNode, secondPlainNode, mergedLineSyllables[syllableIndex]
    );
    currentLineMergeHistory.splice(syllableIndex + 1, 1);

    const newPlainTextMergeHistory = [...state.plainTextMergeHistory];
    const autoMergeStartIndex = syllableIndex + 1;

    if (finalLineSyllables.length < mergedLineSyllables.length) {
      const preservedHistory = currentLineMergeHistory.slice(0, autoMergeStartIndex);
      const newTailLeaves = finalLineSyllables
        .slice(autoMergeStartIndex)
        .map(text => createPlainTextLeaf(text));
      newPlainTextMergeHistory[lineIndex] = [...preservedHistory, ...newTailLeaves];
    } else {
      newPlainTextMergeHistory[lineIndex] = currentLineMergeHistory;
    }

    const newCount = calculateTotalSyllableCount(newPlainTextLines);

    const mergedState = {
      ...state,
      plainTextLines: newPlainTextLines,
      plainTextMergeHistory: newPlainTextMergeHistory,
      currentSyllableCount: newCount,
      recordedActions: newRecordedActions,
      recordingUndoStack: newUndoStack
    };

    return addToHistory(mergedState);
  }
}

export function handleResetLine(state: AppState, lineIndex: number): AppState {
  if (!state.xmlData || lineIndex >= state.lineGroups.length) {
    return state;
  }

  if (lineIndex >= state.originalPlainTextLines.length || lineIndex >= state.plainTextLines.length) {
    return state;
  }

  const originalPlainLine = state.originalPlainTextLines[lineIndex];
  if (!originalPlainLine) {
    return state;
  }

  const newPlainTextLines = [...state.plainTextLines];
  newPlainTextLines[lineIndex] = [...originalPlainLine];

  const newPlainTextMergeHistory = [...state.plainTextMergeHistory];
  newPlainTextMergeHistory[lineIndex] = createPlainTextLeafArray(originalPlainLine);

  const vocalIndices = state.lineGroups[lineIndex];
  const expandedXmlNodes = vocalIndices.flatMap(idx => expandXmlToLeaves(state.xmlMergeHistory[idx]));
  const startVocalIdx = vocalIndices[0] ?? 0;
  const delta = expandedXmlNodes.length - vocalIndices.length;

  const newVocals = [...state.xmlData.vocals];
  newVocals.splice(startVocalIdx, vocalIndices.length, ...expandedXmlNodes.map(n => n.vocal));

  const newXmlMergeHistory = [...state.xmlMergeHistory];
  newXmlMergeHistory.splice(startVocalIdx, vocalIndices.length, ...expandedXmlNodes);

  const newLineGroups = state.lineGroups.map((group, idx) => {
    if (idx < lineIndex) return group;
    if (idx === lineIndex) {
      return Array.from({ length: expandedXmlNodes.length }, (_, i) => startVocalIdx + i);
    }
    return group.map(vocalIdx => vocalIdx + delta);
  });

  const newXmlData = {
    ...state.xmlData,
    vocals: newVocals,
    count: newVocals.length
  };

  const resetState = {
    ...state,
    plainTextLines: newPlainTextLines,
    plainTextMergeHistory: newPlainTextMergeHistory,
    xmlData: newXmlData,
    xmlSyllables: newVocals.map(vocal => vocal.lyric),
    xmlMergeHistory: newXmlMergeHistory,
    lineGroups: newLineGroups,
    currentSyllableCount: newVocals.length
  };

  return addToHistory(resetState);
}

export function handleSplitSyllable(
  state: AppState,
  lineIndex: number,
  syllableIndex: number,
  rowType: 'xml' | 'plain'
): AppState {
  if (!state.xmlData || lineIndex >= state.lineGroups.length) {
    return state;
  }

  if (rowType === 'xml') {
    return handleXmlSplit(state, lineIndex, syllableIndex);
  }

  return handlePlainTextSplit(state, lineIndex, syllableIndex);
}

function handleXmlSplit(state: AppState, lineIndex: number, syllableIndex: number): AppState {
  const vocalIndices = state.lineGroups[lineIndex];
  if (syllableIndex >= vocalIndices.length) {
    return state;
  }

  const actualVocalIndex = vocalIndices[syllableIndex];
  const node = state.xmlMergeHistory[actualVocalIndex];

  if (!node?.children) {
    return state;
  }

  const [firstChild, secondChild] = node.children;

  const newVocals = [...state.xmlData!.vocals];
  newVocals.splice(actualVocalIndex, 1, firstChild.vocal, secondChild.vocal);

  const newLineGroups = updateLineGroupsAfterSplit(state.lineGroups, lineIndex, actualVocalIndex);
  const newXmlSyllables = newVocals.map(vocal => vocal.lyric);

  const newXmlMergeHistory = [...state.xmlMergeHistory];
  newXmlMergeHistory.splice(actualVocalIndex, 1, firstChild, secondChild);

  const newXmlData = {
    ...state.xmlData!,
    vocals: newVocals,
    count: newVocals.length
  };

  const splitState = {
    ...state,
    xmlData: newXmlData,
    lineGroups: newLineGroups,
    xmlSyllables: newXmlSyllables,
    xmlMergeHistory: newXmlMergeHistory,
    currentSyllableCount: newVocals.length
  };

  return addToHistory(splitState);
}

function handlePlainTextSplit(state: AppState, lineIndex: number, syllableIndex: number): AppState {
  if (lineIndex >= state.plainTextLines.length) {
    return state;
  }

  const lineMergeHistory = state.plainTextMergeHistory[lineIndex];
  if (!lineMergeHistory || syllableIndex >= lineMergeHistory.length) {
    return state;
  }

  const node = lineMergeHistory[syllableIndex];

  if (!node?.children) {
    return state;
  }

  const [firstChild, secondChild] = node.children;

  const newLineSyllables = [...state.plainTextLines[lineIndex]];
  newLineSyllables.splice(syllableIndex, 1, firstChild.text, secondChild.text);

  const newPlainTextLines = [...state.plainTextLines];
  newPlainTextLines[lineIndex] = newLineSyllables;

  const newLineMergeHistory = [...lineMergeHistory];
  newLineMergeHistory.splice(syllableIndex, 1, firstChild, secondChild);

  const newPlainTextMergeHistory = [...state.plainTextMergeHistory];
  newPlainTextMergeHistory[lineIndex] = newLineMergeHistory;

  const newCount = calculateTotalSyllableCount(newPlainTextLines);

  const splitState = {
    ...state,
    plainTextLines: newPlainTextLines,
    plainTextMergeHistory: newPlainTextMergeHistory,
    currentSyllableCount: newCount
  };

  return addToHistory(splitState);
}