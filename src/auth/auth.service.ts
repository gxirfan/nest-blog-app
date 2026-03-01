import { BadRequestException, Injectable } from '@nestjs/common';
import { UserService } from '../user/user.service';
import { MailerService } from 'src/mailer/mailer.service';
import { ResetPasswordDto } from './dto/reset-password.dto';
import * as crypto from 'crypto';
import { RecoverPasswordDto } from './dto/recover-password.dto';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class AuthService {
  constructor(
    private userService: UserService,
    private mailerService: MailerService,
    private prisma: PrismaService,
  ) {}

  async validateUser(loginField: string, pass: string): Promise<any> {
    const user = await this.userService.findOneByLoginField(loginField);

    if (!user) return null;

    const isMatch = await this.userService.comparePassword(
      pass,
      user.passwordHash,
    );

    if (isMatch) {
      await this.prisma.user.update({
        where: { id: user.id },
        data: { lastLoginAt: new Date() },
      });

      const { passwordHash, recoveryCodes, ...result } = user;
      return result;
    }

    return null;
  }

  async sendPasswordResetToken(loginField: string): Promise<void> {
    const user = await this.userService.findOneByLoginField(loginField);

    if (!user) return;

    const token = crypto.randomInt(100000, 999999).toString();
    const expiresAt = new Date(Date.now() + 900000);

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        resetPasswordToken: token,
        resetPasswordExpiresAt: expiresAt,
      },
    });

    await this.mailerService.sendMail({
      to: user.email,
      subject: 'Password Reset Request',
      html: this.getPasswordResetHtml(token),
    });
  }

  async resetPassword({ token, newPassword }: ResetPasswordDto): Promise<void> {
    const user = await this.userService.findOneByResetToken(token);

    if (!user) {
      throw new BadRequestException('Invalid or expired reset token.');
    }

    const hashedPassword = await this.userService.hashPassword(newPassword);

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash: hashedPassword,
        resetPasswordToken: null,
        resetPasswordExpiresAt: null,
      },
    });
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
    for (let i = 0; i < user.recoveryCodes.length; i++) {
      const isMatch = await this.userService.comparePassword(
        recoveryCode,
        user.recoveryCodes[i],
      );
      if (isMatch) {
        codeIndex = i;
        break;
      }
    }

    if (codeIndex === -1) {
      throw new BadRequestException('Kurtarma kodu geçersiz.');
    }

    const newPasswordHash = await this.userService.hashPassword(newPassword);

    const updatedCodes = [...user.recoveryCodes];
    updatedCodes.splice(codeIndex, 1);

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash: newPasswordHash,
        recoveryCodes: updatedCodes,
      },
    });
  }

  private getPasswordResetHtml(token: string): string {
    return `
    <div style="background-color: #0a0a0a; color: #ffffff; font-family: sans-serif; padding: 40px; text-align: center; border-radius: 20px;">
      <h2 style="color: #06b6d4;">Security_Protocol</h2>
      <div style="background-color: #171717; padding: 30px; border-radius: 24px; margin: 20px 0;">
        <p style="color: #737373;">Your recovery fragment is ready:</p>
        <div style="font-size: 32px; font-weight: bold; color: #06b6d4; letter-spacing: 10px;">
          ${token}
        </div>
        <p style="color: #a3a3a3;">Valid for 15 minutes.</p>
      </div>
    </div>`;
  }
}
