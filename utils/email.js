const nodemailer = require('nodemailer');
const pug = require('pug');
const htmlToText = require('html-to-text');

module.exports = class Email {
  // Constructor
  constructor(user, url) {
    this.to = user.email;
    this.firstName = user.username.split(' ')[0];
    this.url = url;
    this.from = `Brijja Naime <${process.env.EMAIL}>`;
  }
  //

  createNewTransport() {
    // Create a transporter
    if (process.env.NODE_ENV === 'production') {
      return nodemailer.createTransport({
        host: process.env.MAILERSEND_HOST,
        port: process.env.MAILERSEND_PORT,
        auth: {
          user: process.env.MAILERSEND_USERNAME,
          pass: process.env.MAILERSEND_PWD,
        },
      });
    }
    // 1) Create a transporter for dev env
    return nodemailer.createTransport({
      // service: 'Gmail',
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      auth: {
        user: process.env.EMAIL_USERNAME,
        pass: process.env.EMAIL_PWD,
      },
      // Don't forget to activate 'less secure app' option in gmail
    });
  }

  //
  async sendEmail(template, subject) {
    // 1-) Render HTML based on template
    const html = pug.renderFile(
      `${__dirname}/../views/emails/${template}.pug`,
      {
        firstName: this.firstName,
        url: this.url,
        subject,
      },
    );

    // 2-) Create email options
    const mailOptions = {
      from: this.from,
      to: this.to,
      subject,
      html,
      text: htmlToText.convert(html, {
        wordwrap: 130,
      }),
    };
    // 3-) Create a transport and send the email
    await this.createNewTransport().sendMail(
      mailOptions,
    );
  }

  //
  async sendWelcome() {
    await this.sendEmail(
      'welcome',
      'Welcome to the Natours family!',
    );
  }

  async sendPasswordReset() {
    await this.sendEmail(
      'resetPassword',
      'Your password reset token (expires in 10 min)',
    );
  }
};
