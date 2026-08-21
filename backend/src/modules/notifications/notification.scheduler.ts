import cron from "node-cron";
import prisma from "../../database/prisma";
import { notificationService } from "./notification.service";

class NotificationScheduler {


  start() {

 
    cron.schedule(
      "0 * * * *",
      async () => {

        console.log(
          "⏰ Running hourly task notification scheduler..."
        );

        try {

          await this.processHourlyNotifications();

          console.log(
            "✅ Hourly task notification scheduler completed."
          );

        } catch (error) {

          console.error(
            "❌ Hourly task notification scheduler failed:",
            error
          );
        }
      },
      {
        timezone: "Asia/Colombo",
      }
    );


  
    cron.schedule(
      "0 8 * * *",
      async () => {

        console.log(
          "🌅 Running daily due-today notification scheduler..."
        );

        try {

          await this.processDueTodayNotifications();

          console.log(
            "✅ Daily due-today notification scheduler completed."
          );

        } catch (error) {

          console.error(
            "❌ Daily due-today notification scheduler failed:",
            error
          );
        }
      },
      {
        timezone: "Asia/Colombo",
      }
    );


    console.log(
      "📅 Task notification schedulers started."
    );

    console.log(
      "   → Hourly: Due Soon + Overdue"
    );

    console.log(
      "   → Daily 08:00: Due Today"
    );
  }


  
  private async processHourlyNotifications() {

    const now = new Date();


   
    const today = new Date(now);

    today.setHours(
      0,
      0,
      0,
      0
    );


  
    const tomorrow = new Date(today);

    tomorrow.setDate(
      tomorrow.getDate() + 1
    );


    

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


   
      const isDueToday =
        dueDate >= today &&
        dueDate < tomorrow;


   
      const differenceMs =
        dueDate.getTime() -
        now.getTime();

      const differenceHours =
        differenceMs /
        (1000 * 60 * 60);


      if (
        differenceHours > 0 &&
        differenceHours <= 24 &&
        !isDueToday
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


      const isOverdue =
        dueDate < today;


      if (isOverdue) {

      
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




  private async processDueTodayNotifications() {

    const now =
      new Date();


 

    const today =
      new Date(now);

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



    const tasks =
      await prisma.task.findMany({

        where: {

          dueDate: {
            gte: today,
            lt: tomorrow,
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


  
      const alreadySent =
        await this.hasNotificationBeenSent(
          task.id,
          task.assignedTo.id,
          "DUE_TODAY"
        );


      if (alreadySent) {
        continue;
      }



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