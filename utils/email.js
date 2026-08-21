const nodemailer = require("nodemailer");
const pug = require("pug");
const { htmlToText } = require("html-to-text");

module.exports = class Email {
  constructor(user, url) {
    this.to = user.email;
    this.firstName = user.name.split(" ")[0];
    this.url = url;
    this.from = `Negar Eini <${process.env.EMAIL_FROM}>`;
  }
  // CREATE TRANSPORTE
  createTransport() {
    // Production: Liara SMTP
    if (process.env.NODE_ENV === "production") {
      return nodemailer.createTransport({
        host: process.env.LIARA_MAIL_HOST,
        port: process.env.LIARA_MAIL_PORT,
        tls: true,
        auth: {
          user: process.env.LIARA_MAIL_USER,
          pass: process.env.LIARA_MAIL_PASSWORD,
        },
      });
    }

    // Development: Gmail
    return nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      auth: {
        user: process.env.EMAIL_USERNAME,
        pass: process.env.EMAIL_PASSWORD,
      },
    });
  }
  // SEND EMAI
  async send(template, subject, options = {}) {
    const html = pug.renderFile(`${__dirname}/../views/email/${template}.pug`, {
      firstName: this.firstName,
      url: this.url,
      subject,
      showHeader: options.showHeader !== false,
    });

    const transporter = this.createTransport();

    const mailOptions = {
      from: this.from,
      to: this.to,
      subject,
      html,
      text: htmlToText.htmlToText(html),
    };

    if (process.env.NODE_ENV === "production") {
      await transporter.send(mailOptions);
    } else {
      await transporter.sendMail(mailOptions);
    }
  }
  // WELCOME EMAI
  async sendWelcome() {
    await this.send("welcome", "Welcome to Natours Family!", {
      showHeader: true,
    });
  }
  // PASSWORD RESET EMAI
  async sendPasswordReset() {
    await this.send(
      "passwordReset",
      "Your password reset token (valid for 10 minutes)",
      { showHeader: false },
    );
  }
};
