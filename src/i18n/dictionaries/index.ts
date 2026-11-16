import type { Locale } from "../config";
import { en } from "./en";
import { id, type Dictionary } from "./id";

const dictionaries: Record<Locale, Dictionary> = { id, en };

/** Kamus teks antarmuka. Modul murni — boleh dipakai di Server maupun Client Component. */
export const getDictionary = (locale: Locale): Dictionary => dictionaries[locale];

export type { Dictionary };
