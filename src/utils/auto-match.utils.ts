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

  for (let segmentIdx = 0; segmentIdx < segments.length; segmentIdx++) {
    const segment = segments[segmentIdx];

    if (segment.isLatin && xmlIndex < xmlSyllables.length) {
      // For Latin segments (what EOF exports), we can try to auto-match
      const matched = matchLatinSegment(segment.text, xmlSyllables, xmlIndex);
      result.push(...matched.syllables);
      xmlIndex += matched.consumed;
    } else {
      // For non-Latin text, split into characters (preserving spaces)
      const chars = splitIntoCharacters(segment.text);
      result.push(...chars);

      // Check if there's a following Latin segment, if so, find alignment
      const hasFollowingLatinSegment = segments.slice(segmentIdx + 1).some(s => s.isLatin);

      if (hasFollowingLatinSegment) {
        // Don't blindly consume XML syllables, instead, try to find where the next
        // Latin segment aligns in the XML
        const nextLatinSegment = segments.slice(segmentIdx + 1).find(s => s.isLatin);
        if (nextLatinSegment) {
          const alignmentPoint = findXmlAlignmentPoint(
            nextLatinSegment.text,
            xmlSyllables,
            xmlIndex
          );
          if (alignmentPoint !== -1) {
            // We found alignment, so jump to that point
            xmlIndex = alignmentPoint;
          } else {
            // No alignment found, consume based on character count
            xmlIndex += chars.length;
          }
        } else {
          xmlIndex += chars.length;
        }
      } else {
        // No following Latin segment, consume normally
        xmlIndex += chars.length;
      }
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
      cleanXmlSyllable,
      xmlSyllable
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
      // By this point no match found, check if we should stop matching this segment
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
 * Finds the best match between plain text and XML syllable using fuzzy matching with normalization
 * This function tries to match the plain text to the XML syllable including any punctuation that might be present
 */
function findBestMatch(
  plainText: string,
  startIndex: number,
  xmlSyllable: string,
  originalXmlSyllable: string
): { found: boolean; length: number } {
  if (xmlSyllable.trim().length === 0) {
    return { found: false, length: 0 };
  }

  const normalizedXml = normalizeForComparison(xmlSyllable);

  // Check if the original XML syllable has a double-hyphen (one hyphen in-game)
  const hasWordHyphen = originalXmlSyllable.includes('--');

  // Try finding the syllable with some flexibility in length
  // Look ahead up to 2x the XML syllable length (to account for extra punctuation/spaces)
  const maxLength = Math.min(
    Math.max(xmlSyllable.length * 2, 20),
    plainText.length - startIndex
  );

  // Try exact length match first (most common case)
  const exactSubstring = plainText.substring(startIndex, startIndex + xmlSyllable.length);
  if (normalizeForComparison(exactSubstring) === normalizedXml) {
    // If XML has a word hyphen, check if plain text has a hyphen after the match
    if (hasWordHyphen) {
      const nextChar = plainText[startIndex + xmlSyllable.length];
      if (nextChar === '-') {
        return { found: true, length: xmlSyllable.length + 1 };
      }
    }
    return { found: true, length: xmlSyllable.length };
  }

  // Try different lengths to find the best match
  for (let len = 1; len <= maxLength; len++) {
    const substring = plainText.substring(startIndex, startIndex + len);
    const normalizedSubstring = normalizeForComparison(substring);

    // Exact match of normalized content
    if (normalizedSubstring === normalizedXml) {
      // If XML has a word hyphen, check if plain text has a hyphen after the match
      if (hasWordHyphen) {
        const nextChar = plainText[startIndex + len];
        if (nextChar === '-') {
          return { found: true, length: len + 1 };
        }
      }
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
 * Attempts to auto-merge remaining syllables in a line after a manual merge
 * This enables progressive auto-merging: after a user manually merges non-Latin
 * characters, any remaining Latin text can be automatically matched
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

  // Check if there's any Latin text in the remaining portion
  // Even if it's not primarily Latin, we should try to auto-match Latin words
  const hasLatinText = /[a-zA-Z]/.test(remainingText);
  if (!hasLatinText) {
    return plainTextSyllables;
  }

  // Find the correct starting position in XML syllables by searching for alignment
  // This handles cases where plain text and XML syllables are not 1:1 aligned
  // We search from index 0 because we don't know where we are in the XML after merging
  const xmlStartIndex = findXmlAlignmentPoint(
    remainingText,
    xmlSyllables,
    0
  );

  if (xmlStartIndex === -1) {
    // No alignment found, try the original approach as fallback
    const remainingXmlSyllables = xmlSyllables.slice(checkFromIndex);
    if (remainingXmlSyllables.length === 0) {
      return plainTextSyllables;
    }

    const autoMerged = autoMatchSyllables(remainingText, remainingXmlSyllables);
    if (autoMerged.length >= remainingSyllables.length) {
      return plainTextSyllables;
    }

    const prefix = plainTextSyllables.slice(0, checkFromIndex);
    return [...prefix, ...autoMerged];
  }

  // Use the aligned XML syllables for matching
  const remainingXmlSyllables = xmlSyllables.slice(xmlStartIndex);

  if (remainingXmlSyllables.length === 0) {
    return plainTextSyllables;
  }

  // Try to auto-match the remaining text
  const autoMerged = autoMatchSyllables(remainingText, remainingXmlSyllables);

  // Only apply if we actually reduced the syllable count
  if (autoMerged.length >= remainingSyllables.length) {
    return plainTextSyllables;
  }

  // Keep syllables up to and including mergedIndex + auto-merged result
  const prefix = plainTextSyllables.slice(0, checkFromIndex);
  return [...prefix, ...autoMerged];
}

/**
 * Finds the correct alignment point in XML syllables for the remaining plain text.
 * Searches for a Latin word in the remaining text and finds its position in XML.
 *
 * @param remainingText - The remaining plain text to align
 * @param xmlSyllables - All XML syllables for the line
 * @param startSearchFrom - Index to start searching from in XML syllables
 * @returns Index in xmlSyllables where alignment is found, or -1 if not found
 */
function findXmlAlignmentPoint(
  remainingText: string,
  xmlSyllables: string[],
  startSearchFrom: number
): number {
  // Extract the first Latin word from remaining text
  // We need to skip any leading punctuation and whitespace first
  const trimmedText = remainingText.trimStart();

  // Match the first sequence of Latin letters (including extended Latin like ß, ö, ä, etc.)
  // Stop at whitespace or when we hit non-Latin characters
  // Include À-ÿ (U+00C0 to U+00FF) and other extended Latin ranges
  const latinWordMatch = trimmedText.match(/[a-zA-ZÀ-ÿ\u0100-\u017F\u0180-\u024F]+/);
  if (!latinWordMatch) {
    return -1;
  }

  const firstLatinWord = latinWordMatch[0];
  const normalizedWord = normalizeForComparison(firstLatinWord);

  // Search for this word in XML syllables starting from startSearchFrom
  for (let i = startSearchFrom; i < xmlSyllables.length; i++) {
    const xmlSyllable = xmlSyllables[i]; // Keep original to check for hyphen
    const cleanedXml = cleanSyllable(xmlSyllable);
    const normalizedXml = normalizeForComparison(cleanedXml);

    // Check if this XML syllable matches the start of the Latin word
    // We need to be careful: "and" should match "and" but not match "A-"
    // Steps:
    // 1. If XML syllable starts with the word, it's a match (e.g., "and" matches "and")
    // 2. If word starts with XML syllable AND the syllable ends with hyphen (incomplete)
    //    AND the syllable is at least 2 chars (to avoid single-char false matches),
    //    it's a match (e.g., "screen" matches "sc-" or "scr-" but NOT "a-")
    // 3. Otherwise, no match (e.g., "deep" should NOT match "de" without hyphen)
    if (normalizedXml.startsWith(normalizedWord)) {
      // XML syllable starts with the word (e.g., "and" matches "and" or "anderson")
      return i;
    } else if (normalizedWord.startsWith(normalizedXml) && xmlSyllable.endsWith('-') && normalizedXml.length >= 2) {
      // Word starts with XML syllable, syllable is incomplete (ends with hyphen), and syllable is 2+ chars
      // (e.g., "screen" matches "sc-" but "and" does NOT match "a-")
      return i;
    }
  }

  return -1;
}
