import type { ParsedXMLData } from '../types';
import { splitIntoCharacters } from './text.utils';

export function parseTextIntoSyllablesWithXMLReference(
  plainText: string,
  xmlData: ParsedXMLData | null,
  lineGroups: number[][],
  fallbackParser: (text: string) => string[][]
): string[][] {
  if (!xmlData || lineGroups.length === 0) {
    return fallbackParser(plainText);
  }

  let plainTextStream = plainText.replace(/\n+/g, ' ').trim();

  if (!plainTextStream) {
    return [];
  }

  const result: string[][] = [];

  for (let lineIndex = 0; lineIndex < lineGroups.length; lineIndex++) {
    const vocalIndices = lineGroups[lineIndex];
    const xmlSyllableCount = vocalIndices.length;

    let charsExtracted = 0;
    let textForLine = '';
    let charsConsumed = 0;

    for (let i = 0; i < plainTextStream.length && charsExtracted < xmlSyllableCount; i++) {
      const char = plainTextStream[i];
      textForLine += char;
      charsConsumed++;

      if (char.trim()) {
        charsExtracted++;
      }
    }

    textForLine = textForLine.trim();

    if (textForLine.length === 0 && plainTextStream.length > 0) {
      textForLine = plainTextStream.trim();
      charsConsumed = plainTextStream.length;
    }

    const lineSyllables = splitIntoCharacters(textForLine);

    result.push(lineSyllables);

    plainTextStream = plainTextStream.substring(charsConsumed).trim();
  }

  return result;
}