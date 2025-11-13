import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Expo, ExpoPushMessage } from 'expo-server-sdk';

@Injectable()
export class NotificationService {
  private expo: Expo;

  constructor(private configService: ConfigService) {
    this.expo = new Expo({
      accessToken: this.configService.get<string>('EXPO_ACCESS_TOKEN'),
    });
  }

  async sendPushNotification(
    pushToken: string,
    title: string,
    body: string,
    data?: any,
  ) {
    if (!Expo.isExpoPushToken(pushToken)) {
      throw new BadRequestException(`Invalid Expo push token: ${pushToken}`);
    }

    const message: ExpoPushMessage = {
      to: pushToken,
      sound: 'default',
      title,
      body,
      data,
    };

    try {
      const chunks = this.expo.chunkPushNotifications([message]);
      const tickets: any[] = [];

      for (const chunk of chunks) {
        const ticketChunk = await this.expo.sendPushNotificationsAsync(chunk);
        tickets.push(...ticketChunk);
      }

      return { success: true, tickets };
    } catch (error: any) {
      throw new BadRequestException('Failed to send push notification: ' + error.message);
    }
  }

  async sendBulkNotifications(
    tokens: string[],
    title: string,
    body: string,
    data?: any,
  ) {
    const validTokens = tokens.filter(token => Expo.isExpoPushToken(token));

    const messages: ExpoPushMessage[] = validTokens.map(token => ({
      to: token,
      sound: 'default',
      title,
      body,
      data,
    }));

    try {
      const chunks = this.expo.chunkPushNotifications(messages);
      const tickets: any[] = [];

      for (const chunk of chunks) {
        const ticketChunk = await this.expo.sendPushNotificationsAsync(chunk);
        tickets.push(...ticketChunk);
      }

      return { success: true, sent: validTokens.length, tickets };
    } catch (error: any) {
      throw new BadRequestException('Failed to send bulk notifications: ' + error.message);
    }
  }

  async checkReceiptStatus(receiptIds: string[]) {
    try {
      const receiptIdChunks = this.expo.chunkPushNotificationReceiptIds(receiptIds);
      const receipts: any[] = [];

      for (const chunk of receiptIdChunks) {
        const receiptChunk = await this.expo.getPushNotificationReceiptsAsync(chunk);
        receipts.push(receiptChunk);
      }

      return receipts;
    } catch (error: any) {
      throw new BadRequestException('Failed to check receipt status: ' + error.message);
    }
  }
}
