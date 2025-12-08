import { normalizeForComparison, segmentTextByAlphabet, splitIntoCharacters } from './text.utils';

/**
 * Attempts to automatically match plain text syllables to XML syllables
 * by comparing normalized text content. Works best with Latin alphabet text.
 *
 * @param plainTextLine - The plain text line to split into syllables
 * @param xmlSyllables - The XML syllables for this line (with hyphens and markers)
 * @returns Array of matched syllables from plain text
 */
export function autoMatchSyllables(
  plainTextLine: string,
  xmlSyllables: string[]
): string[] {
  if (!plainTextLine.trim() || xmlSyllables.length === 0) {
    return splitIntoCharacters(plainTextLine);
  }

  // Segment the text by alphabet (Latin vs non-Latin)
  const segments = segmentTextByAlphabet(plainTextLine);
  const result: string[] = [];
  let xmlIndex = 0;

  for (const segment of segments) {
    if (segment.isLatin && xmlIndex < xmlSyllables.length) {
      // Try to auto-match Latin text
      const matched = matchLatinSegment(segment.text, xmlSyllables, xmlIndex);
      result.push(...matched.syllables);
      xmlIndex += matched.consumed;
    } else {
      // For non-Latin text, split into characters (preserving spaces)
      const chars = splitIntoCharacters(segment.text);
      result.push(...chars);
      // Still consume XML syllables for non-Latin characters
      xmlIndex += chars.length;
    }
  }

  return result;
}

/**
 * Matches a Latin text segment against XML syllables
 */
function matchLatinSegment(
  plainText: string,
  xmlSyllables: string[],
  startIndex: number
): { syllables: string[]; consumed: number } {
  const result: string[] = [];
  let plainTextIndex = 0;
  let xmlIndex = startIndex;
  const plainTextTrimmed = plainText.trim();

  while (plainTextIndex < plainTextTrimmed.length && xmlIndex < xmlSyllables.length) {
    const xmlSyllable = xmlSyllables[xmlIndex];
    const cleanXmlSyllable = cleanSyllable(xmlSyllable);

    // Try to find a match starting from current position
    const match = findBestMatch(
      plainTextTrimmed,
      plainTextIndex,
      cleanXmlSyllable
    );

    if (match.found) {
      // Extract the matched portion from plain text
      let matchedText = plainTextTrimmed.substring(
        plainTextIndex,
        plainTextIndex + match.length
      );
      plainTextIndex += match.length;

      // Check if there's whitespace after the matched syllable
      const hasSpaceAfter = plainTextIndex < plainTextTrimmed.length && plainTextTrimmed[plainTextIndex] === ' ';

      // Skip any whitespace after the matched syllable
      while (plainTextIndex < plainTextTrimmed.length && plainTextTrimmed[plainTextIndex] === ' ') {
        plainTextIndex++;
      }

      // Preserve space information by adding it to the syllable text
      if (hasSpaceAfter) {
        matchedText += ' ';
      }

      result.push(matchedText);
      xmlIndex++;
    } else {
      // No match found, check if we should stop matching this segment
      // This handles cases where the writing system changes mid-segment
      const remainingText = plainTextTrimmed.substring(plainTextIndex);

      // If we can't match anymore, split remaining into characters and stop
      if (remainingText.trim().length > 0) {
        const chars = splitIntoCharacters(remainingText);
        result.push(...chars);
        plainTextIndex = plainTextTrimmed.length; // Mark as fully consumed
      }
      break;
    }
  }

  // Handle any remaining plain text that wasn't matched
  // (only if we exited the loop normally, not via break)
  if (plainTextIndex < plainTextTrimmed.length) {
    const remaining = plainTextTrimmed.substring(plainTextIndex);
    const chars = splitIntoCharacters(remaining);
    result.push(...chars);
  }

  return {
    syllables: result,
    consumed: xmlIndex - startIndex
  };
}

/**
 * Removes syllable markers (-, +) from XML syllables
 */
function cleanSyllable(syllable: string): string {
  return syllable.replace(/[-+]/g, '');
}

/**
 * Finds the best match between plain text and XML syllable
 * using fuzzy matching with normalization.
 * This function tries to match the plain text to the XML syllable,
 * including any punctuation that might be present.
 */
function findBestMatch(
  plainText: string,
  startIndex: number,
  xmlSyllable: string
): { found: boolean; length: number } {
  if (xmlSyllable.trim().length === 0) {
    return { found: false, length: 0 };
  }

  const normalizedXml = normalizeForComparison(xmlSyllable);

  // Try finding the syllable with some flexibility in length
  // Look ahead up to 2x the XML syllable length (to account for extra punctuation/spaces)
  const maxLength = Math.min(
    Math.max(xmlSyllable.length * 2, 20),
    plainText.length - startIndex
  );

  // Try exact length match first (most common case)
  const exactSubstring = plainText.substring(startIndex, startIndex + xmlSyllable.length);
  if (normalizeForComparison(exactSubstring) === normalizedXml) {
    return { found: true, length: xmlSyllable.length };
  }

  // Try different lengths to find the best match
  for (let len = 1; len <= maxLength; len++) {
    const substring = plainText.substring(startIndex, startIndex + len);
    const normalizedSubstring = normalizeForComparison(substring);

    // Exact match of normalized content
    if (normalizedSubstring === normalizedXml) {
      return { found: true, length: len };
    }
  }

  return { found: false, length: 0 };
}

/**
 * Checks if a line is primarily Latin text
 */
export function isPrimarylyLatin(text: string): boolean {
  const latinChars = (text.match(/[a-zA-Z]/g) || []).length;
  const totalChars = text.replace(/\s/g, '').length;
  return totalChars > 0 && latinChars / totalChars > 0.5;
}

/**
 * Attempts to auto-merge remaining syllables in a line after a manual merge.
 * This enables progressive auto-merging: after a user manually merges non-Latin
 * characters, any remaining Latin text can be automatically matched.
 *
 * @param plainTextSyllables - Current syllables in the plain text line
 * @param xmlSyllables - XML syllables for this line
 * @param mergedIndex - Index of the syllable that was just merged
 * @returns New array of syllables with auto-merging applied, or original if no improvement
 */
export function tryAutoMergeRemainingLine(
  plainTextSyllables: string[],
  xmlSyllables: string[],
  mergedIndex: number
): string[] {
  // Check from the syllable AFTER the one just merged
  const checkFromIndex = mergedIndex + 1;

  // Nothing to merge if we're at or past the end
  if (checkFromIndex >= plainTextSyllables.length) {
    return plainTextSyllables;
  }

  // Get the remaining portion of the line (after the merged syllable)
  const remainingSyllables = plainTextSyllables.slice(checkFromIndex);
  const remainingText = remainingSyllables.join('');

  // Only attempt auto-merge if remaining text is primarily Latin
  if (!isPrimarylyLatin(remainingText)) {
    return plainTextSyllables;
  }

  // Get corresponding XML syllables (from checkFromIndex onwards)
  const remainingXmlSyllables = xmlSyllables.slice(checkFromIndex);

  if (remainingXmlSyllables.length === 0) {
    return plainTextSyllables;
  }

  // Try to auto-match the remaining text
  const autoMerged = autoMatchSyllables(remainingText, remainingXmlSyllables);

  // Only apply if we actually reduced the syllable count
  if (autoMerged.length >= remainingSyllables.length) {
    return plainTextSyllables;
  }

  // Combine: keep syllables up to and including mergedIndex + auto-merged result
  const prefix = plainTextSyllables.slice(0, checkFromIndex);
  return [...prefix, ...autoMerged];
}
