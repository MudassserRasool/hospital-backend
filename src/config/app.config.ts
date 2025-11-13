export default () => ({
  port: parseInt((process.env.PORT as unknown as string) || '3000', 10) || 3000,
  environment: process.env.NODE_ENV || 'development',
  apiPrefix: process.env.API_PREFIX || 'api',
  apiVersion: process.env.API_VERSION || 'v1',
});
