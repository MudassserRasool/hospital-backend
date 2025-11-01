import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { NotificationService as ExpoNotificationService } from '../../integrations/notification/notification.service';
import {
  Notification,
  NotificationDocument,
} from './entities/notification.entity';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectModel(Notification.name)
    private notificationModel: Model<NotificationDocument>,
    private expoNotificationService: ExpoNotificationService,
  ) {}

  async create(
    userId: string,
    title: string,
    body: string,
    type: string,
    data?: any,
    relatedAppointmentId?: string,
    relatedPaymentId?: string,
  ) {
    const notification = await this.notificationModel.create({
      userId,
      title,
      body,
      type,
      data,
      relatedAppointmentId,
      relatedPaymentId,
      isRead: false,
      isSent: false,
    });

    return notification;
  }

  async sendPushNotification(
    userId: string,
    pushToken: string,
    title: string,
    body: string,
    type: string,
    data?: any,
  ) {
    // Create notification record
    const notification = await this.create(userId, title, body, type, data);

    // Send push notification
    try {
      const result = await this.expoNotificationService.sendPushNotification(
        pushToken,
        title,
        body,
        { ...data, notificationId: (notification._id as any).toString() },
      );

      notification.isSent = true;
      notification.sentAt = new Date();
      notification.pushToken = pushToken;
      notification.expoTicketId = (result.tickets[0] as any)?.id;
      await notification.save();

      return notification;
    } catch (error) {
      return notification;
    }
  }

  async findByUser(userId: string, unreadOnly: boolean = false) {
    const query: any = { userId };
    if (unreadOnly) {
      query.isRead = false;
    }

    const notifications = await this.notificationModel
      .find(query)
      .sort({ createdAt: -1 })
      .limit(50)
      .exec();

    return notifications;
  }

  async markAsRead(id: string) {
    const notification = await this.notificationModel.findById(id);

    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    notification.isRead = true;
    notification.readAt = new Date();
    await notification.save();

    return notification;
  }

  async markAllAsRead(userId: string) {
    await this.notificationModel.updateMany(
      { userId, isRead: false },
      { isRead: true, readAt: new Date() },
    );

    return { message: 'All notifications marked as read' };
  }

  async getUnreadCount(userId: string) {
    const count = await this.notificationModel.countDocuments({
      userId,
      isRead: false,
    });

    return { unreadCount: count };
  }

  async registerDeviceToken(userId: string, deviceToken: string) {
    // This will be stored in the User model
    return { message: 'Device token registered', userId, deviceToken };
  }
}
