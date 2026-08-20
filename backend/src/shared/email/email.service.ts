import nodemailer from "nodemailer";

class EmailService {
  private transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,

      port: Number(
        process.env.SMTP_PORT || 587
      ),

      secure:
        process.env.SMTP_SECURE === "true",

      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      },
    });
  }

  /**
   * Verify SMTP connection
   */
  async verifyConnection() {
    try {
      await this.transporter.verify();

      console.log(
        "✅ SMTP connection established successfully."
      );

      return true;
    } catch (error) {
      console.error(
        "❌ SMTP connection failed:",
        error
      );

      return false;
    }
  }

  /**
   * Send email
   */
  async sendEmail(
    to: string,
    subject: string,
    html: string,
    text?: string
  ) {
    if (!to) {
      throw new Error(
        "Recipient email is required."
      );
    }

    const info =
      await this.transporter.sendMail({
        from:
          process.env.SMTP_FROM ||
          process.env.SMTP_USER,

        to,

        subject,

        text:
          text ||
          "You have received a notification from the Task Management System.",

        html,
      });

    console.log("📧 EMAIL DEBUG");

    console.log(
      "To:",
      to
    );

    console.log(
      "From:",
      process.env.SMTP_FROM ||
        process.env.SMTP_USER
    );

    console.log(
      "Subject:",
      subject
    );

    console.log(
      "Message ID:",
      info.messageId
    );

    console.log(
      "Response:",
      info.response
    );

    console.log(
      "Accepted:",
      info.accepted
    );

    console.log(
      "Rejected:",
      info.rejected
    );

    return info;
  }
}

export const emailService =
  new EmailService();