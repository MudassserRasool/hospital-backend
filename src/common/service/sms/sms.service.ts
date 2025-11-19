import { Injectable } from '@nestjs/common';
import THIRD_PARTY_APIS from 'src/common/constants/thirdPartyApiRoutes';
import { httpRequest } from 'src/common/utils/axios';

@Injectable()
export class SmsService {
  async sendOtp(phone: string, otp: string | number) {
    await httpRequest('GET', THIRD_PARTY_APIS.SMS(phone, otp));
  }
}
