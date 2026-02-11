export type ToneType = 'street' | 'respectful';
export type DirectionType = 'english-to-pidgin' | 'pidgin-to-english';

export interface TranslationResult {
  id: string;
  original: string;
  translated: string;
  tone: ToneType;
  direction?: DirectionType;
  timestamp: number;
}

export interface TranslationError {
  message: string;
}