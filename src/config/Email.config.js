import { createTransport } from 'nodemailer';

const transporter = createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  tls: {
    rejectUnauthorized: false, // Optional: useful for self-signed certs
  },
});

transporter.verify((err, success) => {
  if (err) {
    console.error("❌ Email transporter verify failed:", err?.message);
  } else {
    console.log("✅ Email transporter is ready to send emails");
  }
});
const sendEmail = (toEmail, subject, emailBody) => {
  return new Promise(function (resolve, reject) {
    const mailing = {
      from: process.env.EMAIL_USER,
      to: toEmail,
      subject: subject,
      html: emailBody,
    };

    transporter.sendMail(mailing, (err, data) => {
      if (err) {
        reject(err.message);
      } else {
        resolve(1);
      }
    });
  });
};

export default sendEmail;
