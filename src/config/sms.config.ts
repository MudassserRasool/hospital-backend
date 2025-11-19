export default () => ({
  sms: {
    password: process.env.SMS_PASSWORD,
    apiKey: process.env.SMS_API_KEY,
  },
});
