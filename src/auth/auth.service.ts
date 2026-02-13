import { Injectable } from '@nestjs/common';
import { UserService } from '../user/user.service';
import { ConfigService } from '@nestjs/config';
import { MailerService } from 'src/mailer/mailer.service';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { BadRequestException } from '@nestjs/common';
import * as crypto from 'crypto';
import { RecoverPasswordDto } from './dto/recover-password.dto';

@Injectable()
export class AuthService {
  constructor(
    private userService: UserService,
    private configService: ConfigService,
    private mailerService: MailerService,
  ) {}

  // calls LocalStrategy .
  async validateUser(username: string, pass: string): Promise<any> {
    const user = await this.userService.findOneByUsernameAsDocument(username); // requires new method
    if (!user) {
      return null;
    }
    if (user) {
      const isMatch = await this.userService.comparePassword(
        pass,
        user.passwordHash,
      );

      if (isMatch) {
        user.lastLoginAt = new Date();
        await user.save();
        const { passwordHash, ...result } = user.toObject();
        return result;
      }
    }
    return null;
  }

  async sendPasswordResetToken(loginField: string): Promise<void> {
    const user = await this.userService.findOneByLoginField(loginField);

    if (!user) {
      return;
    }

    // 15 minute
    const token = crypto.randomInt(100000, 999999).toString();
    user.resetPasswordToken = token;
    user.resetPasswordExpiresAt = new Date(Date.now() + 900000);

    await user.save();

    await this.mailerService.sendMail({
      to: user.email,
      subject: 'Password Reset Request',
      html:
        `
    <div style="background-color: #0a0a0a; color: #ffffff; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 40px; text-align: center; border-radius: 20px;">
      <div style="margin-bottom: 30px;">
        <h2 style="color: #06b6d4; text-transform: uppercase; letter-spacing: 4px; font-size: 14px; margin-bottom: 10px;">Security_Protocol</h2>
        <h1 style="font-size: 24px; font-weight: 900; letter-spacing: -1px; margin: 0; text-transform: uppercase;">Password_Restoration</h1>
      </div>

      <div style="background-color: #171717; border: 1px solid #262626; padding: 30px; border-radius: 24px; margin-bottom: 30px;">
        <p style="color: #737373; font-size: 12px; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 20px;">Your recovery fragment is ready:</p>
        
        <div style="background-color: #000000; color: #06b6d4; font-family: monospace; font-size: 32px; font-weight: bold; padding: 20px; border-radius: 12px; border: 1px dashed #06b6d4; letter-spacing: 10px; margin-bottom: 20px;">
          ${token}
        </div>

        <p style="color: #a3a3a3; font-size: 13px; line-height: 1.6;">
          Enter this code in the recovery page to establish a new access password. 
          This fragment will expire in <span style="color: #ffffff;">15 minutes</span>.
        </p>
      </div>

      <div style="border-top: 1px solid #1a1a1a; pt: 20px;">
        <p style="color: #404040; font-size: 10px; text-transform: uppercase; letter-spacing: 3px; margin-top: 20px;">
        ` +
        process.env.PROJECT_NAME +
        `         </p>
        <p style="color: #262626; font-size: 9px; margin-top: 10px;">
          If you did not initiate this request, please ignore this signal.
        </p>
      </div>
    </div>
  `,
    });
  }

  async resetPassword({ token, newPassword }: ResetPasswordDto): Promise<void> {
    const user = await this.userService.findOneByResetToken(token);

    if (!user) {
      throw new BadRequestException('Invalid or expired reset token.');
    }

    const hashedPassword = await this.userService.hashPassword(newPassword);

    user.passwordHash = hashedPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpiresAt = undefined;

    await user.save();
  }

  async recoverPasswordWithRecoveryCode({
    username,
    recoveryCode,
    newPassword,
  }: RecoverPasswordDto): Promise<void> {
    const user = await this.userService.findOneByUsernameWithCodes(username);

    if (!user || !user.recoveryCodes || user.recoveryCodes.length === 0) {
      throw new BadRequestException(
        'Kullanıcı adı veya kurtarma kodu geçersiz.',
      );
    }

    let codeIndex = -1;
    let codeMatch = false;

    for (let i = 0; i < user.recoveryCodes.length; i++) {
      const isMatch = await this.userService.comparePassword(
        recoveryCode,
        user.recoveryCodes[i],
      );
      if (isMatch) {
        codeMatch = true;
        codeIndex = i;
        break;
      }
    }

    if (!codeMatch) {
      throw new BadRequestException('Kurtarma kodu geçersiz.');
    }

    const newPasswordHash = await this.userService.hashPassword(newPassword);

    user.recoveryCodes.splice(codeIndex, 1);

    user.passwordHash = newPasswordHash;
    await user.save();
  }
}
