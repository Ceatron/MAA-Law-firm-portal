import { TaskItem, Advocate, NotificationItem, LegalMatter } from '../types';
import { mockAdvocates } from '../data/mockData';

export interface TaskEmailPayload {
  toEmail: string;
  toName: string;
  fromEmail: string;
  fromName: string;
  subject: string;
  priority: 'High' | 'Medium' | 'Low' | 'Critical';
  taskTitle: string;
  matterRef: string;
  matterTitle?: string;
  clientName: string;
  dueDate: string;
  description: string;
  subtasks: { id: string; text: string; completed: boolean }[];
  assignedBy: string;
  assignedAt: string;
}

/**
 * Resolves the email address of an assigned staff member by name or ID.
 */
export function getAdvocateEmailByName(
  assigneeName: string,
  advocatesList: Advocate[] = mockAdvocates
): { email: string; name: string; title: string } {
  const cleanName = (assigneeName || '').trim().toLowerCase();
  
  const found = advocatesList.find((adv) => {
    const advName = adv.name.toLowerCase();
    return (
      advName === cleanName ||
      advName.includes(cleanName) ||
      cleanName.includes(advName) ||
      cleanName.includes(adv.name.replace('Adv. ', '').toLowerCase())
    );
  });

  if (found) {
    return {
      email: found.email || `${found.name.toLowerCase().replace(/[^a-z0-9]/g, '.')}@muthoniahago.co.ke`,
      name: found.name,
      title: found.title,
    };
  }

  // Fallback generation based on name
  const sanitized = cleanName.replace(/adv\.\s*/g, '').replace(/\s+/g, '.');
  return {
    email: `${sanitized || 'staff'}@muthoniahago.co.ke`,
    name: assigneeName || 'Assigned Staff',
    title: 'Legal Counsel / Advocate',
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
  const assigneeInfo = getAdvocateEmailByName(task.assignedTo, advocatesList);
  
  const priorityPrefix =
    task.priority === 'High' || (task.priority as string) === 'Critical'
      ? '🔴 [URGENT/HIGH]'
      : task.priority === 'Medium'
      ? '🟡 [MEDIUM]'
      : '🔵 [LOW]';

  const subject = `${priorityPrefix} Task Assignment: ${task.title} (${task.matterRef || 'General Chambers'})`;

  return {
    toEmail: assigneeInfo.email,
    toName: assigneeInfo.name,
    fromEmail: 'notifications@muthoniahago.co.ke',
    fromName: 'Muthoni Ahago Advocates Task Dispatcher',
    subject,
    priority: task.priority,
    taskTitle: task.title,
    matterRef: task.matterRef || 'General Chambers Task',
    matterTitle: matter?.title,
    clientName: task.clientName || 'General Chambers',
    dueDate: task.dueDate,
    description: task.description || 'Please review the case file and execute the assigned action items per chambers timelines.',
    subtasks: task.subtasks || [],
    assignedBy: task.createdBy || 'Managing Partner',
    assignedAt: new Date().toLocaleString('en-KE', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }),
  };
}

/**
 * Creates an in-app NotificationItem for a task assignment.
 */
export function createTaskAssignmentNotification(
  task: TaskItem,
  advocatesList: Advocate[] = mockAdvocates
): NotificationItem {
  const assigneeInfo = getAdvocateEmailByName(task.assignedTo, advocatesList);
  
  return {
    id: `notif-task-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
    title: `Task Assigned: ${task.title}`,
    message: `Automated email notification sent to ${assigneeInfo.name} (${assigneeInfo.email}). Priority: ${task.priority} | Due: ${task.dueDate} | Matter: ${task.matterRef}`,
    timestamp: 'Just now',
    read: false,
    type: 'System',
  };
}
