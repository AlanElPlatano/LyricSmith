import type { AlphabetType } from '../types';
import { UNICODE_RANGES, ALPHABET_TYPES } from '../constants';

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

    // Add the character
    let charWithSpace = char;
    i++; // Move to next position

    // Check if there's a space after this character
    if (i < text.length && text[i] === ' ') {
      charWithSpace += ' ';
      i++; // Skip the space
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

  // Helper to check if character is Latin (including extended Latin) or punctuation/whitespace
  const isLatinOrPunctuation = (char: string) => /[a-zA-ZÀ-ÿ\u0100-\u017F\u0180-\u024F\s.,!?;:'"()\[\]{}\-\u2019\u201D\u2026]/.test(char);

  let currentIsLatin = isLatinOrPunctuation(text[0]);
  let currentSegment = '';

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const charIsLatin = isLatinOrPunctuation(char);

    if (i === 0) {
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