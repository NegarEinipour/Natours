const nodemailer = require("nodemailer");
const pug = require("pug");
const htmlToText = require("html-to-text");

module.exports = class Email {
  constructor(user, url) {
    this.to = user.email;
    this.firstName = user.name.split(" ")[0];
    this.url = url; //The url is usually a link to the website
    this.from = `Negar Eini <${process.env.EMAIL_FROM}>`;
  }

  createTransport() {
    // 🚀 Production: Use Liara
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

    // 💻 Development: Use Gmail
    return nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      auth: {
        user: process.env.EMAIL_USERNAME,
        pass: process.env.EMAIL_PASSWORD,
      },
    });
  }

  //👇
  async send(template, subject, options = {}) {
    const html = pug.renderFile(`${__dirname}/../views/email/${template}.pug`, {
      firstName: this.firstName,
      url: this.url,
      subject,
      showHeader: options.showHeader !== false, // Default: true
    });

    // 1) Create the transporter
    const transporter = this.createTransport(); // ← Could be Nodemailer OR SendGrid

    // 2) Define email options
    const mailOptions = {
      from: this.from,
      to: this.to,
      subject,
      html,
      text: htmlToText.htmlToText(html),
      // text: message,
    };

    // 3) Send the email
    if (process.env.NODE_ENV === "production") {
      // SendGrid / 📌 sgMail has a .send() method (provided by SendGrid)
      await transporter.send(mailOptions);
    } else {
      // Nodemailer / 📌 transporter has a .sendMail() method (provided by nodemailer)
      await transporter.sendMail(mailOptions);
    }
  }

  async sendWelcome() {
    //👇
    await this.send("welcome", "Welcome to Natours Family!", {
      showHeader: true,
    });
  }

  async sendPasswordReset() {
    //👇
    await this.send(
      "passwordReset",
      "Your password reset token (valid for only 10 minutes)",
      { showHeader: false },
    );
  }
};

// const sendEmail = async (options) => {
//   console.log("📧 EMAIL_HOST:", process.env.EMAIL_HOST); // ← Add this
//   console.log("📧 EMAIL_USERNAME:", process.env.EMAIL_USERNAME); // ← Add this

//   // 1) Create a transporter
//   const transporter = nodemailer.createTransport({
//     host: process.env.EMAIL_HOST,
//     port: process.env.EMAIL_PORT,
//     auth: {
//       user: process.env.EMAIL_USERNAME,
//       pass: process.env.EMAIL_PASSWORD,
//     },
//   });

//   // 2)  Define email options
//   const mailOptions = {
//     from: process.env.EMAIL_FROM,
//     to: options.email,
//     subject: options.subject,
//     text: options.message,
//   };

//   // 3)  Send the email
//   await transporter.sendMail(mailOptions);
// };

// module.exports = sendEmail;
