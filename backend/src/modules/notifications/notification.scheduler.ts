import cron from "node-cron";
import prisma from "../../database/prisma";
import { notificationService } from "./notification.service";

class NotificationScheduler {

  /**
   * Start notification scheduler.
   *
   * Runs every hour.
   */
  start() {

    cron.schedule(
      "0 * * * *",
      async () => {

        console.log(
          "⏰ Running task notification scheduler..."
        );

        try {

          await this.processTaskNotifications();

          console.log(
            "✅ Task notification scheduler completed."
          );

        } catch (error) {

          console.error(
            "❌ Task notification scheduler failed:",
            error
          );
        }
      }
    );

    console.log(
      "📅 Task notification scheduler started."
    );
  }


  /**
   * ----------------------------------------------------------
   * PROCESS TASK NOTIFICATIONS
   * ----------------------------------------------------------
   */

  private async processTaskNotifications() {

    const now =
      new Date();


    const tasks =
      await prisma.task.findMany({

        where: {

          dueDate: {
            not: null,
          },

          assignedToId: {
            not: null,
          },

          status: {
            not: "DONE",
          },
        },

        include: {

          assignedTo: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },

          createdBy: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },

          folder: {
            select: {
              id: true,
              projectId: true,

              project: {
                select: {
                  id: true,
                  projectName: true,
                },
              },
            },
          },

        },

      });


    for (const task of tasks) {

      if (!task.dueDate) {
        continue;
      }

      if (!task.assignedTo) {
        continue;
      }


      const dueDate =
        task.dueDate;


      const differenceMs =
        dueDate.getTime() -
        now.getTime();


      const differenceHours =
        differenceMs /
        (1000 * 60 * 60);


      /*
       * ------------------------------------------------------
       * 1. DUE DATE APPROACHING
       *
       * Between 0 and 24 hours before due date.
       * ------------------------------------------------------
       */

      if (
        differenceHours > 0 &&
        differenceHours <= 24
      ) {

        const alreadySent =
          await this.hasNotificationBeenSent(
            task.id,
            task.assignedTo.id,
            "DUE_DATE_APPROACHING"
          );


        if (!alreadySent) {

          await notificationService
            .notifyDueDateApproaching(
              task,
              task.assignedTo
            );


          await this.markNotificationSent(
            task.id,
            task.assignedTo.id,
            "DUE_DATE_APPROACHING"
          );
        }
      }


      /*
       * ------------------------------------------------------
       * 2. DUE TODAY
       * ------------------------------------------------------
       */

      const today =
        new Date();

      today.setHours(
        0,
        0,
        0,
        0
      );


      const tomorrow =
        new Date(today);

      tomorrow.setDate(
        tomorrow.getDate() + 1
      );


      if (
        dueDate >= today &&
        dueDate < tomorrow
      ) {

        const alreadySent =
          await this.hasNotificationBeenSent(
            task.id,
            task.assignedTo.id,
            "DUE_TODAY"
          );


        if (!alreadySent) {

          await notificationService
            .notifyDueToday(
              task,
              task.assignedTo
            );


          await this.markNotificationSent(
            task.id,
            task.assignedTo.id,
            "DUE_TODAY"
          );
        }
      }


      /*
       * ------------------------------------------------------
       * 3. OVERDUE
       * ------------------------------------------------------
       */

      if (
        dueDate.getTime() <
        now.getTime()
      ) {

        /*
         * Assignee
         */

        const assigneeAlreadySent =
          await this.hasNotificationBeenSent(
            task.id,
            task.assignedTo.id,
            "OVERDUE_ASSIGNEE"
          );


        if (!assigneeAlreadySent) {

          await notificationService
            .notifyTaskOverdue(
              task,
              task.assignedTo
            );


          await this.markNotificationSent(
            task.id,
            task.assignedTo.id,
            "OVERDUE_ASSIGNEE"
          );
        }


        /*
         * Reporter
         */

        if (
          task.createdBy &&
          task.createdBy.id !==
            task.assignedTo.id
        ) {

          const reporterAlreadySent =
            await this.hasNotificationBeenSent(
              task.id,
              task.createdBy.id,
              "OVERDUE_REPORTER"
            );


          if (!reporterAlreadySent) {

            await notificationService
              .notifyTaskOverdue(
                task,
                task.createdBy
              );


            await this.markNotificationSent(
              task.id,
              task.createdBy.id,
              "OVERDUE_REPORTER"
            );
          }
        }
      }
    }
  }


  /**
   * ----------------------------------------------------------
   * CHECK DUPLICATE
   * ----------------------------------------------------------
   */

  private async hasNotificationBeenSent(
    taskId: string,
    userId: string,
    type: string
  ) {

    const notification =
      await prisma.taskNotification.findUnique({

        where: {
          taskId_userId_type: {
            taskId,
            userId,
            type,
          },
        },

      });


    return !!notification;
  }


  /**
   * ----------------------------------------------------------
   * MARK SENT
   * ----------------------------------------------------------
   */

  private async markNotificationSent(
    taskId: string,
    userId: string,
    type: string
  ) {

    await prisma.taskNotification.create({

      data: {
        taskId,
        userId,
        type,
      },

    });
  }

}


export const notificationScheduler =
  new NotificationScheduler();