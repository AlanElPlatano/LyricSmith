import type { ParsedXMLData } from '../types';
import { saveFileToFolder } from './file-system.utils';
import { normalizeForComparison } from './text.utils';

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
 * Extracts prefix (non-alphanumeric chars at start) and suffix (non-alphanumeric chars at end)
 * from a lyric string, preserving special characters like quotes, punctuation, etc.
 */
function extractLyricParts(lyric: string): { prefix: string; core: string; suffix: string } {
  // Match leading non-alphanumeric chars (excluding hyphens and plus)
  const prefixMatch = lyric.match(/^[^a-zA-Z0-9\-+\u00C0-\u024F\u1E00-\u1EFF]+/);
  const prefix = prefixMatch ? prefixMatch[0] : '';

  // Match trailing non-alphanumeric chars (excluding hyphens and plus)
  const suffixMatch = lyric.match(/[^a-zA-Z0-9\-+\u00C0-\u024F\u1E00-\u1EFF]+$/);
  const suffix = suffixMatch ? suffixMatch[0] : '';

  // Core is everything between prefix and suffix
  const core = lyric.substring(prefix.length, lyric.length - suffix.length);

  return { prefix, core, suffix };
}

/**
 * Determines if a hyphen should be added between current and next syllable
 * based on the plain text structure. If there's no space between syllables
 * in the reconstructed plain text, they should be connected with a hyphen.
 */
function shouldAddHyphen(
  plainTextSyllables: string[],
  currentIndex: number,
  isLastInLine: boolean,
  currentLyricText: string
): boolean {
  if (isLastInLine) {
    return false;
  }

  // Check if current and next syllables should be connected
  // by looking at the plain text structure
  const currentSyllable = plainTextSyllables[currentIndex] || '';
  const nextSyllable = plainTextSyllables[currentIndex + 1] || '';

  // If current syllable ends with whitespace, they're separate words - NO hyphen
  if (currentSyllable.endsWith(' ') || currentSyllable.trimEnd() !== currentSyllable) {
    return false;
  }

  // If next syllable starts with whitespace, they're separate words - NO hyphen
  if (nextSyllable.startsWith(' ')) {
    return false;
  }

  // Check if the current syllable is empty (after trimming)
  // If so, don't add hyphen
  if (currentLyricText.trim().length === 0) {
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
      const plainTextSyllable = plainTextSyllables[syllableIndex];

      // Determine if this is the last syllable in the line
      const isLastInLine = syllableIndex === vocalIndices.length - 1;

      // Extract the original lyric and parse it for special characters
      const originalLyricParts = extractLyricParts(originalVocal.lyric);

      // Check if the plain text syllable is actually different from the original
      // Compare the core content (without markers AND trailing hyphens/plus) - exact comparison including case and accents
      // We strip trailing hyphens and plus because those are syllable connectors/markers, not content
      const originalCoreWithoutMarkers = originalLyricParts.core.replace(/[-+]+$/, '');
      const plainTextTrimmed = plainTextSyllable ? plainTextSyllable.trim().replace(/[-+]+$/, '') : '';
      const hasActualChange = plainTextSyllable !== undefined &&
                              plainTextSyllable !== null &&
                              plainTextTrimmed !== '' &&
                              originalCoreWithoutMarkers !== plainTextTrimmed;

      let finalLyric: string;

      if (hasActualChange) {
        // We have a REAL replacement from plain text (syllable content changed)
        // Preserve prefix from original, replace core content
        const rawReplacement = plainTextSyllable!;
        const hasTrailingSpace = rawReplacement !== rawReplacement.trimEnd();
        let trimmedReplacement = rawReplacement.trim();

        // Remove leading hyphen if present - hyphens are connectors, not content
        // (e.g., auto-match might produce "-e" from "Tesz-e", but we only want "e")
        if (trimmedReplacement.startsWith('-')) {
          trimmedReplacement = trimmedReplacement.substring(1);
        }

        // Determine if we should add a hyphen:
        // - If the plain text has a trailing space, NO hyphen (word boundary)
        // - Otherwise, check plain text structure
        const shouldHyphenate = !hasTrailingSpace &&
                                shouldAddHyphen(plainTextSyllables, syllableIndex, isLastInLine, trimmedReplacement);

        // Build the final lyric: prefix + new core + hyphen(s) if needed
        let lyricContent = originalLyricParts.prefix + trimmedReplacement;

        if (shouldHyphenate) {
          // Check if the lyric already ends with a hyphen (part of the text content)
          // If so, add another hyphen (double hyphen case: "Tesz-" + "-" = "Tesz--")
          if (lyricContent.endsWith('-')) {
            lyricContent += '-';
          } else {
            lyricContent += '-';
          }
        }

        // Add the line-end marker
        if (isLastInLine) {
          lyricContent += '+';
        }

        finalLyric = escapeXMLAttribute(lyricContent);
      } else {
        // No change - keep original lyric exactly as-is, only adjust the + marker
        let lyricContent = originalVocal.lyric;

        // Remove any existing + marker
        if (lyricContent.endsWith('+')) {
          lyricContent = lyricContent.slice(0, -1);
        }

        // Add + marker only if this is the last syllable in the line
        if (isLastInLine) {
          lyricContent += '+';
        }

        finalLyric = escapeXMLAttribute(lyricContent);
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