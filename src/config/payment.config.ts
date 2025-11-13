export default () => ({
  jwt: {
    authUrl: process.env.SWICH_AUTH_URL,
    apiUrl: process.env.SWICH_API_URL,
    clientId: process.env.SWICH_CLIENT_ID,
    clientSecret: process.env.SWICH_CLIENT_SECRET,
    secretKey: process.env.SWICH_SECRET_KEY,
  },
});
