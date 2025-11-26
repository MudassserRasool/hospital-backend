import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import * as bcrypt from 'bcrypt';
import { Model } from 'mongoose';
import { EmailService } from 'src/common/service/email/email.service';
import { SmsService } from 'src/common/service/sms/sms.service';
import { UserRole } from '../../common/constants/roles.constant';
import { HospitalsService } from '../hospitals/hospitals.service';
import { User, UserDocument } from '../users/entities/user.entity';
import { GoogleAuthDto } from './dto/google-auth.dto';
import { LoginCredentialsDto } from './dto/login-credentials.dto';
import { RegisterCredentialsDto } from './dto/register-credentials.dto';
import { UpdateProfileDto } from './dto/update-auth.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private jwtService: JwtService,
    private configService: ConfigService,
    private hospitalsService: HospitalsService,
    private smsService: SmsService,
    private emailService: EmailService,
  ) {}

  // Register user with email/password (for Super Admin, Owner, Receptionist)
  async registerWithCredentials(dto: RegisterCredentialsDto) {
    // Check if user already exists
    const existingUser = await this.userModel.findOne({ email: dto.email });
    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(dto.password, 10);

    // Create user
    const user = await this.userModel.create({
      email: dto.email,
      password: hashedPassword,
      firstName: dto.firstName,
      lastName: dto.lastName,
      role: dto.role,
      phone: dto.phone,
      hospitalId: dto.hospitalId,
      isActive: true,
      isBlocked: false,
    });

    // send random 4 digit otp on phone number
    const otp = Math.floor(1000 + Math.random() * 9000);
    // await this.smsService.sendOtp(dto.phone, otp);
    await this.emailService.sendOtp(dto.email, otp);

    user.otp = otp;
    await user.save();

    return {
      message: 'OTP sent successfully',
    };
  }

  // Login with email/password
  async loginWithCredentials(dto: LoginCredentialsDto) {
    // Find user with password field
    const user = await this.userModel
      .findOne({ email: dto.email })
      .select('+password');

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Check if user has password (credential user)
    if (!user.password) {
      throw new UnauthorizedException('Please login with Google');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(dto.password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Check if user is active
    if (!user.isActive) {
      throw new UnauthorizedException('Account is inactive');
    }

    // Check if user is blocked
    if (user.isBlocked) {
      throw new UnauthorizedException('Account is blocked');
    }

    // Update last login
    user.lastLoginAt = new Date();
    await user.save();

    // Generate tokens
    const tokens = await this.generateTokens(user);

    // Save refresh token
    await this.saveRefreshToken(
      (user._id as any).toString(),
      tokens.refreshToken,
    );

    return {
      user: this.sanitizeUser(user),
      ...tokens,
    };
  }

  // Register/Login with Google OAuth
  async loginWithGoogle(dto: GoogleAuthDto) {
    // Find user by Google ID or email
    let user = await this.userModel.findOne({
      $or: [{ googleId: dto.googleId }, { email: dto.email }],
    });

    if (user) {
      // Update Google ID if not set
      if (!user.googleId) {
        user.googleId = dto.googleId;
      }

      // Update profile picture if provided
      if (dto.profilePicture) {
        user.profilePicture = dto.profilePicture;
      }

      // Update last login
      user.lastLoginAt = new Date();
      await user.save();
    } else {
      // Create new user
      user = await this.userModel.create({
        googleId: dto.googleId,
        email: dto.email,
        firstName: dto.firstName,
        lastName: dto.lastName,
        role: dto.role,
        profilePicture: dto.profilePicture,
        phone: dto.phone,
        hospitalId: dto.hospitalId,
        isActive: true,
        isBlocked: false,
        lastLoginAt: new Date(),
      });
    }

    // Check if user is active
    if (!user.isActive) {
      throw new UnauthorizedException('Account is inactive');
    }

    // Check if user is blocked
    if (user.isBlocked) {
      throw new UnauthorizedException('Account is blocked');
    }

    // Generate tokens
    const tokens = await this.generateTokens(user);

    // Save refresh token
    await this.saveRefreshToken(
      (user._id as any).toString(),
      tokens.refreshToken,
    );

    return {
      user: this.sanitizeUser(user),
      ...tokens,
    };
  }

  // verify otp and genrate token for user
  async authOtpVerification(phone: string, otp: string | number) {
    const user = await this.userModel.findOne({ phone });
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    // Check if OTP exists
    if (!user.otp) {
      throw new UnauthorizedException('No OTP found. Please request a new OTP');
    }

    // Check if OTP matches
    if (user.otp !== otp) {
      throw new UnauthorizedException('Invalid OTP');
    }

    // Check if OTP has expired (15 minutes)
    // Using updatedAt as proxy for when OTP was set
    if (
      user.updatedAt &&
      new Date(user.updatedAt).getTime() + 1000 * 60 * 15 < Date.now()
    ) {
      throw new UnauthorizedException(
        'OTP has expired. Please request a new OTP',
      );
    }

    user.isVerified = true;
    user.otp = undefined as any; // Clear OTP after successful verification
    await user.save();
    const tokens = await this.generateTokens(user);
    await this.saveRefreshToken(
      (user._id as any).toString(),
      tokens.refreshToken,
    );
    return {
      user: this.sanitizeUser(user),
      ...tokens,
    };
  }

  // check if allow to send otp because of rate limit
  private async checkIfAllowToResendOtp(phone: string) {
    const user = await this.userModel.findOne({ phone });
    if (!user) {
      throw new UnauthorizedException('User not found');
    }
    if (user.isVerified) {
      throw new UnauthorizedException('User is already verified');
    }
    // Check if OTP was sent within the last 30 minutes (rate limiting)
    // Using updatedAt as proxy for when OTP was last sent/updated
    if (
      user.updatedAt &&
      new Date(user.updatedAt).getTime() + 1000 * 60 * 30 > Date.now()
    ) {
      throw new UnauthorizedException(
        'Please wait 30 minutes before requesting a new OTP',
      );
    }
    return true;
  }

  async resendOtp(phone: string) {
    // checkIfAllowToResendOtp will throw if user not found or not allowed
    await this.checkIfAllowToResendOtp(phone);

    // Fetch user to update OTP (checkIfAllowToResendOtp already validated user exists)
    const user = await this.userModel.findOne({ phone });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const otp = Math.floor(1000 + Math.random() * 9000);
    // await this.smsService.sendOtp(phone, otp);
    await this.emailService.sendOtp(user.email, otp);

    user.otp = otp;
    await user.save();
    return { message: 'OTP resent successfully' };
  }

  async updatePassword(phone: string, password: string, otp: string | number) {
    const user = await this.userModel.findOne({ phone });
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    // Check if user is active
    if (!user.isActive) {
      throw new UnauthorizedException('Account is inactive');
    }

    // Check if user is blocked
    if (user.isBlocked) {
      throw new UnauthorizedException('Account is blocked');
    }

    // Check if OTP exists
    if (!user.otp) {
      throw new UnauthorizedException('No OTP found. Please request a new OTP');
    }

    // Check if OTP matches
    if (user.otp !== otp) {
      throw new UnauthorizedException('Invalid OTP');
    }

    // Check if OTP has expired (15 minutes)
    // Using updatedAt as proxy for when OTP was set
    if (
      user.updatedAt &&
      new Date(user.updatedAt).getTime() + 1000 * 60 * 15 < Date.now()
    ) {
      throw new UnauthorizedException(
        'OTP has expired. Please request a new OTP',
      );
    }

    user.password = await bcrypt.hash(password, 10);
    user.otp = undefined as any;
    await user.save();

    return {
      message: 'Password updated successfully, please login with new password',
      user: this.sanitizeUser(user),
    };
  }

  // Refresh access token
  async refreshToken(refreshToken: string) {
    try {
      // Verify refresh token
      const payload = this.jwtService.verify(refreshToken, {
        secret:
          this.configService.get<string>('jwt.refreshSecret') ||
          this.configService.get<string>('JWT_REFRESH_SECRET'),
      });

      // Find user and check if refresh token exists
      const user = await this.userModel
        .findById(payload.sub)
        .select('+refreshTokens');

      if (!user || !user.refreshTokens?.includes(refreshToken)) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      // Check if user is active
      if (!user.isActive || user.isBlocked) {
        throw new UnauthorizedException('Account is inactive or blocked');
      }

      // Generate new tokens
      const tokens = await this.generateTokens(user);

      // Remove old refresh token and save new one
      await this.removeRefreshToken((user._id as any).toString(), refreshToken);
      await this.saveRefreshToken(
        (user._id as any).toString(),
        tokens.refreshToken,
      );

      return tokens;
    } catch (error) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }

  // Logout
  async logout(userId: string, refreshToken: string) {
    await this.removeRefreshToken(userId, refreshToken);
    return { message: 'Logged out successfully' };
  }

  // Get user profile
  async getProfile(userId: string) {
    const user = await this.userModel
      .findById(userId)
      .populate('hospitalId', 'name logo');
    if (!user) {
      throw new UnauthorizedException('User not found');
    }
    return this.sanitizeUser(user);
  }

  // Update user profile
  async updateProfile(userId: string, dto: UpdateProfileDto) {
    const user = await this.userModel.findByIdAndUpdate(userId, dto, {
      new: true,
    });
    if (!user) {
      throw new UnauthorizedException('User not found');
    }
    return this.sanitizeUser(user);
  }

  // Generate JWT tokens
  private async generateTokens(user: any) {
    const payload = {
      sub: (user._id as any).toString(),
      email: user.email,
      role: user.role,
    };

    const secret =
      this.configService.get<string>('jwt.secret') ||
      this.configService.get<string>('JWT_SECRET') ||
      'default-secret';
    const expiresIn = this.configService.get<string>('jwt.expiresIn') || '1d';
    const refreshSecret =
      this.configService.get<string>('jwt.refreshSecret') ||
      this.configService.get<string>('JWT_REFRESH_SECRET') ||
      'default-refresh-secret';
    const refreshExpiresIn =
      this.configService.get<string>('jwt.refreshExpiresIn') || '7d';

    const accessToken = this.jwtService.sign(payload, {
      secret,
      expiresIn,
    } as any);

    const refreshToken = this.jwtService.sign(payload, {
      secret: refreshSecret,
      expiresIn: refreshExpiresIn,
    } as any);

    return {
      accessToken,
      refreshToken,
    };
  }

  // Save refresh token
  private async saveRefreshToken(userId: string, refreshToken: string) {
    await this.userModel.findByIdAndUpdate(userId, {
      $push: { refreshTokens: refreshToken },
    });
  }

  // Remove refresh token
  private async removeRefreshToken(userId: string, refreshToken: string) {
    await this.userModel.findByIdAndUpdate(userId, {
      $pull: { refreshTokens: refreshToken },
    });
  }

  // Sanitize user data (remove sensitive fields)
  private sanitizeUser(user: any) {
    const userObj = user.toObject ? user.toObject() : user;
    delete userObj.password;
    delete userObj.refreshTokens;
    return userObj;
  }

  // generate gest token by using mobile package id
  async generateGestToken(mobilePackageId: string) {
    const hospital =
      await this.hospitalsService.getMobilePackageId(mobilePackageId);
    if (!hospital) {
      throw new NotFoundException('Hospital not found');
    }

    // Generate a guest token for the hospital
    const payload = {
      hospitalId: (hospital._id as any).toString(),
      mobilePackageId: hospital.mobilePackageId,
      type: 'guest',
    };

    const guestSecret =
      this.configService.get<string>('jwt.guestSecret') ||
      this.configService.get<string>('JWT_GUEST_SECRET') ||
      'default-guest-secret';

    const guestToken = this.jwtService.sign(payload, {
      secret: guestSecret,
      expiresIn: '30d', // Guest tokens last 30 days
    } as any);

    // create a dummy gest user
    const gestUser = await this.userModel.create({
      email: `gest-${mobilePackageId}${Math.random().toString(36).substring(2, 15)}@gest.com`,
      password: Math.random().toString(36).substring(2, 15),
      role: UserRole.PATIENT,
      hospitalId: (hospital._id as any).toString(),
      isActive: true,
    });

    return { guestToken, gestUser };
  }
}
