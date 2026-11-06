import { FeeNoteTemplate, StandardServiceItem } from '../types';
import {
  INITIAL_FEE_NOTE_TEMPLATES,
  INITIAL_STANDARD_SERVICES,
} from '../data/mockFeeNoteTemplates';

import ChambersCloudService from '../services/chambersCloudService';

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

export const fetchAndHydrateFeeNoteTemplates = async (): Promise<FeeNoteTemplate[]> => {
  try {
    const cloudTemplates = await ChambersCloudService.fetchFeeNoteTemplates();
    if (cloudTemplates && Array.isArray(cloudTemplates) && cloudTemplates.length > 0) {
      localStorage.setItem(TEMPLATES_STORAGE_KEY, JSON.stringify(cloudTemplates));
      window.dispatchEvent(
        new CustomEvent('fee-note-templates-updated', { detail: cloudTemplates })
      );
      return cloudTemplates;
    }
  } catch (err) {
    console.warn('[FeeNoteTemplates] Cloud hydration warning:', err);
  }
  return loadFeeNoteTemplates();
};

export const saveFeeNoteTemplates = (templates: FeeNoteTemplate[]): void => {
  try {
    localStorage.setItem(TEMPLATES_STORAGE_KEY, JSON.stringify(templates));
    window.dispatchEvent(
      new CustomEvent('fee-note-templates-updated', { detail: templates })
    );
    templates.forEach((t) => {
      ChambersCloudService.upsertFeeNoteTemplate(t).catch((err) =>
        console.warn('[FeeNoteTemplates] Supabase upsert error:', err)
      );
    });
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

export const fetchAndHydrateStandardServices = async (): Promise<StandardServiceItem[]> => {
  try {
    const cloudServices = await ChambersCloudService.fetchStandardServices();
    if (cloudServices && Array.isArray(cloudServices) && cloudServices.length > 0) {
      localStorage.setItem(SERVICES_STORAGE_KEY, JSON.stringify(cloudServices));
      window.dispatchEvent(
        new CustomEvent('standard-services-updated', { detail: cloudServices })
      );
      return cloudServices;
    }
  } catch (err) {
    console.warn('[StandardServices] Cloud hydration warning:', err);
  }
  return loadStandardServiceSnippets();
};

export const saveStandardServiceSnippets = (
  services: StandardServiceItem[]
): void => {
  try {
    localStorage.setItem(SERVICES_STORAGE_KEY, JSON.stringify(services));
    window.dispatchEvent(
      new CustomEvent('standard-services-updated', { detail: services })
    );
    services.forEach((s) => {
      ChambersCloudService.upsertStandardService(s).catch((err) =>
        console.warn('[StandardServices] Supabase upsert error:', err)
      );
    });
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
