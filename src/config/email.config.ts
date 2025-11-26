export default () => ({
  sms: {
    mailHost: process.env.MAIL_HOST,
    mailPassword: process.env.MAIL_PASSWORD,
    mailPort: process.env.MAIL_PORT,
    mailUser: process.env.MAIL_USER,
    mailFrom: process.env.MAIL_FROM,
  },
});
