export type AlphabetType = 'latin' | 'cyrillic' | 'cjk' | 'arabic';

export interface VocalData {
  time: string;
  note: string;
  length: string;
  lyric: string;
  originalLyric: string;
}

export interface ParsedXMLData {
  header: string;
  vocals: VocalData[];
  count: number;
}

export interface ThemeClasses {
  background: string;
  text: string;
  textMuted: string;
  cardBackground: string;
  border: string;
  inputBackground: string;
  buttonSecondary: string;
}