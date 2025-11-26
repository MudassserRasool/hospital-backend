import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import emailConfig from 'src/config/email.config';

@Injectable()
export class EmailService {
  private transporter: nodemailer.Transporter;
  private config = emailConfig();

  constructor() {
    // Configure email transporter
    this.transporter = nodemailer.createTransport({
      host: this.config.sms.mailHost || 'smtp.gmail.com',
      port: parseInt(this.config.sms.mailPort || '587'),
      secure: false, // true for 465, false for other ports
      auth: {
        user: this.config.sms.mailUser, // your email
        pass: this.config.sms.mailPassword, // your email password or app password
      },
    });
  }

  async sendOtp(email: string, otp: string | number): Promise<void> {
    try {
      const mailOptions = {
        from: `"Your App Name" <${this.config.sms.mailFrom}>`,
        to: email,
        subject: 'Your OTP Verification Code',
        html: `
          <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333;">OTP Verification</h2>
            <p style="font-size: 16px; color: #555;">
              Your One-Time Password (OTP) for verification is:
            </p>
            <div style="background-color: #f4f4f4; padding: 15px; text-align: center; margin: 20px 0; border-radius: 8px;">
              <span style="font-size: 32px; font-weight: bold; color: #4CAF50; letter-spacing: 5px;">
                ${otp}
              </span>
            </div>
            <p style="font-size: 14px; color: #777;">
              This OTP will expire in 10 minutes. Please do not share this code with anyone.
            </p>
            <p style="font-size: 14px; color: #777;">
              If you didn't request this code, please ignore this email.
            </p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
            <p style="font-size: 12px; color: #999;">
              This is an automated email. Please do not reply.
            </p>
          </div>
        `,
      };

      await this.transporter.sendMail(mailOptions);
      console.log(`OTP sent successfully to ${email}`);
    } catch (error) {
      console.error('Error sending OTP email:', error);
      throw new Error('Failed to send OTP email');
    }
  }

  // Optional: Verify transporter configuration
  async verifyConnection(): Promise<boolean> {
    try {
      await this.transporter.verify();
      console.log('Email server is ready');
      return true;
    } catch (error) {
      console.error('Email server connection failed:', error);
      return false;
    }
  }
}
