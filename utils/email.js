const nodemailer = require('nodemailer');

const sendEmail = async options => {
  // 1) create transporter

  var transport = nodemailer.createTransport({
    host: 'smtp.mailtrap.io',
    port: 2525,
    auth: {
      user: 'c2f3b693fc6d5b',
      pass: '6c1a93fcf61dae'
    }
  });

  // 2) define email options

  const mailOptions = {
    from: 'Deaf Dog <natours@gmail.com>',
    to: options.email,
    subject: options.subject,
    text: options.message
  };

  // 3) actually send the email
  await transport.sendMail(mailOptions);
};

module.exports = sendEmail;
