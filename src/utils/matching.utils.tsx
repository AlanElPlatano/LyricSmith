import type { ParsedXMLData } from '../types';
import { normalizeForComparison, segmentTextByAlphabet, splitIntoCharacters } from './text.utils';
import { isLatinText } from './alphabet.utils';

function matchPlainTextToXMLPattern(plainText: string, xmlPattern: string[]): string[] | null {
  const plainTextNoSpaces = plainText.replace(/\s+/g, '');
  const xmlExpected = xmlPattern.map(s => s.replace(/[-+]/g, '')).join('');
  
  const normalizedPlain = normalizeForComparison(plainTextNoSpaces);
  const normalizedXML = normalizeForComparison(xmlExpected);
  
  if (normalizedPlain !== normalizedXML) {
    console.log('Match failed:', { normalizedPlain, normalizedXML });
    return null;
  }
  
  const result: string[] = [];
  let position = 0;
  
  for (let i = 0; i < xmlPattern.length; i++) {
    const xmlSyllable = xmlPattern[i];
    const hasHyphen = xmlSyllable.endsWith('-');
    const cleanXMLSyllable = xmlSyllable.replace(/[-+]/g, '');
    const syllableLength = cleanXMLSyllable.length;
    
    if (position + syllableLength > plainTextNoSpaces.length) {
      console.log('Length mismatch at position', position);
      return null;
    }
    
    let plainSyllable = plainTextNoSpaces.substring(position, position + syllableLength);
    
    if (hasHyphen) {
      plainSyllable += '-';
    }
    
    result.push(plainSyllable);
    position += syllableLength;
  }
  
  return result;
}

function divideLineByXMLPattern(plainTextLine: string, xmlSyllablesForLine: string[]): string[] {
  if (!isLatinText(plainTextLine)) {
    return splitIntoCharacters(plainTextLine);
  }
  
  const matched = matchPlainTextToXMLPattern(plainTextLine, xmlSyllablesForLine);
  
  if (matched) {
    return matched;
  }
  
  const segments = segmentTextByAlphabet(plainTextLine);
  const result: string[] = [];
  let xmlIndex = 0;
  
  for (const segment of segments) {
    if (segment.isLatin && xmlIndex < xmlSyllablesForLine.length) {
      const segmentNoSpaces = segment.text.replace(/\s+/g, '');
      let consumedLength = 0;
      const segmentXMLPattern: string[] = [];
      
      while (xmlIndex < xmlSyllablesForLine.length && consumedLength < segmentNoSpaces.length) {
        const xmlSyll = xmlSyllablesForLine[xmlIndex];
        segmentXMLPattern.push(xmlSyll);
        consumedLength += xmlSyll.replace(/-/g, '').length;
        xmlIndex++;
      }
      
      const segmentMatched = matchPlainTextToXMLPattern(segment.text, segmentXMLPattern);
      
      if (segmentMatched) {
        result.push(...segmentMatched);
      } else {
        result.push(...splitIntoCharacters(segment.text));
      }
    } else {
      result.push(...splitIntoCharacters(segment.text));
    }
  }
  
  return result;
}

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
    const xmlSyllablesForLine = vocalIndices.map(idx => xmlData.vocals[idx].lyric);
    
    const expectedLength = xmlSyllablesForLine
      .map(s => s.replace(/[-+]/g, ''))
      .join('')
      .length;
    
    let charsExtracted = 0;
    let textForLine = '';
    let charsConsumed = 0;
    
    for (let i = 0; i < plainTextStream.length && charsExtracted < expectedLength; i++) {
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
    
    const lineSyllables = divideLineByXMLPattern(textForLine, xmlSyllablesForLine);
    
    result.push(lineSyllables);
    
    plainTextStream = plainTextStream.substring(charsConsumed).trim();
  }
  
  return result;
}