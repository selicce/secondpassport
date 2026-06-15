import type { Language } from "@/lib/types";

export const LOCALES: Language[] = ["en", "zh", "ru", "uz"];
export const DEFAULT_LOCALE: Language = "en";
export const LOCALE_COOKIE = "jrf_locale";

export const LOCALE_LABELS: Record<Language, string> = {
  en: "English",
  zh: "中文",
  ru: "Русский",
  uz: "O‘zbekcha",
};

export function isLocale(value: string | undefined | null): value is Language {
  return !!value && (LOCALES as string[]).includes(value);
}
