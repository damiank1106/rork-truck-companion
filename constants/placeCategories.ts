import type { Place } from '@/types';

export const CATEGORY_OPTIONS = ["Pick Up", "Destination", "Other"] as const;
export type CategoryOption = (typeof CATEGORY_OPTIONS)[number];

type PresetCategory = Extract<CategoryOption, "Pick Up" | "Destination">;

export const isPresetCategory = (value?: string | null): value is PresetCategory =>
  value === "Pick Up" || value === "Destination";

export const deriveCategorySelection = (value?: string | null): CategoryOption | null => {
  if (isPresetCategory(value)) {
    return value;
  }
  return value && value.trim().length > 0 ? "Other" : null;
};

export const deriveCustomCategory = (value?: string | null): string =>
  value && !isPresetCategory(value) ? value : "";

export const resetCategoryState = (place?: Pick<Place, 'category'> | null) => ({
  selection: deriveCategorySelection(place?.category),
  custom: deriveCustomCategory(place?.category),
});
