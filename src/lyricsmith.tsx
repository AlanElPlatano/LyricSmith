import React, { useReducer } from 'react';
import { Upload, Download, Undo, Redo, Moon, Sun, AlertCircle } from 'lucide-react';

// ============================================================================
// TYPES
// ============================================================================

type AlphabetType = 'latin' | 'cyrillic' | 'cjk' | 'arabic';

interface VocalData {
  time: string;
  note: string;
  length: string;
  lyric: string;
  originalLyric: string;
}

interface ParsedXMLData {
  header: string;
  vocals: VocalData[];
  count: number;
}

interface AppState {
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

type ActionType =
  | { type: 'import_xml'; payload: string }
  | { type: 'import_plain_text'; payload: string }
  | { type: 'toggle_dark_mode' }
  | { type: 'set_error'; payload: string }
  | { type: 'clear_error' }
  | { type: 'merge_syllables'; payload: { lineIndex: number; syllableIndex: number; rowType: 'xml' | 'plain' } }
  | { type: 'undo' }
  | { type: 'redo' };

interface ThemeClasses {
  background: string;
  text: string;
  textMuted: string;
  cardBackground: string;
  border: string;
  inputBackground: string;
  buttonSecondary: string;
}

interface HistoryState {
  plainTextLines: string[][];
  xmlSyllables: string[];
  currentSyllableCount: number;
  xmlData: ParsedXMLData | null;
  lineGroups: number[][];
}

// ============================================================================
// CONSTANTS
// ============================================================================

const ALPHABET_TYPES: Record<string, AlphabetType> = {
  LATIN: 'latin',
  CYRILLIC: 'cyrillic',
  CJK: 'cjk',
  ARABIC: 'arabic'
};

const UNICODE_RANGES = {
  CYRILLIC: /[\u0400-\u04FF]/,
  CJK: /[\u4E00-\u9FFF\u3040-\u309F\u30A0-\u30FF]/,
  ARABIC: /[\u0600-\u06FF]/,
  LATIN_VOWELS: /[aeiouAEIOU]/
};

const LINE_END_MARKER = '+';
const SYLLABLE_SEPARATOR = '-';

const ACTION_TYPES = {
  IMPORT_XML: 'import_xml' as const,
  IMPORT_PLAIN_TEXT: 'import_plain_text' as const,
  TOGGLE_DARK_MODE: 'toggle_dark_mode' as const,
  SET_ERROR: 'set_error' as const,
  CLEAR_ERROR: 'clear_error' as const
};

// ============================================================================
// UTILITY FUNCTIONS - XML Parsing
// ============================================================================

function extractXMLHeader(xmlString: string): string {
  const vocalsStartIndex = xmlString.indexOf('<vocals');
  return vocalsStartIndex >= 0 ? xmlString.substring(0, vocalsStartIndex) : '';
}

function createVocalObject(vocalElement: Element): VocalData {
  return {
    time: vocalElement.getAttribute('time') || '',
    note: vocalElement.getAttribute('note') || '',
    length: vocalElement.getAttribute('length') || '',
    lyric: vocalElement.getAttribute('lyric') || '',
    originalLyric: vocalElement.getAttribute('lyric') || ''
  };
}

function parseVocalsFromXML(xmlDocument: Document): VocalData[] {
  const vocalElements = xmlDocument.getElementsByTagName('vocal');
  return Array.from(vocalElements).map(createVocalObject);
}

function validateXMLDocument(xmlDocument: Document): void {
  const parserErrors = xmlDocument.getElementsByTagName("parsererror");
  if (parserErrors.length > 0) {
    throw new Error("Invalid XML format");
  }
}

function parseXMLString(xmlString: string): Document {
  const parser = new DOMParser();
  const xmlDocument = parser.parseFromString(xmlString, "text/xml");
  validateXMLDocument(xmlDocument);
  return xmlDocument;
}

function parseXML(xmlString: string): ParsedXMLData {
  const xmlDocument = parseXMLString(xmlString);
  const header = extractXMLHeader(xmlString);
  const vocals = parseVocalsFromXML(xmlDocument);
  
  return {
    header,
    vocals,
    count: vocals.length
  };
}

// ============================================================================
// UTILITY FUNCTIONS - Line Grouping
// ============================================================================

function isLineEndMarker(lyric: string): boolean {
  return lyric.endsWith(LINE_END_MARKER);
}

function groupVocalsIntoLines(vocals: VocalData[]): number[][] {
  const lines: number[][] = [];
  let currentLine: number[] = [];
  
  vocals.forEach((vocal, index) => {
    currentLine.push(index);
    
    if (isLineEndMarker(vocal.lyric)) {
      lines.push(currentLine);
      currentLine = [];
    }
  });
  
  if (currentLine.length > 0) {
    lines.push(currentLine);
  }
  
  return lines;
}

// ============================================================================
// UTILITY FUNCTIONS - Alphabet Detection
// ============================================================================

function containsCyrillic(text: string): boolean {
  return UNICODE_RANGES.CYRILLIC.test(text);
}

function containsCJK(text: string): boolean {
  return UNICODE_RANGES.CJK.test(text);
}

function containsArabic(text: string): boolean {
  return UNICODE_RANGES.ARABIC.test(text);
}

function detectAlphabet(text: string): AlphabetType {
  if (containsCyrillic(text)) return ALPHABET_TYPES.CYRILLIC;
  if (containsCJK(text)) return ALPHABET_TYPES.CJK;
  if (containsArabic(text)) return ALPHABET_TYPES.ARABIC;
  return ALPHABET_TYPES.LATIN;
}

// ============================================================================
// UTILITY FUNCTIONS - Text Processing
// ============================================================================

function splitIntoCharacters(text: string): string[] {
  return text.split('').filter(char => char.trim().length > 0);
}

function splitLatinIntoSyllables(text: string): string[] {
  const words = text.split(/\s+/);
  const syllables: string[] = [];
  
  words.forEach(word => {
    const parts = word.split(new RegExp(`(?=${UNICODE_RANGES.LATIN_VOWELS.source})`));
    parts.forEach(part => {
      const trimmedPart = part.trim();
      if (trimmedPart) {
        syllables.push(trimmedPart);
      }
    });
  });
  
  return syllables.length > 0 ? syllables : [text];
}

function splitTextBySyllables(text: string, alphabetType: AlphabetType): string[] {
  const isLatinScript = alphabetType === ALPHABET_TYPES.LATIN;
  return isLatinScript ? splitLatinIntoSyllables(text) : splitIntoCharacters(text);
}

function splitIntoNonEmptyLines(text: string): string[] {
  return text.split('\n').filter(line => line.trim().length > 0);
}

function parseTextIntoSyllables(text: string, alphabetType: AlphabetType): string[][] {
  const lines = splitIntoNonEmptyLines(text);
  return lines.map(line => splitTextBySyllables(line, alphabetType));
}

function mergeSyllablesInArray(syllables: string[], clickedIndex: number, isXMLRow: boolean): string[] {
  // Cannot merge last syllable
  if (clickedIndex >= syllables.length - 1) {
    return syllables;
  }
  
  const newSyllables = [...syllables];
  const current = syllables[clickedIndex];
  const next = syllables[clickedIndex + 1];
  
  // For XML row: remove hyphen from current if exists, merge with next
  if (isXMLRow) {
    const cleaned = current.replace(/-$/, '');
    newSyllables[clickedIndex] = cleaned + next;
  } else {
    // Plain text: just concatenate
    newSyllables[clickedIndex] = current + next;
  }
  
  // Remove the next element
  newSyllables.splice(clickedIndex + 1, 1);
  
  return newSyllables;
}

function calculateTotalSyllableCount(plainTextLines: string[][]): number {
  return plainTextLines.reduce((sum, line) => sum + line.length, 0);
}

// ============================================================================
// UTILITY FUNCTIONS - Smart Syllable Matching
// ============================================================================

function normalizeForComparison(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9\u0400-\u04FF\u4E00-\u9FFF\u3040-\u309F\u30A0-\u30FF\u0600-\u06FF]/g, '');
}

function isLatinText(text: string): boolean {
  // Check if text is primarily Latin (at least 50% Latin characters)
  const latinChars = text.match(/[a-zA-Z]/g)?.length || 0;
  const totalChars = text.replace(/\s/g, '').length;
  return totalChars > 0 && (latinChars / totalChars) >= 0.5;
}

function matchPlainTextToXMLPattern(plainText: string, xmlPattern: string[]): string[] | null {
  // Remove all whitespace from plain text for matching
  const plainTextNoSpaces = plainText.replace(/\s+/g, '');
  
  // Build expected text from XML pattern (without hyphens, + and spaces)
  // Remove the hyphens when building the expected text for comparison
  const xmlExpected = xmlPattern.map(s => s.replace(/[-+]/g, '')).join('');
  
  // Normalize both for comparison
  const normalizedPlain = normalizeForComparison(plainTextNoSpaces);
  const normalizedXML = normalizeForComparison(xmlExpected);
  
  // If they don't match closely, return null which falls back to char-by-char
  if (normalizedPlain !== normalizedXML) {
    console.log('Match failed:', { normalizedPlain, normalizedXML });
    return null;
  }
  
  // By this point we know they match, so we can divide plain text according to XML pattern
  const result: string[] = [];
  let position = 0;
  
  for (let i = 0; i < xmlPattern.length; i++) {
    const xmlSyllable = xmlPattern[i];
    const hasHyphen = xmlSyllable.endsWith('-');
    const cleanXMLSyllable = xmlSyllable.replace(/[-+]/g, ''); // Remove both - and +
    const syllableLength = cleanXMLSyllable.length;
    
    if (position + syllableLength > plainTextNoSpaces.length) {
      // Just in case, shouldn't happen if normalized texts matched
      console.log('Length mismatch at position', position);
      return null;
    }
    
    let plainSyllable = plainTextNoSpaces.substring(position, position + syllableLength);
    
    // Add hyphen to plain text syllable if XML had one (for visual consistency)
    if (hasHyphen) {
      plainSyllable += '-';
    }
    
    result.push(plainSyllable);
    position += syllableLength;
  }
  
  return result;
}

function segmentTextByAlphabet(text: string): Array<{text: string, isLatin: boolean}> {
  const segments: Array<{text: string, isLatin: boolean}> = [];
  
  // Start with empty string
  if (text.length === 0) return segments;
  
  let currentIsLatin = /[a-zA-Z\s]/.test(text[0]);
  let currentSegment = '';

  // Start loop at 0, not after initializing with text[0]
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const charIsLatin = /[a-zA-Z\s]/.test(char);
    
    if (i === 0) {
      // First character
      currentIsLatin = charIsLatin;
      currentSegment = char;
    } else if (currentIsLatin === charIsLatin) {
      // Same type, add to current segment
      currentSegment += char;
    } else {
      // Different type, save current segment and start new one
      if (currentSegment.trim()) {
        segments.push({ text: currentSegment, isLatin: currentIsLatin });
      }
      currentSegment = char;
      currentIsLatin = charIsLatin;
    }
  }
  
  // Last segment
  if (currentSegment.trim()) {
    segments.push({ text: currentSegment, isLatin: currentIsLatin });
  }
  
  return segments;
}

function divideLineByXMLPattern(
  plainTextLine: string,
  xmlSyllablesForLine: string[]
): string[] {
  // Check if this is primarily Latin text
  if (!isLatinText(plainTextLine)) {
    // For non latin split into characters
    return splitIntoCharacters(plainTextLine);
  }
  
  // Try to match the entire line to XML pattern
  const matched = matchPlainTextToXMLPattern(plainTextLine, xmlSyllablesForLine);
  
  if (matched) {
    return matched;
  }
  
  // If no match, try mixed alphabet approach
  const segments = segmentTextByAlphabet(plainTextLine);
  const result: string[] = [];
  let xmlIndex = 0;
  
  for (const segment of segments) {
    if (segment.isLatin && xmlIndex < xmlSyllablesForLine.length) {
      // Calculate how many XML syllables this segment should consume
      const segmentNoSpaces = segment.text.replace(/\s+/g, '');
      let consumedLength = 0;
      const segmentXMLPattern: string[] = [];
      
      // Collect XML syllables until we match the segment length
      while (xmlIndex < xmlSyllablesForLine.length && consumedLength < segmentNoSpaces.length) {
        const xmlSyll = xmlSyllablesForLine[xmlIndex];
        segmentXMLPattern.push(xmlSyll);
        consumedLength += xmlSyll.replace(/-/g, '').length;
        xmlIndex++;
      }
      
      // Try to match this segment
      const segmentMatched = matchPlainTextToXMLPattern(segment.text, segmentXMLPattern);
      
      if (segmentMatched) {
        result.push(...segmentMatched);
      } else {
        // Character by character for this segment
        result.push(...splitIntoCharacters(segment.text));
      }
    } else {
      // Non latin segment uses character by character
      result.push(...splitIntoCharacters(segment.text));
    }
  }
  
  return result;
}

// ============================================================================
// UTILITY FUNCTIONS - Plain Text Processing
// ============================================================================

function parseTextIntoSyllablesWithXMLReference(
  plainText: string,
  xmlData: ParsedXMLData | null,
  lineGroups: number[][]
): string[][] {
  if (!xmlData || lineGroups.length === 0) {
    // If no XML reference, use old method
    const alphabet = detectAlphabet(plainText);
    return parseTextIntoSyllables(plainText, alphabet);
  }
  
  // Treat entire plain text as one continuous stream
  let plainTextStream = plainText.replace(/\n+/g, ' ').trim();
  
  if (!plainTextStream) {
    return [];
  }
  
  const result: string[][] = [];
  
  // For each line in XML, extract the corresponding syllables
  for (let lineIndex = 0; lineIndex < lineGroups.length; lineIndex++) {
    const vocalIndices = lineGroups[lineIndex];
    const xmlSyllablesForLine = vocalIndices.map(idx => xmlData.vocals[idx].lyric);
    
    // Calculate total character length needed (without hyphens, +, and spaces)
    const expectedLength = xmlSyllablesForLine
      .map(s => s.replace(/[-+]/g, ''))
      .join('')
      .length;
    
    // Extract characters more carefully, skipping spaces
    let charsExtracted = 0;
    let textForLine = '';
    let charsConsumed = 0;
    
    for (let i = 0; i < plainTextStream.length && charsExtracted < expectedLength; i++) {
      const char = plainTextStream[i];
      textForLine += char;
      charsConsumed++;
      
      // Only count non-space characters toward our expected length
      if (char.trim()) {
        charsExtracted++;
      }
    }
    
    textForLine = textForLine.trim();
    
    // If we don't have enough text, take what's left
    if (textForLine.length === 0 && plainTextStream.length > 0) {
      textForLine = plainTextStream.trim();
      charsConsumed = plainTextStream.length;
    }
    
    // Divide this line according to XML pattern
    const lineSyllables = divideLineByXMLPattern(textForLine, xmlSyllablesForLine);
    
    result.push(lineSyllables);
    
    // Remove the consumed characters and trim
    plainTextStream = plainTextStream.substring(charsConsumed).trim();
  }
  
  return result;
}

// ============================================================================
// STATE MANAGEMENT
// ============================================================================

function createInitialState(): AppState {
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

function createHistorySnapshot(state: AppState): HistoryState {
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

function addToHistory(state: AppState): AppState {
  const snapshot = createHistorySnapshot(state);
  const newHistory = state.history.slice(0, state.historyIndex + 1);
  newHistory.push(snapshot);
  
  // Limit history to 50
  const limitedHistory = newHistory.slice(-50);
  
  return {
    ...state,
    history: limitedHistory,
    historyIndex: limitedHistory.length - 1
  };
}

function restoreFromHistory(state: AppState, snapshot: HistoryState): AppState {
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

function handleXMLImport(state: AppState, xmlString: string): AppState {
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
    
    // Save initial state to history if we have both XML and plain text
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

function handlePlainTextImport(state: AppState, plainText: string): AppState {
  try {
    const alphabet = detectAlphabet(plainText);
    
    // Use XML reference if available
    const plainTextLines = state.xmlData 
      ? parseTextIntoSyllablesWithXMLReference(plainText, state.xmlData, state.lineGroups)
      : parseTextIntoSyllables(plainText, alphabet);
    
    const newState = {
      ...state,
      plainTextRaw: plainText,
      plainTextLines,
      alphabet,
      error: null
    };
    
    // Save initial state to history if we have both XML and plain text
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

function handleMergeSyllables(
  state: AppState,
  lineIndex: number,
  syllableIndex: number,
  rowType: 'xml' | 'plain'
): AppState {
  // Validation
  if (!state.xmlData || lineIndex >= state.lineGroups.length) {
    return state;
  }

  // Save current state to history before making changes
  const stateWithHistory = addToHistory(state);

  if (rowType === 'xml') {
    const vocalIndices = state.lineGroups[lineIndex];
    
    // Can't merge if at the end of the line
    if (syllableIndex >= vocalIndices.length - 1) {
      return stateWithHistory;
    }
    
    const actualVocalIndex = vocalIndices[syllableIndex];
    
    // Merge the vocals in xmlData
    const newVocals = mergeVocalsInXMLData(state.xmlData.vocals, actualVocalIndex);
    
    // Update line groups to reflect the removal
    const newLineGroups = updateLineGroupsAfterMerge(state.lineGroups, lineIndex, actualVocalIndex);
    
    // Update xmlSyllables
    const newXmlSyllables = newVocals.map(vocal => vocal.lyric);
    
    return {
      ...stateWithHistory,
      xmlData: {
        ...state.xmlData,
        vocals: newVocals,
        count: newVocals.length
      },
      lineGroups: newLineGroups,
      xmlSyllables: newXmlSyllables,
      currentSyllableCount: newVocals.length,
      originalSyllableCount: state.originalSyllableCount
    };
  } else {
    // Merge plain text syllables for this line
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

function mergeVocalsInXMLData(
  vocals: VocalData[],
  firstIndex: number
): VocalData[] {
  if (firstIndex >= vocals.length - 1) return vocals;
  
  const newVocals = [...vocals];
  const first = vocals[firstIndex];
  const second = vocals[firstIndex + 1];
  
  // Merge lyrics (remove hyphen from the first one if it has one)
  const mergedLyric = first.lyric.replace(/-$/, '') + second.lyric;
  
  // Calculate combined duration
  const startTime = parseFloat(first.time);
  const secondEndTime = parseFloat(second.time) + parseFloat(second.length);
  const combinedLength = (secondEndTime - startTime).toFixed(3);
  
  // Update first vocal with merged data
  newVocals[firstIndex] = {
    ...first,
    lyric: mergedLyric,
    length: combinedLength
  };
  
  // Remove second vocal
  newVocals.splice(firstIndex + 1, 1);
  
  return newVocals;
}

function updateLineGroupsAfterMerge(
  lineGroups: number[][],
  lineIndex: number,
  mergedVocalIndex: number
): number[][] {
  const newLineGroups = lineGroups.map(group => [...group]);
  const targetGroup = newLineGroups[lineIndex];
  
  // Find position in the line group
  const positionInLine = targetGroup.indexOf(mergedVocalIndex);
  if (positionInLine === -1) return newLineGroups;
  
  // Remove the next index from this group
  targetGroup.splice(positionInLine + 1, 1);
  
  // Decrement all indices after the merged one in all groups
  for (let i = 0; i < newLineGroups.length; i++) {
    newLineGroups[i] = newLineGroups[i].map(idx => 
      idx > mergedVocalIndex ? idx - 1 : idx
    );
  }
  
  return newLineGroups;
}

function reducer(state: AppState, action: ActionType): AppState {
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

// ============================================================================
// COMPONENTS - Utilities
// ============================================================================

function getThemeClasses(darkMode: boolean): ThemeClasses {
  return {
    background: darkMode ? 'bg-gray-900' : 'bg-white',
    text: darkMode ? 'text-gray-100' : 'text-gray-900',
    textMuted: darkMode ? 'text-gray-400' : 'text-gray-600',
    cardBackground: darkMode ? 'bg-gray-800' : 'bg-gray-50',
    border: darkMode ? 'border-gray-600' : 'border-gray-300',
    inputBackground: darkMode ? 'bg-gray-700' : 'bg-white',
    buttonSecondary: darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'
  };
}

// ============================================================================
// COMPONENTS - File Upload
// ============================================================================

interface FileUploadButtonProps {
  label: string;
  accept: string;
  onFileSelect: (content: string) => void;
  className: string;
  children: React.ReactNode;
}

function FileUploadButton({ accept, onFileSelect, className, children }: FileUploadButtonProps) {
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result;
      if (typeof result === 'string') {
        onFileSelect(result);
      }
    };
    reader.readAsText(file);
  };

  return (
    <label className={`block px-4 py-2 rounded cursor-pointer text-center ${className}`}>
      {children}
      <input
        type="file"
        accept={accept}
        onChange={handleFileChange}
        className="hidden"
      />
    </label>
  );
}

// ============================================================================
// COMPONENTS - Import Section
// ============================================================================

interface TextImportAreaProps {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  theme: ThemeClasses;
}

function TextImportArea({ value, onChange, placeholder, theme }: TextImportAreaProps) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={`w-full h-32 p-2 border ${theme.border} rounded text-sm ${theme.inputBackground} ${theme.text}`}
      placeholder={placeholder}
    />
  );
}

interface ImportPanelProps {
  onImport: (content: string) => void;
  theme: ThemeClasses;
}

function XMLImportPanel({ onImport, theme }: ImportPanelProps) {
  const [xmlText, setXmlText] = React.useState('');

  const handleTextChange = (text: string) => {
    setXmlText(text);
    if (text.trim()) {
      onImport(text);
    }
  };

  return (
    <div>
      <h3 className={`text-lg font-semibold mb-3 ${theme.text}`}>
        1. Import XML File (EOF Export)
      </h3>
      <FileUploadButton
        label="Choose XML File"
        accept=".xml"
        onFileSelect={(content) => {
          setXmlText(content);
          onImport(content);
        }}
        className="mb-2 bg-blue-500 hover:bg-blue-600 text-white"
      >
        <Upload className="inline mr-2" size={18} />
        Choose XML File
      </FileUploadButton>
      <p className={`text-sm mb-2 ${theme.textMuted}`}>
        Or paste XML content:
      </p>
      <TextImportArea
        value={xmlText}
        onChange={handleTextChange}
        placeholder="Paste XML content here..."
        theme={theme}
      />
    </div>
  );
}

function PlainTextImportPanel({ onImport, theme }: ImportPanelProps) {
  const [plainText, setPlainText] = React.useState('');

  const handleTextChange = (text: string) => {
    setPlainText(text);
    if (text.trim()) {
      onImport(text);
    }
  };

  return (
    <div>
      <h3 className={`text-lg font-semibold mb-3 ${theme.text}`}>
        2. Import Correct Lyrics (Plain Text)
      </h3>
      <FileUploadButton
        label="Choose TXT File"
        accept=".txt"
        onFileSelect={(content) => {
          setPlainText(content);
          onImport(content);
        }}
        className="mb-2 bg-green-500 hover:bg-green-600 text-white"
      >
        <Upload className="inline mr-2" size={18} />
        Choose TXT File
      </FileUploadButton>
      <p className={`text-sm mb-2 ${theme.textMuted}`}>
        Or paste plain text:
      </p>
      <TextImportArea
        value={plainText}
        onChange={handleTextChange}
        placeholder="Paste correct lyrics here (one line per lyric line)..."
        theme={theme}
      />
    </div>
  );
}

interface ImportSectionProps {
  onImportXML: (content: string) => void;
  onImportPlainText: (content: string) => void;
  darkMode: boolean;
}

function ImportSection({ onImportXML, onImportPlainText, darkMode }: ImportSectionProps) {
  const theme = getThemeClasses(darkMode);

  return (
    <div className={`p-6 ${theme.cardBackground} rounded-lg mb-6`}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <XMLImportPanel onImport={onImportXML} theme={theme} />
        <PlainTextImportPanel onImport={onImportPlainText} theme={theme} />
      </div>
    </div>
  );
}

// ============================================================================
// COMPONENTS - Control Bar
// ============================================================================

interface SyllableCounterProps {
  originalCount: number;
  currentCount: number;
  theme: ThemeClasses;
}

function SyllableCounter({ originalCount, currentCount, theme }: SyllableCounterProps) {
  return (
    <div className={`text-sm ${theme.text}`}>
      Original: <span className="font-bold">{originalCount}</span> | 
      Current: <span className="font-bold">{currentCount}</span>
    </div>
  );
}

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

function ControlBar({ 
  originalCount, 
  currentCount, 
  darkMode, 
  onToggleDarkMode, 
  onUndo, 
  onRedo,
  canUndo,
  canRedo
}: ControlBarProps) {
  const theme = getThemeClasses(darkMode);
  
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

// ============================================================================
// COMPONENTS - Syllable Display
// ============================================================================

interface SyllableButtonProps {
  children: React.ReactNode;
  variant: 'xml' | 'plain';
  theme: ThemeClasses;
  onClick?: () => void;
  disabled?: boolean;
}

function SyllableButton({ children, variant, theme, onClick, disabled }: SyllableButtonProps) {
  const variantClasses = {
    xml: (isDark: boolean) => isDark ? 'bg-gray-700 hover:bg-gray-600' : 'bg-blue-100 hover:bg-blue-200',
    plain: (isDark: boolean) => isDark ? 'bg-gray-800 hover:bg-gray-700' : 'bg-green-100 hover:bg-green-200'
  };

  const isDarkMode = theme.background.includes('gray-900');
  const bgClass = variantClasses[variant](isDarkMode);
  const cursorClass = disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer';

  return (
    <button 
      onClick={onClick}
      disabled={disabled}
      className={`px-3 py-2 ${bgClass} ${theme.text} rounded border ${theme.border} font-mono text-sm whitespace-nowrap ${cursorClass} transition-colors`}
    >
      {children}
    </button>
  );
}

interface SyllableRowProps {
  syllables: string[];
  variant: 'xml' | 'plain';
  theme: ThemeClasses;
  widths?: number[];
  onSyllableClick?: (index: number) => void;
}

function SyllableRow({ syllables, variant, theme, widths, onSyllableClick }: SyllableRowProps) {
  return (
    <div className="flex flex-wrap gap-1">
      {syllables.map((syllable, index) => {
        const isLastSyllable = index === syllables.length - 1;
        
        return (
          <div 
            key={`${variant}-${index}`} 
            className="inline-flex justify-center items-center"
            style={widths ? { minWidth: `${widths[index]}px` } : undefined}
          >
            <SyllableButton 
              variant={variant} 
              theme={theme}
              onClick={onSyllableClick ? () => onSyllableClick(index) : undefined}
              disabled={isLastSyllable}
            >
              {syllable}
            </SyllableButton>
          </div>
        );
      })}
    </div>
  );
}

interface LyricLineProps {
  lineNumber: number;
  lineIndex: number;
  xmlSyllables: string[];
  plainTextSyllables: string[] | undefined;
  theme: ThemeClasses;
  onMergeSyllables: (lineIndex: number, syllableIndex: number, rowType: 'xml' | 'plain') => void;
}

function LyricLine({ lineNumber, lineIndex, xmlSyllables, plainTextSyllables, theme, onMergeSyllables }: LyricLineProps) {
  // Calculate minimum widths for alignment
  const calculateWidth = (text: string) => {
    return Math.max(50, text.length * 8 + 24);
  };

  const widths = React.useMemo(() => {
    if (!plainTextSyllables) return undefined;
    
    const maxLength = Math.max(xmlSyllables.length, plainTextSyllables.length);
    const calculatedWidths: number[] = [];
    
    for (let i = 0; i < maxLength; i++) {
      const xmlWidth = i < xmlSyllables.length ? calculateWidth(xmlSyllables[i]) : 50;
      const plainWidth = i < plainTextSyllables.length ? calculateWidth(plainTextSyllables[i]) : 50;
      calculatedWidths.push(Math.max(xmlWidth, plainWidth));
    }
    
    return calculatedWidths;
  }, [xmlSyllables, plainTextSyllables]);

  return (
    <div className={`p-4 border ${theme.border} rounded-lg`}>
      <div className={`text-xs ${theme.textMuted} mb-2`}>
        Line {lineNumber}
      </div>
      
      <SyllableRow 
        syllables={xmlSyllables} 
        variant="xml" 
        theme={theme} 
        widths={widths}
        onSyllableClick={(syllableIndex) => onMergeSyllables(lineIndex, syllableIndex, 'xml')}
      />
      
      <div className="mb-2" />
      
      {plainTextSyllables ? (
        <SyllableRow 
          syllables={plainTextSyllables} 
          variant="plain" 
          theme={theme} 
          widths={widths}
          onSyllableClick={(syllableIndex) => onMergeSyllables(lineIndex, syllableIndex, 'plain')}
        />
      ) : (
        <span className={`${theme.textMuted} italic text-sm`}>
          No matching plain text line
        </span>
      )}
    </div>
  );
}

interface EmptyStateProps {
  theme: ThemeClasses;
}

function EmptyState({ theme }: EmptyStateProps) {
  return (
    <div className={`text-center py-12 ${theme.textMuted}`}>
      <p className="text-lg">Import XML and plain text files to begin</p>
    </div>
  );
}

interface SyllableDisplayProps {
  state: AppState;
  onMergeSyllables: (lineIndex: number, syllableIndex: number, rowType: 'xml' | 'plain') => void;
}

function SyllableDisplay({ state, onMergeSyllables }: SyllableDisplayProps) {
  const { xmlData, lineGroups, plainTextLines, darkMode } = state;
  const theme = getThemeClasses(darkMode);
  
  if (!xmlData || lineGroups.length === 0) {
    return <EmptyState theme={theme} />;
  }

  return (
    <div className="space-y-6">
      {lineGroups.map((vocalIndices, lineIndex) => {
        const xmlSyllables = vocalIndices.map(idx => state.xmlSyllables[idx]);
        const plainTextSyllables = plainTextLines[lineIndex];
        
        return (
          <LyricLine
            key={lineIndex}
            lineNumber={lineIndex + 1}
            lineIndex={lineIndex}
            xmlSyllables={xmlSyllables}
            plainTextSyllables={plainTextSyllables}
            theme={theme}
            onMergeSyllables={onMergeSyllables}
          />
        );
      })}
    </div>
  );
}

// ============================================================================
// COMPONENTS - Error Display
// ============================================================================

interface ErrorBannerProps {
  message: string;
  onDismiss: () => void;
  darkMode: boolean;
}

function ErrorBanner({ message, onDismiss, darkMode }: ErrorBannerProps) {
  const theme = getThemeClasses(darkMode);
  
  return (
    <div className={`p-4 mb-6 rounded-lg border-2 border-red-500 ${darkMode ? 'bg-red-900/20' : 'bg-red-50'}`}>
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3">
          <AlertCircle className="text-red-500 flex-shrink-0 mt-0.5" size={20} />
          <p className={`${theme.text}`}>{message}</p>
        </div>
        <button
          onClick={onDismiss}
          className={`${theme.text} hover:opacity-70 font-bold`}
          aria-label="Dismiss error"
        >
          ×
        </button>
      </div>
    </div>
  );
}

// ============================================================================
// MAIN APP
// ============================================================================

export default function LyricSmith() {
  const [state, dispatch] = useReducer(reducer, null, createInitialState);
  const theme = getThemeClasses(state.darkMode);

  const handleImportXML = (xmlString: string) => {
    dispatch({ type: ACTION_TYPES.IMPORT_XML, payload: xmlString });
  };

  const handleImportPlainText = (text: string) => {
    dispatch({ type: ACTION_TYPES.IMPORT_PLAIN_TEXT, payload: text });
  };

  const handleToggleDarkMode = () => {
    dispatch({ type: ACTION_TYPES.TOGGLE_DARK_MODE });
  };

  const handleDismissError = () => {
    dispatch({ type: ACTION_TYPES.CLEAR_ERROR });
  };

  const handleMergeSyllables = (lineIndex: number, syllableIndex: number, rowType: 'xml' | 'plain') => {
    dispatch({ 
      type: 'merge_syllables', 
      payload: { lineIndex, syllableIndex, rowType } 
    });
  };

  const handleUndo = () => {
    dispatch({ type: 'undo' });
  };

  const handleRedo = () => {
    dispatch({ type: 'redo' });
  };

  const canUndo = state.historyIndex > 0;
  const canRedo = state.historyIndex < state.history.length - 1;

  return (
    <div className={`min-h-screen ${theme.background} ${theme.text} p-4 md:p-6`}>
      <div className="max-w-7xl mx-auto">
        <header className="mb-8">
          <h1 className="text-3xl font-bold mb-2">RS2014 LyricSmith</h1>
          <p className={theme.textMuted}>
            Replace XML lyrics produced by EOF with characters from any alphabet
          </p>
        </header>

        {state.error && (
          <ErrorBanner 
            message={state.error} 
            onDismiss={handleDismissError}
            darkMode={state.darkMode}
          />
        )}

        <ImportSection
          onImportXML={handleImportXML}
          onImportPlainText={handleImportPlainText}
          darkMode={state.darkMode}
        />

        <ControlBar
          originalCount={state.originalSyllableCount}
          currentCount={state.currentSyllableCount}
          darkMode={state.darkMode}
          onToggleDarkMode={handleToggleDarkMode}
          onUndo={handleUndo}
          onRedo={handleRedo}
          canUndo={canUndo}
          canRedo={canRedo}
        />

        <SyllableDisplay 
          state={state} 
          onMergeSyllables={handleMergeSyllables}
        />
      </div>
    </div>
  );
}