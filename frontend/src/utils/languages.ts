const LANGUAGE_MAP: Record<string, string> = {
  ko: 'Korean',
  en: 'English',
  ru: 'Russian',
  ky: 'Kyrgyz',
  ja: 'Japanese',
  zh: 'Chinese',
}

export function getLanguageNames(languagePair: string): { source: string; target: string } {
  const [src, tgt] = languagePair.split('-')
  return {
    source: LANGUAGE_MAP[src] || src.toUpperCase(),
    target: LANGUAGE_MAP[tgt] || tgt.toUpperCase(),
  }
}
