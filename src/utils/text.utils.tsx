import type { AlphabetType } from '../types';
import { UNICODE_RANGES, ALPHABET_TYPES } from '../constants';

const TRAILING_PUNCTUATION = /^[,.!?')\-\u2019\u201D]$/;
const LEADING_PUNCTUATION = /^[(\u201C\u2018]$/;

export function splitIntoCharacters(text: string): string[] {
  const chars: string[] = [];
  let i = 0;

  while (i < text.length) {
    const char = text[i];

    // Skip leading/standalone whitespace
    if (char.trim().length === 0) {
      i++;
      continue;
    }

    // Handle opening punctuation - merge with next character
    if (LEADING_PUNCTUATION.test(char)) {
      let combined = char;
      i++;
      // Collect the next non-whitespace character
      while (i < text.length && text[i].trim().length === 0) {
        i++;
      }
      if (i < text.length) {
        combined += text[i];
        i++;
      }
      // Check for trailing space
      if (i < text.length && text[i] === ' ') {
        combined += ' ';
        i++;
      }
      chars.push(combined);
      continue;
    }

    // Add the character
    let charWithSpace = char;
    i++;

    // Collect any trailing punctuation
    while (i < text.length && TRAILING_PUNCTUATION.test(text[i])) {
      charWithSpace += text[i];
      i++;
    }

    // Check if there's a space after this character (and any punctuation)
    if (i < text.length && text[i] === ' ') {
      charWithSpace += ' ';
      i++;
    }

    chars.push(charWithSpace);
  }

  return chars;
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

export function splitTextBySyllables(text: string, alphabetType: AlphabetType): string[] {
  const isLatinScript = alphabetType === ALPHABET_TYPES.LATIN;
  return isLatinScript ? splitLatinIntoSyllables(text) : splitIntoCharacters(text);
}

function splitIntoNonEmptyLines(text: string): string[] {
  return text.split('\n').filter(line => line.trim().length > 0);
}

export function parseTextIntoSyllables(text: string, alphabetType: AlphabetType): string[][] {
  const lines = splitIntoNonEmptyLines(text);
  return lines.map(line => splitTextBySyllables(line, alphabetType));
}

export function normalizeForComparison(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\u0400-\u04FF\u4E00-\u9FFF\u3040-\u309F\u30A0-\u30FF\u0600-\u06FF]/g, '');
}

export function segmentTextByAlphabet(text: string): Array<{text: string, isLatin: boolean}> {
  const segments: Array<{text: string, isLatin: boolean}> = [];

  if (text.length === 0) return segments;

  // Helper to check if character is Latin (including extended Latin with diacritics)
  const isLatinLetter = (char: string) => /[a-zA-ZÀ-ÿ\u0100-\u017F\u0180-\u024F]/.test(char);
  const isPunctuation = (char: string) => /[.,!?;:'"()\[\]{}\-\u2019\u201D\u2026]/.test(char);
  const isWhitespace = (char: string) => /\s/.test(char);

  let currentIsLatin = isLatinLetter(text[0]) || isPunctuation(text[0]) || isWhitespace(text[0]);
  let currentSegment = '';

  for (let i = 0; i < text.length; i++) {
    const char = text[i];

    // Punctuation and whitespace inherit the type of the previous segment
    // This keeps trailing punctuation with non-Latin text (e.g., "Беги," stays together)
    if (isPunctuation(char) || isWhitespace(char)) {
      currentSegment += char;
      continue;
    }

    const charIsLatin = isLatinLetter(char);

    if (i === 0 || currentSegment === '') {
      currentIsLatin = charIsLatin;
      currentSegment = char;
    } else if (currentIsLatin === charIsLatin) {
      currentSegment += char;
    } else {
      if (currentSegment.trim()) {
        segments.push({ text: currentSegment, isLatin: currentIsLatin });
      }
      currentSegment = char;
      currentIsLatin = charIsLatin;
    }
  }

  if (currentSegment.trim()) {
    segments.push({ text: currentSegment, isLatin: currentIsLatin });
  }

  return segments;
}