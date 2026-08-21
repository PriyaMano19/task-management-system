import { emailService } from "../../shared/email/email.service";

import {
  assignmentEmail,
  statusUpdateEmail,
  assigneeChangedEmail,
  dueDateApproachingEmail,
  dueTodayEmail,
  overdueTaskEmail,
} from "./notification.templates";


class NotificationService {

  private getTaskUrl(task: any) {

    const baseUrl =
      process.env.FRONTEND_URL ||
      "http://localhost:3000";

    return (
      `${baseUrl}/projects/${task.folder.projectId}` +
      `/folders/${task.folderId}/tasks/${task.id}`
    );
  }


  private getTaskEmailData(
    task: any,
    recipient: any
  ) {

    return {

      recipientName:
        `${recipient.firstName} ${recipient.lastName}`,

      taskTitle:
        task.title,

      projectName:
        task.folder.project.projectName,

      priority:
        task.priority,

      status:
        task.status,

      dueDate:
        task.dueDate,

      taskUrl:
        this.getTaskUrl(task),

      reporterName:
        task.createdBy
          ? `${task.createdBy.firstName} ${task.createdBy.lastName}`
          : "-",

      assigneeName:
        task.assignedTo
          ? `${task.assignedTo.firstName} ${task.assignedTo.lastName}`
          : "-",
    };
  }




  async notifyTaskAssigned(
    task: any,
    assignedUser: any
  ) {

    if (!assignedUser?.email) {
      return;
    }

    const data =
      this.getTaskEmailData(
        task,
        assignedUser
      );

    const html =
      assignmentEmail(data);

    try {

      await emailService.sendEmail(
        assignedUser.email,
        `Task assigned to you: ${task.title}`,
        html,
        `You have been assigned the task "${task.title}".`
      );

    } catch (error) {

      console.error(
        "Failed to send task assignment email:",
        error
      );
    }
  }




  async notifyTaskStatusChanged(
    task: any,
    reporter: any,
    oldStatus: string,
    newStatus: string
  ) {

    if (!reporter?.email) {
      return;
    }

    const data =
      this.getTaskEmailData(
        task,
        reporter
      );

    const html =
      statusUpdateEmail(
        data,
        oldStatus,
        newStatus
      );

    try {

      await emailService.sendEmail(
        reporter.email,
        `Task status updated: ${task.title}`,
        html,
        `The status of task "${task.title}" changed from ${oldStatus} to ${newStatus}.`
      );

    } catch (error) {

      console.error(
        "Failed to send task status email:",
        error
      );
    }
  }




  async notifyAssigneeChanged(
    task: any,
    assignedUser: any
  ) {

    if (!assignedUser?.email) {
      return;
    }

    const data =
      this.getTaskEmailData(
        task,
        assignedUser
      );

    const html =
      assigneeChangedEmail(data);

    try {

      await emailService.sendEmail(
        assignedUser.email,
        `You have been assigned: ${task.title}`,
        html,
        `You have been assigned the task "${task.title}".`
      );

    } catch (error) {

      console.error(
        "Failed to send assignee email:",
        error
      );
    }
  }




  async notifyDueDateApproaching(
    task: any,
    assignee: any
  ) {

    if (!assignee?.email) {
      return;
    }

    const data =
      this.getTaskEmailData(
        task,
        assignee
      );

    const html =
      dueDateApproachingEmail(data);

    try {

      await emailService.sendEmail(
        assignee.email,
        `Task due soon: ${task.title}`,
        html,
        `The task "${task.title}" is due within the next 24 hours.`
      );

      console.log(
        `📧 Due-soon email sent to ${assignee.email}`
      );

    } catch (error) {

      console.error(
        "Failed to send due-soon email:",
        error
      );
    }
  }



  async notifyDueToday(
    task: any,
    assignee: any
  ) {

    if (!assignee?.email) {
      return;
    }

    const data =
      this.getTaskEmailData(
        task,
        assignee
      );

    const html =
      dueTodayEmail(data);

    try {

      await emailService.sendEmail(
        assignee.email,
        `Task due today: ${task.title}`,
        html,
        `The task "${task.title}" is due today.`
      );

      console.log(
        `📧 Due-today email sent to ${assignee.email}`
      );

    } catch (error) {

      console.error(
        "Failed to send due-today email:",
        error
      );
    }
  }




  async notifyTaskOverdue(
    task: any,
    recipient: any
  ) {

    if (!recipient?.email) {
      return;
    }

    const data =
      this.getTaskEmailData(
        task,
        recipient
      );

    const html =
      overdueTaskEmail(data);

    try {

      await emailService.sendEmail(
        recipient.email,
        `Task overdue: ${task.title}`,
        html,
        `The task "${task.title}" is overdue.`
      );

      console.log(
        `📧 Overdue email sent to ${recipient.email}`
      );

    } catch (error) {

      console.error(
        "Failed to send overdue email:",
        error
      );
    }
  }

}


export const notificationService =
  new NotificationService();