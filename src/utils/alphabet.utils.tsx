import type { AlphabetType } from '../types';
import { UNICODE_RANGES, ALPHABET_TYPES } from '../constants';

function containsCyrillic(text: string): boolean {
  return UNICODE_RANGES.CYRILLIC.test(text);
}

function containsCJK(text: string): boolean {
  return UNICODE_RANGES.CJK.test(text);
}

function containsArabic(text: string): boolean {
  return UNICODE_RANGES.ARABIC.test(text);
}

export function detectAlphabet(text: string): AlphabetType {
  if (containsCyrillic(text)) return ALPHABET_TYPES.CYRILLIC;
  if (containsCJK(text)) return ALPHABET_TYPES.CJK;
  if (containsArabic(text)) return ALPHABET_TYPES.ARABIC;
  return ALPHABET_TYPES.LATIN;
}

export function isLatinText(text: string): boolean {
  const latinChars = text.match(/[a-zA-Z]/g)?.length || 0;
  const totalChars = text.replace(/\s/g, '').length;
  return totalChars > 0 && (latinChars / totalChars) >= 0.5;
}