import type { ParsedXMLData } from '../types';
import { splitIntoCharacters } from './text.utils';
import { autoMatchSyllables, isPrimarylyLatin } from './auto-match.utils';

export function parseTextIntoSyllablesWithXMLReference(
  plainText: string,
  xmlData: ParsedXMLData | null,
  lineGroups: number[][],
  fallbackParser: (text: string) => string[][]
): string[][] {
  if (!xmlData || lineGroups.length === 0) {
    return fallbackParser(plainText);
  }

  // Split the plain text by lines (preserve line breaks from user input)
  const plainTextLines = plainText.split('\n').filter(line => line.trim().length > 0);

  const result: string[][] = [];

  // Match each plain text line to each XML line
  for (let lineIndex = 0; lineIndex < lineGroups.length; lineIndex++) {
    if (lineIndex < plainTextLines.length) {
      const plainTextLine = plainTextLines[lineIndex];
      const vocalIndices = lineGroups[lineIndex];

      // Get XML syllables for this line
      const xmlSyllables = vocalIndices.map(index => xmlData.vocals[index].lyric);

      // Try auto-matching for Latin text, otherwise fall back to character splitting
      const lineSyllables = isPrimarylyLatin(plainTextLine)
        ? autoMatchSyllables(plainTextLine, xmlSyllables)
        : splitIntoCharacters(plainTextLine);

      result.push(lineSyllables);
    } else {
      // If we run out of plain text lines, add empty array
      result.push([]);
    }
  }

  return result;
}