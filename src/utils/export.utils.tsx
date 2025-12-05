import type { ParsedXMLData } from '../types';
import { saveFileToFolder } from './file-system.utils';
import { detectAlphabet } from './alphabet.utils';
import { ALPHABET_TYPES } from '../constants';

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
 * NOTE: Suffix is extracted BEFORE markers (- and +), so "za"+" will have suffix = '"'
 */
function extractLyricParts(lyric: string): { prefix: string; core: string; suffix: string } {
  // Match leading non-alphanumeric chars (excluding hyphens and plus)
  const prefixMatch = lyric.match(/^[^a-zA-Z0-9\-+\u00C0-\u024F\u1E00-\u1EFF\u0400-\u04FF\u3040-\u30FF\u4E00-\u9FFF]+/);
  const prefix = prefixMatch ? prefixMatch[0] : '';

  // First, temporarily remove markers (- and +) from the end to find suffix
  const withoutMarkers = lyric.replace(/[-+]+$/, '');

  // Match trailing non-alphanumeric chars (after removing markers)
  const suffixMatch = withoutMarkers.match(/[^a-zA-Z0-9\u00C0-\u024F\u1E00-\u1EFF\u0400-\u04FF\u3040-\u30FF\u4E00-\u9FFF]+$/);
  const suffix = suffixMatch ? suffixMatch[0] : '';

  // Core is the lyric without prefix and without suffix, but still including markers
  // Calculate: from end of prefix to (end of withoutMarkers - suffix length) + add back markers
  const markers = lyric.substring(withoutMarkers.length); // Get the markers that were removed
  const coreWithoutMarkers = withoutMarkers.substring(prefix.length, withoutMarkers.length - suffix.length);
  const core = coreWithoutMarkers + markers;

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

  // Check if there's a next syllable
  const nextSyllable = plainTextSyllables[currentIndex + 1];
  if (!nextSyllable || nextSyllable.length === 0) {
    return false;
  }

  // Check if the current syllable is empty (after trimming)
  if (currentLyricText.trim().length === 0) {
    return false;
  }

  const currentSyllable = plainTextSyllables[currentIndex] || '';

  // If current syllable ends with whitespace, they're separate words - NO hyphen
  if (currentSyllable.endsWith(' ') || currentSyllable.trimEnd() !== currentSyllable) {
    return false;
  }

  // If next syllable starts with whitespace, they're separate words - NO hyphen
  if (nextSyllable.startsWith(' ') || nextSyllable.trimStart() !== nextSyllable) {
    return false;
  }

  // Both syllables are non-empty and neither has separating whitespace - add hyphen
  return true;
}

export function generateXMLFromState(
  xmlData: ParsedXMLData,
  lineGroups: number[][],
  plainTextLines: string[][]
): string {
  // Start with the original header
  let xmlOutput = xmlData.header;

  // Detect the alphabet type from plain text to determine hyphenation rules
  const allPlainText = plainTextLines.flat().join('');
  const alphabetType = detectAlphabet(allPlainText);
  const isLatinBasedScript = alphabetType === ALPHABET_TYPES.LATIN ||
                             alphabetType === ALPHABET_TYPES.CYRILLIC;

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
        const rawReplacement = plainTextSyllable!;
        const hasTrailingSpace = rawReplacement !== rawReplacement.trimEnd();
        let trimmedReplacement = rawReplacement.trim();

        // Remove leading hyphen if present - hyphens are connectors, not content
        // (e.g., auto-match might produce "-e" from "Tesz-e", but we only want "e")
        if (trimmedReplacement.startsWith('-')) {
          trimmedReplacement = trimmedReplacement.substring(1);
        }

        // Check if the replacement text starts with a quote or other special prefix
        // If so, DON'T add the original prefix (avoids double quotes)
        const replacementHasPrefix = /^[^a-zA-Z0-9\u00C0-\u024F\u1E00-\u1EFF\u0400-\u04FF\u3040-\u30FF\u4E00-\u9FFF]+/.test(trimmedReplacement);
        const prefixToUse = replacementHasPrefix ? '' : originalLyricParts.prefix;

        // Check if the replacement text has a suffix (like a comma or quote)
        // If so, DON'T add the original suffix (avoids double commas/quotes)
        const replacementHasSuffix = /[^a-zA-Z0-9\u00C0-\u024F\u1E00-\u1EFF\u0400-\u04FF\u3040-\u30FF\u4E00-\u9FFF]+$/.test(trimmedReplacement);

        // Only preserve specific musical notation characters (quotes for fermatas)
        // Don't preserve content-related suffixes like ?, !, etc.
        const musicalNotationPattern = /^["]+$/;
        const isMusicalNotation = originalLyricParts.suffix && musicalNotationPattern.test(originalLyricParts.suffix);
        const suffixToUse = replacementHasSuffix ? '' : (isMusicalNotation ? originalLyricParts.suffix : '');

        // Check if the original lyric had a hyphen (before markers like + or -)
        // The original XML already contains correct word boundary information for Latin-based scripts
        const originalHadHyphen = /-(?=[-+]*$)/.test(originalLyricParts.core);

        // Determine if we should add a hyphen:
        // For Latin-based scripts (Latin, Cyrillic):
        //   1. Preserve original structure: if original had no hyphen, don't add one
        //   2. If the plain text has a trailing space, NO hyphen (word boundary)
        //   3. Otherwise, check plain text structure
        // For CJK scripts (Japanese, Chinese, Korean):
        //   - Ignore original hyphenation, use plain text structure only
        //   - Each character is a syllable and needs hyphens between them
        const shouldHyphenate = !hasTrailingSpace &&
                                shouldAddHyphen(plainTextSyllables, syllableIndex, isLastInLine, trimmedReplacement) &&
                                (isLatinBasedScript ? originalHadHyphen : true);

        // Build the final lyric: prefix + new core + suffix (if original had one and replacement doesn't) + hyphen(s) if needed
        let lyricContent = prefixToUse + trimmedReplacement + suffixToUse;

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
      } else{
        // No change - preserve original lyric structure, only adjust + marker position
        let lyricContent = originalVocal.lyric;

        // Strategy: Only touch the + marker, preserve everything else including quotes and hyphens
        // Remove the + marker if present
        let contentWithoutPlus = lyricContent.replace(/\+$/, '');

        // If this is the last syllable in the line, we need to add + back
        // But first, we need to handle the case where there's a quote before the +
        // Example: "za"+" should become "za"+" (keep the quote)

        if (isLastInLine) {
          // Add the + marker
          // But we need to check if there's a trailing hyphen that should be removed
          // when adding the + (because - and + don't coexist at the end)
          // Actually, the original might have had "+", so we just add it back
          finalLyric = escapeXMLAttribute(contentWithoutPlus + '+');
        } else {
          // Not last in line - keep as-is without the +
          finalLyric = escapeXMLAttribute(contentWithoutPlus);
        }
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