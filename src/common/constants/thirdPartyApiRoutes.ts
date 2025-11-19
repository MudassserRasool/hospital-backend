import smsConfig from '../../config/sms.config';

const THIRD_PARTY_APIS = {
  SMS: (phone: string, otp: string | number) => {
    const config = smsConfig();
    return `https://api.eazita.com/sms/json?api=${config.sms.apiKey}&pass=${config.sms.password}&from=EZSMS&to=${phone}&msg=${otp}`;
  },
};
export default THIRD_PARTY_APIS;
