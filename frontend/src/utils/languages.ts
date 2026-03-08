const LANGUAGE_MAP: Record<string, Record<string, string>> = {
  en: { ko: 'Korean', en: 'English', ru: 'Russian', ky: 'Kyrgyz', ja: 'Japanese', zh: 'Chinese' },
  ru: { ko: 'Корейский', en: 'Английский', ru: 'Русский', ky: 'Кыргызский', ja: 'Японский', zh: 'Китайский' },
  ko: { ko: '한국어', en: '영어', ru: '러시아어', ky: '키르기스어', ja: '일본어', zh: '중국어' },
}

const LANGUAGE_MAP_PREP: Record<string, Record<string, string>> = {
  ru: { ko: 'корейском', en: 'английском', ru: 'русском', ky: 'кыргызском', ja: 'японском', zh: 'китайском' },
}

export function getLanguageNames(languagePair: string, appLanguage: string = 'en'): { source: string; target: string; sourcePrep: string; targetPrep: string } {
  const [src, tgt] = languagePair.split('-')
  const map = LANGUAGE_MAP[appLanguage] || LANGUAGE_MAP.en
  const prepMap = LANGUAGE_MAP_PREP[appLanguage]
  const source = map[src] || src.toUpperCase()
  const target = map[tgt] || tgt.toUpperCase()
  return {
    source,
    target,
    sourcePrep: prepMap?.[src] || source,
    targetPrep: prepMap?.[tgt] || target,
  }
}
