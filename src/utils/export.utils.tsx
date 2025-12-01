import type { ParsedXMLData } from '../types';
import { saveFileToFolder } from './file-system.utils';

/**
 * Escapes special XML characters to prevent breaking XML syntax
 */
function escapeXMLAttribute(text: string): string {
  return text
    .replace(/&/g, '&amp;')   // Must be first to avoid double-escaping
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/**
 * Determines if a hyphen should be added between current and next syllable
 * based on the plain text structure. If there's no space between syllables
 * in the reconstructed plain text, they should be connected with a hyphen.
 */
function shouldAddHyphen(
  plainTextSyllables: string[],
  currentIndex: number,
  isLastInLine: boolean
): boolean {
  if (isLastInLine) {
    return false;
  }

  // Check if current and next syllables should be connected
  // by looking at the plain text structure
  const currentSyllable = plainTextSyllables[currentIndex] || '';
  const nextSyllable = plainTextSyllables[currentIndex + 1] || '';

  // If either syllable ends/starts with whitespace, they're separate words
  if (currentSyllable.endsWith(' ') || nextSyllable.startsWith(' ')) {
    return false;
  }

  // If current syllable doesn't end with space and next exists, add hyphen
  return nextSyllable.length > 0;
}

export function generateXMLFromState(
  xmlData: ParsedXMLData,
  lineGroups: number[][],
  plainTextLines: string[][]
): string {
  // Start with the original header
  let xmlOutput = xmlData.header;

  // Open vocals tag
  xmlOutput += '<vocals count="' + xmlData.vocals.length + '">\n';

  // Iterate through each line
  lineGroups.forEach((vocalIndices, lineIndex) => {
    const plainTextSyllables = plainTextLines[lineIndex] || [];

    vocalIndices.forEach((vocalIndex, syllableIndex) => {
      const originalVocal = xmlData.vocals[vocalIndex];
      const newLyric = plainTextSyllables[syllableIndex] || originalVocal.lyric;

      // Determine if this is the last syllable in the line
      const isLastInLine = syllableIndex === vocalIndices.length - 1;

      // Final lyric logic:
      // 1. Determine hyphenation based on plain text structure (preserved spaces)
      // 2. Escape and trim the lyric text for XML output
      // 3. Add hyphen or '+' marker as needed
      const shouldHyphenate = shouldAddHyphen(plainTextSyllables, syllableIndex, isLastInLine);

      // Trim the lyric AFTER checking for spaces (which indicate word boundaries)
      let finalLyric = escapeXMLAttribute(newLyric.trim());

      if (shouldHyphenate) {
        finalLyric += '-';
      }

      if (isLastInLine) {
        finalLyric += '+';
      }

      // Create the vocal element with preserved timing
      xmlOutput += `  <vocal time="${originalVocal.time}" note="${originalVocal.note}" length="${originalVocal.length}" lyric="${finalLyric}"/>\n`;
    });
  });

  // Close vocals tag
  xmlOutput += '</vocals>\n';

  return xmlOutput;
}

export async function downloadXML(content: string, filename: string = 'exported_lyrics.xml'): Promise<void> {
  await saveFileToFolder(content, filename, 'application/xml');
}