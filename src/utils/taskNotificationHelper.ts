import { TaskItem, Advocate, NotificationItem, LegalMatter } from '../types';
import { mockAdvocates } from '../data/mockData';
import {
  resolveStaffEmail,
  generateTaskAssignmentEmail,
  createTaskAssignmentNotification as createUnifiedTaskNotification,
  dispatchAssignmentEmail,
  AssignmentEmailPayload,
} from './assignmentNotificationService';

export type TaskEmailPayload = AssignmentEmailPayload;

/**
 * Resolves the email address of an assigned staff member by name or ID.
 */
export function getAdvocateEmailByName(
  assigneeName: string,
  advocatesList: Advocate[] = mockAdvocates
): { email: string; name: string; title: string } {
  const res = resolveStaffEmail(assigneeName, advocatesList);
  return {
    email: res.email,
    name: res.name,
    title: res.title,
  };
}

/**
 * Generates an automated Email Notification payload for a newly assigned task.
 */
export function generateTaskEmailPayload(
  task: TaskItem,
  advocatesList: Advocate[] = mockAdvocates,
  matter?: LegalMatter
): TaskEmailPayload {
  return generateTaskAssignmentEmail(task, advocatesList, matter);
}

/**
 * Creates an in-app NotificationItem for a task assignment.
 */
export function createTaskAssignmentNotification(
  task: TaskItem,
  advocatesList: Advocate[] = mockAdvocates
): NotificationItem {
  return createUnifiedTaskNotification(task, advocatesList);
}

export { dispatchAssignmentEmail };

