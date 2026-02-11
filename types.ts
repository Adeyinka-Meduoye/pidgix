export type ToneType = 'street' | 'respectful';

export interface TranslationResult {
  id: string;
  original: string;
  translated: string;
  tone: ToneType;
  timestamp: number;
}

export interface TranslationError {
  message: string;
}
