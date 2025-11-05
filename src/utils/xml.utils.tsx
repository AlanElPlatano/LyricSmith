import type { VocalData, ParsedXMLData } from '../types';

export function extractXMLHeader(xmlString: string): string {
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

export function parseXML(xmlString: string): ParsedXMLData {
  const xmlDocument = parseXMLString(xmlString);
  const header = extractXMLHeader(xmlString);
  const vocals = parseVocalsFromXML(xmlDocument);
  
  return {
    header,
    vocals,
    count: vocals.length
  };
}

export function groupVocalsIntoLines(vocals: VocalData[]): number[][] {
  const lines: number[][] = [];
  let currentLine: number[] = [];
  
  vocals.forEach((vocal, index) => {
    currentLine.push(index);
    
    if (vocal.lyric.endsWith('+')) {
      lines.push(currentLine);
      currentLine = [];
    }
  });
  
  if (currentLine.length > 0) {
    lines.push(currentLine);
  }
  
  return lines;
}

export function mergeVocalsInXMLData(vocals: VocalData[], firstIndex: number): VocalData[] {
  if (firstIndex >= vocals.length - 1) return vocals;
  
  const newVocals = [...vocals];
  const first = vocals[firstIndex];
  const second = vocals[firstIndex + 1];
  
  const mergedLyric = first.lyric.replace(/-$/, '') + second.lyric;
  
  const startTime = parseFloat(first.time);
  const secondEndTime = parseFloat(second.time) + parseFloat(second.length);
  const combinedLength = (secondEndTime - startTime).toFixed(3);
  
  newVocals[firstIndex] = {
    ...first,
    lyric: mergedLyric,
    length: combinedLength
  };
  
  newVocals.splice(firstIndex + 1, 1);
  
  return newVocals;
}

export function updateLineGroupsAfterMerge(
  lineGroups: number[][],
  lineIndex: number,
  mergedVocalIndex: number
): number[][] {
  const newLineGroups = lineGroups.map(group => [...group]);
  const targetGroup = newLineGroups[lineIndex];
  
  const positionInLine = targetGroup.indexOf(mergedVocalIndex);
  if (positionInLine === -1) return newLineGroups;
  
  targetGroup.splice(positionInLine + 1, 1);
  
  for (let i = 0; i < newLineGroups.length; i++) {
    newLineGroups[i] = newLineGroups[i].map(idx => 
      idx > mergedVocalIndex ? idx - 1 : idx
    );
  }
  
  return newLineGroups;
}