import { EMPTY_DISPLAY } from "./apiResponseHelpers";

export function normalizeDisplayText(value) {
  if (value == null || value === "") return "";
  return String(value).trim();
}

export function isEmptyDisplayValue(value) {
  return normalizeDisplayText(value) === "";
}

/** Capitalise the first letter of each word. */
export function toTitleCaseWords(value) {
  const text = normalizeDisplayText(value);
  if (!text) return EMPTY_DISPLAY;
  return text
    .toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

/**
 * Description formatting — capitalise the first letter of each word, but keep
 * existing ALL CAPS tokens (e.g. BOSCH) unchanged.
 * "This item is made by BOSCH" → "This Item Is Made By BOSCH"
 */
export function formatDescriptionText(value) {
  const text = normalizeDisplayText(value);
  if (!text) return EMPTY_DISPLAY;

  return text.replace(/\S+/g, (word) => {
    const letters = word.replace(/[^A-Za-z]/g, "");
    const isAllCapsToken =
      letters.length >= 2
      && letters === letters.toUpperCase()
      && /[A-Z]/.test(letters);

    if (isAllCapsToken) return word;

    const firstLetterIndex = word.search(/[A-Za-z]/);
    if (firstLetterIndex === -1) return word;

    return (
      word.slice(0, firstLetterIndex)
      + word.charAt(firstLetterIndex).toUpperCase()
      + word.slice(firstLetterIndex + 1).toLowerCase()
    );
  });
}

export function toAllCaps(value) {
  const text = normalizeDisplayText(value);
  if (!text) return EMPTY_DISPLAY;
  return text.toUpperCase();
}

/** Item names — ALL CAPS (pair with font-bold in UI). */
export const formatItemName = toAllCaps;

/** Descriptions — capitalise first letter of each word; preserve ALL CAPS tokens. */
export const formatDescription = formatDescriptionText;

/** Brands — ALL CAPS. */
export const formatBrand = toAllCaps;

/** People names — capitalise first letters. */
export const formatUserName = toTitleCaseWords;

/** Store locations — ALL CAPS. */
export const formatStoreLocation = toAllCaps;

export function formatStoreLocationLabel(storeName, storeCode) {
  const name = normalizeDisplayText(storeName);
  const code = normalizeDisplayText(storeCode);
  if (!name && !code) return EMPTY_DISPLAY;
  if (name && code) return `${name.toUpperCase()} (${code.toUpperCase()})`;
  return toAllCaps(name || code);
}

const MONEY_LOCALE = "en-US";
const MONEY_FORMAT_OPTIONS = {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
};

/** Numeric amount with thousands separators, e.g. 45,584.54 */
export function formatMoneyAmount(amount) {
  const value = Number(amount);
  if (!Number.isFinite(value)) return "0.00";
  return value.toLocaleString(MONEY_LOCALE, MONEY_FORMAT_OPTIONS);
}

/** GHS-prefixed money, e.g. GHS 45,584.54 */
export function formatMoneyGhs(amount) {
  return `GHS ${formatMoneyAmount(amount)}`;
}

/** Parse user-entered money text (with or without commas) to a number. */
export function parseMoneyAmount(value) {
  const cleaned = String(value ?? "").replace(/,/g, "").trim();
  if (!cleaned) return NaN;
  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? parsed : NaN;
}

/** Sanitize partial money input while typing. Returns null when invalid. */
export function sanitizeMoneyInput(value) {
  const cleaned = String(value ?? "").replace(/,/g, "").trim();
  if (cleaned === "") return "";
  if (!/^\d*\.?\d{0,2}$/.test(cleaned)) return null;
  return cleaned;
}
