export default () => ({
  database: {
    type: process.env.DB_TYPE || 'mongodb',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '27017', 10),
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME || 'hospital_management',
    uri: process.env.DATABASE_URL,
  },
});
