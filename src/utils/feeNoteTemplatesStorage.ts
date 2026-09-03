import { FeeNoteTemplate, StandardServiceItem } from '../types';
import {
  INITIAL_FEE_NOTE_TEMPLATES,
  INITIAL_STANDARD_SERVICES,
} from '../data/mockFeeNoteTemplates';

const TEMPLATES_STORAGE_KEY = 'maa_chambers_fee_note_templates_v1';
const SERVICES_STORAGE_KEY = 'maa_chambers_standard_services_v1';

export const loadFeeNoteTemplates = (): FeeNoteTemplate[] => {
  try {
    const saved = localStorage.getItem(TEMPLATES_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (err) {
    console.error('Failed to load fee note templates from storage:', err);
  }
  return INITIAL_FEE_NOTE_TEMPLATES;
};

export const saveFeeNoteTemplates = (templates: FeeNoteTemplate[]): void => {
  try {
    localStorage.setItem(TEMPLATES_STORAGE_KEY, JSON.stringify(templates));
    window.dispatchEvent(
      new CustomEvent('fee-note-templates-updated', { detail: templates })
    );
  } catch (err) {
    console.error('Failed to save fee note templates to storage:', err);
    throw err;
  }
};

export const resetFeeNoteTemplates = (): FeeNoteTemplate[] => {
  try {
    localStorage.removeItem(TEMPLATES_STORAGE_KEY);
    window.dispatchEvent(
      new CustomEvent('fee-note-templates-updated', {
        detail: INITIAL_FEE_NOTE_TEMPLATES,
      })
    );
  } catch (err) {
    console.error('Failed to reset fee note templates:', err);
  }
  return INITIAL_FEE_NOTE_TEMPLATES;
};

export const loadStandardServiceSnippets = (): StandardServiceItem[] => {
  try {
    const saved = localStorage.getItem(SERVICES_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (err) {
    console.error('Failed to load standard service items:', err);
  }
  return INITIAL_STANDARD_SERVICES;
};

export const saveStandardServiceSnippets = (
  services: StandardServiceItem[]
): void => {
  try {
    localStorage.setItem(SERVICES_STORAGE_KEY, JSON.stringify(services));
    window.dispatchEvent(
      new CustomEvent('standard-services-updated', { detail: services })
    );
  } catch (err) {
    console.error('Failed to save standard service items:', err);
    throw err;
  }
};

export const resetStandardServiceSnippets = (): StandardServiceItem[] => {
  try {
    localStorage.removeItem(SERVICES_STORAGE_KEY);
    window.dispatchEvent(
      new CustomEvent('standard-services-updated', {
        detail: INITIAL_STANDARD_SERVICES,
      })
    );
  } catch (err) {
    console.error('Failed to reset standard service items:', err);
  }
  return INITIAL_STANDARD_SERVICES;
};
