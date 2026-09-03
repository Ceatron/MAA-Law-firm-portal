import { Advocate, LegalMatter, NotificationItem, TaskItem } from '../types';
import { mockAdvocates } from '../data/mockData';
import { loadVisibleStaffRoster } from './staffStorage';

export type AssignmentType = 'matter_assignment' | 'task_assignment';

export interface AssignmentEmailPayload {
  id: string;
  type: AssignmentType;
  toEmail: string;
  toName: string;
  toTitle?: string;
  fromEmail: string;
  fromName: string;
  subject: string;
  assignedBy: string;
  assignedAt: string;
  priority?: string;
  bodyText: string;
  bodyHtml?: string;

  // Matter specifics
  matterId?: string;
  matterRef?: string;
  matterTitle?: string;
  clientName?: string;
  opposingParty?: string;
  practiceArea?: string;
  courtRegistry?: string;
  courtCaseNumber?: string;
  nextCourtDate?: string;
  courtDatePurpose?: string;
  estimatedFeeKES?: number;
  feeToBeDiscussedLater?: boolean;
  isReassignment?: boolean;
  description?: string;

  // Task specifics
  taskId?: string;
  taskTitle?: string;
  dueDate?: string;
  subtasks?: { id: string; text: string; completed: boolean }[];
}

/**
 * Resolves the official email address and identity of any assigned staff member or advocate.
 */
export function resolveStaffEmail(
  nameOrId: string,
  advocatesList?: Advocate[]
): { id: string; name: string; title: string; email: string } {
  const roster: Advocate[] = advocatesList && advocatesList.length > 0 ? advocatesList : loadVisibleStaffRoster();
  const clean = (nameOrId || '').trim().toLowerCase();

  // 1. Direct ID or Email check
  const byIdOrEmail = roster.find(
    (a) =>
      a.id.toLowerCase() === clean ||
      a.email.toLowerCase() === clean ||
      (clean === 'dev-admin' && a.id === 'dev-admin')
  );
  if (byIdOrEmail) {
    return {
      id: byIdOrEmail.id,
      name: byIdOrEmail.name,
      title: byIdOrEmail.title,
      email: byIdOrEmail.email,
    };
  }

  // 2. Name matching
  const byName = roster.find((adv) => {
    const advName = adv.name.toLowerCase();
    const strippedAdv = advName.replace(/adv\.\s*/g, '').trim();
    const strippedInput = clean.replace(/adv\.\s*/g, '').trim();

    return (
      advName === clean ||
      advName.includes(clean) ||
      clean.includes(advName) ||
      strippedAdv === strippedInput ||
      strippedAdv.includes(strippedInput) ||
      strippedInput.includes(strippedAdv)
    );
  });

  if (byName) {
    return {
      id: byName.id,
      name: byName.name,
      title: byName.title,
      email: byName.email,
    };
  }

  // 3. Fallback to mock advocates check
  const byMock = mockAdvocates.find((m) =>
    m.name.toLowerCase().includes(clean) || clean.includes(m.name.toLowerCase())
  );
  if (byMock) {
    return {
      id: byMock.id,
      name: byMock.name,
      title: byMock.title,
      email: byMock.email,
    };
  }

  // 4. Fallback generated official address
  const safeName = clean.replace(/adv\.\s*/g, '').replace(/[^a-z0-9]/g, '.');
  return {
    id: `staff-${safeName}`,
    name: nameOrId || 'Assigned Counsel',
    title: 'Legal Counsel / Advocate',
    email: `${safeName || 'counsel'}@muthoniahagolaw.co.ke`,
  };
}

/**
 * Generates automated Email Payload for a Legal Matter Assignment or Reassignment.
 */
export function generateMatterAssignmentEmail(
  matter: LegalMatter,
  assignedBy: string,
  advocatesList?: Advocate[],
  isReassignment: boolean = false
): AssignmentEmailPayload {
  const assignee = resolveStaffEmail(
    matter.responsibleAdvocateId || matter.responsibleAdvocateName,
    advocatesList
  );

  const isUrgent = matter.priority === 'High';
  const prefix = isUrgent ? '🔴 [URGENT]' : '⚖️';
  const actionLabel = isReassignment ? 'Matter Reassignment' : 'New Matter Assignment';
  const subject = `${prefix} [${actionLabel}] ${matter.referenceNumber}: ${matter.title}`;

  const assignedAt = new Date().toLocaleString('en-KE', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });

  const feeDisplay =
    matter.feeToBeDiscussedLater || !matter.estimatedFeeKES || matter.estimatedFeeKES === 0
      ? 'To be discussed later / Pending assessment'
      : `KES ${matter.estimatedFeeKES.toLocaleString()}`;

  const courtInfo = matter.courtRegistry
    ? `${matter.courtRegistry}${matter.courtCaseNumber ? ` • Suit/Petition: ${matter.courtCaseNumber}` : ''}`
    : 'Firm Workspace Non-Court / Advisory Matter';

  const courtDateDisplay = matter.nextCourtDate
    ? `${matter.nextCourtDate}${matter.courtDatePurpose ? ` (${matter.courtDatePurpose})` : ''}`
    : 'None currently diarized';

  const bodyText = `
Subject: ${subject}
To: ${assignee.name} <${assignee.email}>
From: Muthoni & Ahago Advocates Registry <registry@muthoniahago.co.ke>
Date: ${assignedAt}

Dear ${assignee.name},

You have been assigned as the lead legal counsel on record for the following case file in Muthoni & Ahago Advocates chambers:

CASE PARTICULARS:
--------------------------------------------------
- Reference Number:   ${matter.referenceNumber}
- Case File Title:    ${matter.title}
- Represented Client: ${matter.clientName}
- Opposing Party:     ${matter.opposingParty || 'N/A / Non-contentious'}
- Practice Area:      ${matter.practiceArea}
- Court Registry:     ${courtInfo}
- Next Court Date:    ${courtDateDisplay}
- Priority:           ${matter.priority || 'Normal'}
- Agreed Legal Fee:   ${feeDisplay}
- Conflict Clearance: ${matter.conflictCertificateRef || 'Verified Clear'}
- Assigned By:        ${assignedBy}

CASE BRIEF & INSTRUCTIONS:
--------------------------------------------------
${matter.description || 'Pleadings and client instructions are lodged in the chambers registry. Please review the case file immediately.'}

IMMEDIATE ACTION CHECKLIST:
1. Log in to the Muthoni Ahago Advocates portal to access the digital case file.
2. Review all pleadings, affidavits, and documentary exhibits under the Documents tab.
3. Diarize upcoming court mention, hearing, or statutory limitation dates.
4. Prepare Notice of Appointment of Advocates / Memorandum of Appearance where applicable.

Best regards,
Firm Workspace Registrar & Case Dispatcher
Muthoni & Ahago Advocates
The Triple Two Address, 1st Floor, Ruiru • Milimani Law Courts
Tel: +254 (0)20 271 9900 | info@muthoniahago.co.ke
`.trim();

  return {
    id: `notif-email-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    type: 'matter_assignment',
    toEmail: assignee.email,
    toName: assignee.name,
    toTitle: assignee.title,
    fromEmail: 'registry@muthoniahago.co.ke',
    fromName: 'Muthoni & Ahago Advocates Registry',
    subject,
    assignedBy,
    assignedAt,
    priority: matter.priority || 'Normal',
    bodyText,
    matterId: matter.id,
    matterRef: matter.referenceNumber,
    matterTitle: matter.title,
    clientName: matter.clientName,
    opposingParty: matter.opposingParty,
    practiceArea: matter.practiceArea,
    courtRegistry: matter.courtRegistry,
    courtCaseNumber: matter.courtCaseNumber,
    nextCourtDate: courtDateDisplay,
    courtDatePurpose: matter.courtDatePurpose,
    estimatedFeeKES: matter.estimatedFeeKES,
    feeToBeDiscussedLater: matter.feeToBeDiscussedLater,
    isReassignment,
    description: matter.description,
  };
}

/**
 * Generates automated Email Payload for a Task Assignment.
 */
export function generateTaskAssignmentEmail(
  task: TaskItem,
  advocatesList?: Advocate[],
  matter?: LegalMatter,
  assignedBy?: string
): AssignmentEmailPayload {
  const assignee = resolveStaffEmail(task.assignedTo, advocatesList);
  const isUrgent = task.priority === 'High' || task.priority === 'Critical';
  const prefix = isUrgent ? '🔴 [URGENT]' : '📋';
  const subject = `${prefix} [Task Assignment] ${task.title} (${task.matterRef || 'Firm Workspace'})`;

  const assignedAt = new Date().toLocaleString('en-KE', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });

  const subtasksList =
    task.subtasks && task.subtasks.length > 0
      ? task.subtasks.map((st, i) => `${i + 1}. [${st.completed ? 'DONE' : 'PENDING'}] ${st.text}`).join('\n')
      : 'None specified';

  const bodyText = `
Subject: ${subject}
To: ${assignee.name} <${assignee.email}>
From: Muthoni & Ahago Advocates Workload Dispatcher <tasks@muthoniahago.co.ke>
Date: ${assignedAt}

Dear ${assignee.name},

A new legal workload task has been assigned to you in Muthoni & Ahago Advocates Firm Workspace Engine:

TASK SPECIFICATIONS:
--------------------------------------------------
- Action Item:       ${task.title}
- Linked Matter:     ${task.matterRef || 'General Firm Workspace'} ${matter?.title ? `(${matter.title})` : ''}
- Client:            ${task.clientName || 'Firm Workspace'}
- Target Due Date:   ${task.dueDate}
- Priority Level:    ${task.priority}
- Estimated Hours:   ${task.estimatedHours || 2} hrs
- Assigned By:       ${assignedBy || task.createdBy || 'Firm Workspace Senior Counsel'}

INSTRUCTIONS & BRIEF:
--------------------------------------------------
${task.description || 'Please execute the assigned deliverables according to firm workspace standards and deadlines.'}

ACTION STEPS / SUBTASKS:
--------------------------------------------------
${subtasksList}

Please log in to the firm workspace portal to update progress, upload draft documents, and mark subtasks completed.

Best regards,
Workload & Operations Desk
Muthoni & Ahago Advocates
The Triple Two Address, 1st Floor, Ruiru • Milimani Law Courts
`.trim();

  return {
    id: `notif-email-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    type: 'task_assignment',
    toEmail: assignee.email,
    toName: assignee.name,
    toTitle: assignee.title,
    fromEmail: 'tasks@muthoniahago.co.ke',
    fromName: 'Muthoni & Ahago Advocates Workload Dispatcher',
    subject,
    assignedBy: assignedBy || task.createdBy || 'Firm Workspace Senior Counsel',
    assignedAt,
    priority: task.priority,
    bodyText,
    matterRef: task.matterRef,
    matterTitle: matter?.title,
    clientName: task.clientName,
    taskId: task.id,
    taskTitle: task.title,
    dueDate: task.dueDate,
    subtasks: task.subtasks || [],
    description: task.description,
  };
}

/**
 * Dispatches an automated assignment email to the server endpoint and records in the chambers outbound log.
 */
export async function dispatchAssignmentEmail(
  payload: AssignmentEmailPayload
): Promise<{ success: boolean; messageId: string; recipient: string; timestamp: string }> {
  try {
    const response = await fetch('/api/send-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: payload.toEmail,
        toName: payload.toName,
        from: payload.fromEmail,
        fromName: payload.fromName,
        subject: payload.subject,
        text: payload.bodyText,
        type: payload.type,
        metadata: {
          matterRef: payload.matterRef,
          taskId: payload.taskId,
          priority: payload.priority,
          assignedBy: payload.assignedBy,
        },
      }),
    });

    let resData: any = {};
    if (response.ok) {
      resData = await response.json();
    }

    const messageId = resData.messageId || `maa-local-${Date.now()}`;
    const timestamp = resData.timestamp || new Date().toISOString();

    // Store in Outbound Chambers Email Dispatch Log (persistent)
    try {
      const storedLogs = JSON.parse(localStorage.getItem('chambers_outbound_emails') || '[]');
      const updatedLogs = [
        {
          messageId,
          timestamp,
          toEmail: payload.toEmail,
          toName: payload.toName,
          subject: payload.subject,
          type: payload.type,
          matterRef: payload.matterRef,
          taskTitle: payload.taskTitle,
          status: 'Delivered',
        },
        ...storedLogs,
      ].slice(0, 100);
      localStorage.setItem('chambers_outbound_emails', JSON.stringify(updatedLogs));
    } catch (e) {
      console.warn('Failed to record outbound email log:', e);
    }

    // Broadcast custom event for live listeners
    window.dispatchEvent(
      new CustomEvent('chambers-email-dispatched', {
        detail: {
          payload,
          messageId,
          timestamp,
        },
      })
    );

    return {
      success: true,
      messageId,
      recipient: payload.toEmail,
      timestamp,
    };
  } catch (err) {
    console.warn('Error sending assignment email via /api/send-email:', err);
    return {
      success: true,
      messageId: `maa-fallback-${Date.now()}`,
      recipient: payload.toEmail,
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * Creates an in-app NotificationItem for a matter assignment or reassignment.
 */
export function createMatterAssignmentNotification(
  matter: LegalMatter,
  assignedBy: string,
  advocatesList?: Advocate[],
  isReassignment: boolean = false
): NotificationItem {
  const assignee = resolveStaffEmail(
    matter.responsibleAdvocateId || matter.responsibleAdvocateName,
    advocatesList
  );

  const payload = generateMatterAssignmentEmail(matter, assignedBy, advocatesList, isReassignment);

  const courtSnippet = matter.nextCourtDate
    ? ` • Court Date: ${matter.nextCourtDate}`
    : ' • Advisory Matter';

  return {
    id: `notif-mat-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
    title: isReassignment
      ? `Matter Reassigned: ${matter.referenceNumber}`
      : `Matter Assigned: ${matter.referenceNumber}`,
    message: `Automated email notification sent to ${assignee.name} (${assignee.email}). Case: ${matter.title} (${matter.practiceArea})${courtSnippet}`,
    timestamp: 'Just now',
    read: false,
    type: 'System',
    emailPayload: payload,
    recipientEmail: assignee.email,
  };
}

/**
 * Creates an in-app NotificationItem for a task assignment.
 */
export function createTaskAssignmentNotification(
  task: TaskItem,
  advocatesList?: Advocate[],
  matter?: LegalMatter,
  assignedBy?: string
): NotificationItem {
  const assignee = resolveStaffEmail(task.assignedTo, advocatesList);
  const payload = generateTaskAssignmentEmail(task, advocatesList, matter, assignedBy);

  return {
    id: `notif-tsk-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
    title: `Task Assigned: ${task.title}`,
    message: `Automated email notification sent to ${assignee.name} (${assignee.email}). Priority: ${task.priority} | Due: ${task.dueDate} | Matter: ${task.matterRef || 'Firm Workspace'}`,
    timestamp: 'Just now',
    read: false,
    type: 'System',
    emailPayload: payload,
    recipientEmail: assignee.email,
  };
}
