import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  HttpException,
  HttpStatus,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UserRole, Prisma, UserGender } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import {
  UpdateMeDto,
  UpdateUserByAdminDto,
  UpdateUserPasswordDto,
} from './dto/update-user.dto';
import { CreateUserRequestDto } from './dto/create-user.dto';
import * as crypto from 'crypto';
import { UserEntity } from './entities/user.entity';

@Injectable()
export class UserService {
  constructor(private readonly prisma: PrismaService) {}

  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 10);
  }

  async comparePassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  async isUsernameAvailable(username: string): Promise<boolean> {
    const count = await this.prisma.user.count({
      where: { username: username.toLowerCase() },
    });
    return count === 0;
  }

  async create(
    userDto: CreateUserRequestDto,
  ): Promise<UserEntity & { recoveryCodes: string[] }> {
    try {
      const hashedPassword = await this.hashPassword(userDto.password);

      const { password, ...prismaData } = userDto;
      const savedUser = await this.prisma.user.create({
        data: {
          ...prismaData,
          username: userDto.username.toLowerCase(),
          email: userDto.email.toLowerCase(),
          passwordHash: hashedPassword,
          nickname: userDto.nickname || userDto.username,
        },
      });

      const plainRecoveryCodes = await this.generateAndSaveRecoveryCodes(
        savedUser.id,
      );

      return {
        ...savedUser,
        recoveryCodes: plainRecoveryCodes,
      };
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException('Username or email is already taken.');
      }
      throw new InternalServerErrorException('User registration failed.');
    }
  }

  async findAll(): Promise<UserEntity[]> {
    return this.prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOneByIdAsDocument(id: number): Promise<UserEntity | null> {
    return this.prisma.user.findUnique({ where: { id } });
  }

  async findOneByUsernameAsDocument(loginField: string): Promise<UserEntity> {
    const user = await this.prisma.user.findFirst({
      where: {
        OR: [{ username: loginField }, { email: loginField }],
      },
    });

    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async findOneById(id: number): Promise<UserEntity> {
    const user = await this.prisma.user.findUnique({
      where: { id: Number(id) },
    });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async findOneByUsername(username: string): Promise<UserEntity> {
    const user = await this.prisma.user.findUnique({ where: { username } });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async findOneByLoginField(loginField: string): Promise<UserEntity> {
    const user = await this.prisma.user.findFirst({
      where: {
        OR: [{ email: loginField.toLowerCase() }, { username: loginField }],
      },
    });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async findOneByResetToken(token: string): Promise<UserEntity> {
    const user = await this.prisma.user.findFirst({
      where: {
        resetPasswordToken: token,
        resetPasswordExpiresAt: { gt: new Date() },
      },
    });
    if (!user) throw new NotFoundException('User token invalid or expired');
    return user;
  }

  async generateAndSaveRecoveryCodes(userId: number): Promise<string[]> {
    const NUMBER_OF_CODES = 5;
    const codes: string[] = [];
    const hashedCodes: string[] = [];

    for (let i = 0; i < NUMBER_OF_CODES; i++) {
      const code = crypto.randomBytes(4).toString('hex').toUpperCase();
      codes.push(code);
      const hashed = await this.hashPassword(code);
      hashedCodes.push(hashed);
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: { recoveryCodes: hashedCodes },
    });

    return codes;
  }

  async findOneByUsernameWithCodes(username: string): Promise<UserEntity> {
    const user = await this.prisma.user.findUnique({
      where: { username },
    });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async findOneByUsernameForPublicProfile(
    username: string,
  ): Promise<UserEntity> {
    const user = await this.prisma.user.findUnique({
      where: { username },
    });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async update(id: number, data: UpdateMeDto): Promise<UserEntity> {
    try {
      return await this.prisma.user.update({
        where: { id },
        data,
      });
    } catch (e) {
      throw new NotFoundException('User not found');
    }
  }

  async updateUserMedia(
    userId: number,
    updatePayload: { avatar?: string; cover?: string },
  ): Promise<UserEntity> {
    return this.update(userId, updatePayload);
  }

  async updatePassword(
    id: number,
    dto: UpdateUserPasswordDto,
  ): Promise<UserEntity> {
    const user = await this.findOneById(id);

    const isMatch = await this.comparePassword(
      dto.oldPassword,
      user.passwordHash,
    );
    if (!isMatch) throw new BadRequestException('Old password is incorrect');

    const newPasswordHash = await this.hashPassword(dto.newPassword);
    return this.prisma.user.update({
      where: { id },
      data: { passwordHash: newPasswordHash },
    });
  }

  async updateUserById(
    id: number,
    updateDto: UpdateUserByAdminDto,
    adminId: number,
  ): Promise<UserEntity> {
    const [existingUser, adminUser] = await Promise.all([
      this.findOneById(id),
      this.findOneById(adminId),
    ]);

    if (existingUser.role === UserRole.ADMIN) {
      throw new ForbiddenException(
        'Admin accounts cannot be modified via this endpoint.',
      );
    }

    if (
      adminUser.role !== UserRole.ADMIN &&
      adminUser.role !== UserRole.MODERATOR
    ) {
      throw new ForbiddenException('Only admin or moderator can update user.');
    }

    if (adminUser.role === existingUser.role) {
      throw new ForbiddenException(
        'You cannot update a user with the same role.',
      );
    }

    if (adminUser.role === UserRole.MODERATOR) {
      if (
        updateDto.role === UserRole.ADMIN ||
        updateDto.role === UserRole.MODERATOR
      ) {
        throw new ForbiddenException(
          'Moderators cannot promote users to Admin/Moderator.',
        );
      }
    }

    return this.prisma.user.update({
      where: { id },
      data: updateDto as Prisma.UserUpdateInput,
    });
  }

  async updatePasswordById(
    id: number,
    newPassword: string,
    adminId: number,
  ): Promise<UserEntity> {
    const [existingUser, adminUser] = await Promise.all([
      this.findOneById(id),
      this.findOneById(adminId),
    ]);

    if (existingUser.role === UserRole.ADMIN) {
      throw new ForbiddenException(
        'Admin password cannot be changed via this endpoint.',
      );
    }

    if (adminUser.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Only admin can update user password.');
    }

    const hashedPassword = await this.hashPassword(newPassword);
    return this.prisma.user.update({
      where: { id },
      data: { passwordHash: hashedPassword },
    });
  }

  async deleteUserById(id: number, adminId: number): Promise<UserEntity> {
    const [existingUser, adminUser] = await Promise.all([
      this.findOneById(id),
      this.findOneById(adminId),
    ]);

    if (existingUser.role === UserRole.ADMIN) {
      throw new ForbiddenException('Admin accounts cannot be deleted.');
    }

    if (adminUser.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Only admin can delete user.');
    }

    return this.prisma.user.delete({ where: { id } });
  }
}
