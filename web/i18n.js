import en from './locales/en.js';
import pl from './locales/pl.js';
import tl from './locales/tl.js';
import es from './locales/es.js';
import pt from './locales/pt.js';
import fr from './locales/fr.js';
import de from './locales/de.js';
import it from './locales/it.js';
import ru from './locales/ru.js';
import ar from './locales/ar.js';
import hi from './locales/hi.js';
import zhCN from './locales/zh-CN.js';
import ja from './locales/ja.js';
import ko from './locales/ko.js';
import id from './locales/id.js';
import bn from './locales/bn.js';

export const LANGUAGES = Object.freeze([
  { code: 'pl', name: 'Polski', short: 'PL' },
  { code: 'en', name: 'English', short: 'EN' },
  { code: 'tl', name: 'Tagalog', short: 'TL' },
  { code: 'es', name: 'Español', short: 'ES' },
  { code: 'pt', name: 'Português', short: 'PT' },
  { code: 'fr', name: 'Français', short: 'FR' },
  { code: 'de', name: 'Deutsch', short: 'DE' },
  { code: 'it', name: 'Italiano', short: 'IT' },
  { code: 'ru', name: 'Русский', short: 'RU' },
  { code: 'ar', name: 'العربية', short: 'AR', direction: 'rtl' },
  { code: 'hi', name: 'हिन्दी', short: 'HI' },
  { code: 'zh-CN', name: '简体中文', short: 'ZH' },
  { code: 'ja', name: '日本語', short: 'JA' },
  { code: 'ko', name: '한국어', short: 'KO' },
  { code: 'id', name: 'Bahasa Indonesia', short: 'ID' },
  { code: 'bn', name: 'বাংলা', short: 'BN' }
]);
export const MESSAGES = Object.freeze({ pl, en, tl, es, pt, fr, de, it, ru, ar, hi, 'zh-CN': zhCN, ja, ko, id, bn });
/** Canonical BCP-47 language keys; Filipino browser preferences also select Tagalog. */
export function normalizeLanguage(value) {
  if (typeof value !== 'string') return null;
  const tag = value.trim().replaceAll('_', '-').toLowerCase();
  const exact = LANGUAGES.find(language => language.code.toLowerCase() === tag);
  if (exact) return exact.code;
  const base = tag.split('-')[0];
  if (base === 'fil') return 'tl';
  if (base === 'zh') return 'zh-CN';
  return LANGUAGES.find(language => language.code === base)?.code || null;
}
export function languageFromPreferences(preferences = []) {
  for (const value of Array.isArray(preferences) ? preferences : []) {
    const language = normalizeLanguage(value);
    if (language) return language;
  }
  return 'en';
}
export function hasMessage(key) {
  return Object.hasOwn(en, key);
}
export function message(language, key) {
  const code = normalizeLanguage(language) || 'en';
  if (!hasMessage(key)) return key;
  return Object.hasOwn(MESSAGES[code], key) ? MESSAGES[code][key] : en[key];
}
export function directionFor(language) {
  return LANGUAGES.find(item => item.code === normalizeLanguage(language))?.direction || 'ltr';
}
