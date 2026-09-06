import { Advocate, LegalMatter, TaskItem, DeadlineItem } from '../types';

/**
 * Normalizes advocate and user names by removing titles/honorifics and standardizing whitespace.
 */
export const cleanAdvocateName = (name?: string | null): string => {
  if (!name || typeof name !== 'string') return '';
  return name
    .replace(/^(Adv\.?|Advocate|Dr\.?|Mr\.?|Mrs\.?|Ms\.?|Miss|Senior\s+Counsel|SC|Hon\.?)\s+/i, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
};

/**
 * Robust bidirectional comparison of two person names.
 */
export const namesMatch = (nameA?: string | null, nameB?: string | null): boolean => {
  const cleanA = cleanAdvocateName(nameA);
  const cleanB = cleanAdvocateName(nameB);
  if (!cleanA || !cleanB) return false;
  if (cleanA === cleanB) return true;
  if (cleanA.includes(cleanB) || cleanB.includes(cleanA)) return true;

  // Compare first & last name parts
  const partsA = cleanA.split(' ').filter(Boolean);
  const partsB = cleanB.split(' ').filter(Boolean);
  if (partsA.length > 0 && partsB.length > 0) {
    // If last names match and first name initial or part matches
    const lastNameA = partsA[partsA.length - 1];
    const lastNameB = partsB[partsB.length - 1];
    if (lastNameA === lastNameB && (partsA[0][0] === partsB[0][0] || partsA[0] === partsB[0])) {
      return true;
    }
  }
  return false;
};

/**
 * Determines whether an advocate has firm-wide visibility rights (Managing Advocate or System Admin).
 * Firm Policy: The Managing Advocate and System Admin MUST be able to see ALL matters,
 * tasks, clients, and deadlines created by anyone across the firm.
 */
export const canUserViewAll = (adv?: Advocate | null): boolean => {
  if (!adv) return false;

  const roleLower = (adv.role || '').toLowerCase();
  const titleLower = (adv.title || '').toLowerCase();

  return Boolean(
    adv.id === 'dev-admin' ||
    adv.id === 'adv-1' ||
    adv.isSystemAdmin ||
    adv.isDeveloper ||
    roleLower === 'system admin' ||
    roleLower === 'system administrator' ||
    roleLower === 'managing advocate' ||
    titleLower.includes('managing') ||
    titleLower.includes('system admin') ||
    titleLower.includes('sys admin') ||
    adv.permissions?.canViewAllMatters
  );
};

/**
 * Determines whether the user can register new matters, assign matters, and delete clients.
 * Firm Policy: ONLY System Administrator and Managing Advocate have this capability.
 */
export const canUserAssignAndAddMatters = (adv?: Advocate | null): boolean => {
  if (!adv) return false;
  const roleLower = (adv.role || '').toLowerCase();
  const titleLower = (adv.title || '').toLowerCase();

  return Boolean(
    adv.id === 'dev-admin' ||
    adv.id === 'adv-1' ||
    adv.isSystemAdmin ||
    adv.isDeveloper ||
    roleLower === 'system admin' ||
    roleLower === 'system administrator' ||
    roleLower === 'managing advocate' ||
    titleLower.includes('managing') ||
    titleLower.includes('system admin') ||
    titleLower.includes('sys admin')
  );
};

/**
 * Evaluates whether a legal matter is visible to the given advocate.
 * - Managing Advocate and System Admin can see ALL matters created by anyone.
 * - Regular advocates can see:
 *   1. Matters where they are the responsible/assigned advocate.
 *   2. Matters they created.
 *   3. Matters where they have assigned tasks.
 */
export const isMatterVisibleToUser = (
  matter: LegalMatter,
  adv?: Advocate | null,
  tasks?: TaskItem[]
): boolean => {
  if (!adv) return false;
  if (canUserViewAll(adv)) return true;

  // Direct ID check
  if (matter.responsibleAdvocateId && matter.responsibleAdvocateId === adv.id) return true;
  if (matter.createdByAdvocateId && matter.createdByAdvocateId === adv.id) return true;

  // Name check (e.g. "Wendy Moraa" vs "Adv. Wendy Moraa")
  if (namesMatch(matter.responsibleAdvocateName, adv.name)) return true;
  if (namesMatch(matter.createdByName, adv.name)) return true;

  // Check if advocate has any tasks under this matter
  if (tasks && tasks.length > 0) {
    const hasAssignedTask = tasks.some(
      (t) => t.matterId === matter.id && isTaskVisibleToUser(t, adv)
    );
    if (hasAssignedTask) return true;
  }

  return false;
};

/**
 * Evaluates whether a task is visible to the given advocate.
 * - Managing Advocate and System Admin can see ALL tasks created by anyone.
 * - Regular advocates can see:
 *   1. Tasks assigned to them (by ID, name, or email).
 *   2. Tasks created by them.
 *   3. Tasks belonging to a matter they are responsible for.
 */
export const isTaskVisibleToUser = (
  task: TaskItem,
  adv?: Advocate | null,
  matters?: LegalMatter[]
): boolean => {
  if (!adv) return false;
  if (canUserViewAll(adv)) return true;

  // Check assignee ID
  const anyTask = task as any;
  if (anyTask.assignedToId && anyTask.assignedToId === adv.id) return true;

  // Check assignee Name
  if (namesMatch(task.assignedTo, adv.name)) return true;

  // Check assignee Email
  if (anyTask.assignedToEmail && adv.email && anyTask.assignedToEmail.toLowerCase() === adv.email.toLowerCase()) {
    return true;
  }

  // Check creator ID or Name
  if (anyTask.createdById && anyTask.createdById === adv.id) return true;
  if (namesMatch(task.createdBy, adv.name)) return true;

  // Check if the task is in a matter where this advocate is the lead advocate
  if (matters && matters.length > 0) {
    const parentMatter = matters.find((m) => m.id === task.matterId);
    if (parentMatter) {
      if (parentMatter.responsibleAdvocateId === adv.id) return true;
      if (namesMatch(parentMatter.responsibleAdvocateName, adv.name)) return true;
      if (parentMatter.createdByAdvocateId === adv.id) return true;
      if (namesMatch(parentMatter.createdByName, adv.name)) return true;
    }
  }

  return false;
};

/**
 * Evaluates whether a deadline is visible to the given advocate.
 */
export const isDeadlineVisibleToUser = (
  deadline: DeadlineItem,
  adv?: Advocate | null
): boolean => {
  if (!adv) return false;
  if (canUserViewAll(adv)) return true;

  const anyDl = deadline as any;
  if (anyDl.advocateId && anyDl.advocateId === adv.id) return true;
  if (namesMatch(deadline.advocateName, adv.name)) return true;

  return false;
};
