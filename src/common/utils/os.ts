import os from 'os';

const ipAddress = () => {
  const networkInterfaces = os.networkInterfaces();
  let ipAddress: any;

  for (const interfaceName in networkInterfaces) {
    const networks: any = networkInterfaces[interfaceName];

    for (const network of networks) {
      if (network.family === 'IPv4' && !network.internal) {
        ipAddress = network.address;
        break;
      }
    }
    if (ipAddress) break;
  }
  return ipAddress;
};

export { ipAddress };
