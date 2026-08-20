import app from "./app";
import { env } from "./config/env";
import { emailService } from "./shared/email/email.service";
import {
  notificationScheduler,
} from "./modules/notifications/notification.scheduler";
app.listen(env.PORT, () => {
  console.log(`🚀 Server running on http://localhost:${env.PORT}`);

  emailService.verifyConnection();
   notificationScheduler.start();
});