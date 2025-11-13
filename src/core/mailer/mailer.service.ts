import { Injectable } from '@nestjs/common';

@Injectable()
export class MailerService {
  async sendEmail(to: string, subject: string, body: string): Promise<void> {
    // Implement email sending logic
    console.log(`Sending email to ${to}: ${subject}`);
  }

  async sendTemplateEmail(
    to: string,
    template: string,
    data: any,
  ): Promise<void> {
    // Implement template email sending
    console.log(`Sending template email to ${to}`);
  }
}
