import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Notification, NotificationDocument } from './entities/notification.entity';
import { User, UserDocument } from '../users/entities/user.entity';
import { Expo, ExpoPushMessage, ExpoPushTicket } from 'expo-server-sdk';

@Injectable()
export class NotificationsService {
  private expo: Expo;

  constructor(
    @InjectModel(Notification.name) private notificationModel: Model<NotificationDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
  ) {
    this.expo = new Expo();
  }

  /**
   * Register device token for push notifications
   */
  async registerDeviceToken(userId: string, deviceToken: string) {
    // Validate Expo push token
    if (!Expo.isExpoPushToken(deviceToken)) {
      throw new Error('Invalid Expo push token');
    }

    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Add device token if not already present
    if (!user.deviceTokens) {
      user.deviceTokens = [];
    }

    if (!user.deviceTokens.includes(deviceToken)) {
      user.deviceTokens.push(deviceToken);
      await user.save();
    }

    return { message: 'Device token registered successfully' };
  }

  /**
   * Unregister device token
   */
  async unregisterDeviceToken(userId: string, deviceToken: string) {
    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.deviceTokens) {
      user.deviceTokens = user.deviceTokens.filter((token) => token !== deviceToken);
      await user.save();
    }

    return { message: 'Device token unregistered successfully' };
  }

  /**
   * Send push notification to a user
   */
  async sendNotification(
    userId: string,
    title: string,
    body: string,
    type: string,
    data?: any,
    relatedAppointmentId?: string,
    relatedPaymentId?: string,
  ) {
    // Get user's device tokens
    const user = await this.userModel.findById(userId);
    if (!user || !user.deviceTokens || user.deviceTokens.length === 0) {
      // Save notification even if no device tokens
      return this.createNotification(
        userId,
        title,
        body,
        type,
        data,
        relatedAppointmentId,
        relatedPaymentId,
      );
    }

    // Create notification record
    const notification = await this.createNotification(
      userId,
      title,
      body,
      type,
      data,
      relatedAppointmentId,
      relatedPaymentId,
    );

    // Send to all user's devices
    const messages: ExpoPushMessage[] = user.deviceTokens
      .filter((token) => Expo.isExpoPushToken(token))
      .map((token) => ({
        to: token,
        sound: 'default',
        title,
        body,
        data: data || {},
      }));

    if (messages.length > 0) {
      try {
        const chunks = this.expo.chunkPushNotifications(messages);
        const tickets: ExpoPushTicket[] = [];

        for (const chunk of chunks) {
          const ticketChunk = await this.expo.sendPushNotificationsAsync(chunk);
          tickets.push(...ticketChunk);
        }

        // Update notification as sent
        notification.isSent = true;
        notification.sentAt = new Date();
        await notification.save();

        return notification;
      } catch (error) {
        console.error('Error sending push notification:', error);
        return notification;
      }
    }

    return notification;
  }

  /**
   * Create notification record in database
   */
  private async createNotification(
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
      data: data || {},
      relatedAppointmentId,
      relatedPaymentId,
      isRead: false,
      isSent: false,
    });

    return notification;
  }

  /**
   * Get user notifications
   */
  async getUserNotifications(
    userId: string,
    options?: {
      isRead?: boolean;
      limit?: number;
      skip?: number;
    },
  ) {
    const query: any = { userId };

    if (options?.isRead !== undefined) {
      query.isRead = options.isRead;
    }

    const notifications = await this.notificationModel
      .find(query)
      .sort({ createdAt: -1 })
      .limit(options?.limit || 50)
      .skip(options?.skip || 0)
      .populate('relatedAppointmentId')
      .populate('relatedPaymentId')
      .exec();

    const total = await this.notificationModel.countDocuments(query);
    const unreadCount = await this.notificationModel.countDocuments({
      userId,
      isRead: false,
    });

    return {
      notifications,
      total,
      unreadCount,
    };
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId: string, userId: string) {
    const notification = await this.notificationModel.findOne({
      _id: notificationId,
      userId,
    });

    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    notification.isRead = true;
    notification.readAt = new Date();
    await notification.save();

    return notification;
  }

  /**
   * Mark all notifications as read
   */
  async markAllAsRead(userId: string) {
    await this.notificationModel.updateMany(
      { userId, isRead: false },
      { isRead: true, readAt: new Date() },
    );

    return { message: 'All notifications marked as read' };
  }

  /**
   * Delete notification
   */
  async deleteNotification(notificationId: string, userId: string) {
    const notification = await this.notificationModel.findOneAndDelete({
      _id: notificationId,
      userId,
    });

    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    return { message: 'Notification deleted successfully' };
  }

  /**
   * Helper methods for specific notification types
   */

  async sendAppointmentConfirmed(appointmentId: string, userId: string, appointmentDetails: any) {
    return this.sendNotification(
      userId,
      'Appointment Confirmed',
      `Your appointment for ${appointmentDetails.date} has been confirmed.`,
      'appointment_confirmed',
      { appointmentId, ...appointmentDetails },
      appointmentId,
    );
  }

  async sendAppointmentReminder(appointmentId: string, userId: string, appointmentDetails: any) {
    return this.sendNotification(
      userId,
      'Appointment Reminder',
      `Reminder: You have an appointment tomorrow at ${appointmentDetails.time}.`,
      'appointment_reminder',
      { appointmentId, ...appointmentDetails },
      appointmentId,
    );
  }

  async sendAppointmentCancelled(appointmentId: string, userId: string, reason: string) {
    return this.sendNotification(
      userId,
      'Appointment Cancelled',
      `Your appointment has been cancelled. Reason: ${reason}`,
      'appointment_cancelled',
      { appointmentId, reason },
      appointmentId,
    );
  }

  async sendPaymentReceived(paymentId: string, userId: string, amount: number) {
    return this.sendNotification(
      userId,
      'Payment Received',
      `Payment of ${amount} received successfully.`,
      'payment_received',
      { paymentId, amount },
      undefined,
      paymentId,
    );
  }

  async sendRefundProcessed(paymentId: string, userId: string, amount: number, walletCredit: number) {
    return this.sendNotification(
      userId,
      'Refund Processed',
      `Refund of ${amount} processed. ${walletCredit} added to your wallet.`,
      'refund_processed',
      { paymentId, amount, walletCredit },
      undefined,
      paymentId,
    );
  }

  async sendLeaveApproved(leaveId: string, userId: string, leaveDates: string) {
    return this.sendNotification(
      userId,
      'Leave Approved',
      `Your leave request for ${leaveDates} has been approved.`,
      'leave_approved',
      { leaveId, leaveDates },
    );
  }

  async sendLeaveRejected(leaveId: string, userId: string, reason: string) {
    return this.sendNotification(
      userId,
      'Leave Rejected',
      `Your leave request has been rejected. Reason: ${reason}`,
      'leave_rejected',
      { leaveId, reason },
    );
  }
}
