import type { AlphabetType } from '../types';

export const ALPHABET_TYPES: Record<string, AlphabetType> = {
  LATIN: 'latin',
  CYRILLIC: 'cyrillic',
  CJK: 'cjk',
  ARABIC: 'arabic'
};

export const UNICODE_RANGES = {
  CYRILLIC: /[\u0400-\u04FF]/,
  CJK: /[\u4E00-\u9FFF\u3040-\u309F\u30A0-\u30FF]/,
  ARABIC: /[\u0600-\u06FF]/,
  LATIN_VOWELS: /[aeiouAEIOU]/
};

export const LINE_END_MARKER = '+';
export const SYLLABLE_SEPARATOR = '-';

export const ACTION_TYPES = {
  IMPORT_XML: 'import_xml' as const,
  IMPORT_PLAIN_TEXT: 'import_plain_text' as const,
  TOGGLE_DARK_MODE: 'toggle_dark_mode' as const,
  SET_ERROR: 'set_error' as const,
  CLEAR_ERROR: 'clear_error' as const,
  START_RECORDING: 'start_recording' as const,
  STOP_RECORDING: 'stop_recording' as const,
  CLEAR_RECORDING: 'clear_recording' as const,
  SET_RECORDING_TEST_NAME: 'set_recording_test_name' as const
};